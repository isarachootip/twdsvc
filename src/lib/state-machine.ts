import { PrismaClient, JobStage, JobType, Channel, Role, QuoteDecision, QuoteStatus, ChargeType } from '@prisma/client'
import { prisma } from './db'
import { generateQuoteNo } from './number-generator'
import { calcQuoteTotals, calcBalance } from './fees'
import crypto from 'crypto'

export type ActionType =
  | 'open' | 'assign_vendor' | 'record_intake_payment'
  | 'gr_receive' | 'gr_pack' | 'gr_handoff'
  | 'dispatch_pickup' | 'carrier_confirm_pickup'
  | 'dc_receive_outbound' | 'dc_handoff_vd'
  | 'dc_receive_inbound' | 'dc_dispatch_confirm'
  | 'vd_receive' | 'vd_submit_quote' | 'vd_revise_quote'
  | 'vd_start_repair' | 'vd_pause_parts' | 'vd_resume_parts' | 'vd_finish_repair' | 'vd_return_pack'
  | 'customer_approve' | 'customer_reject' | 'cs_record_decision'
  | 'record_repair_payment' | 'cs_close' | 'cancel'

export interface ActionInput {
  note?: string
  location?: string
  // quote
  lines?: Array<{ type: string; description: string; unitPrice: number; quantity: number; partWaitDays?: number; partWarrantyDays?: number }>
  repairDays?: number
  vendorNote?: string
  // decision
  decision?: 'approve' | 'reject'
  reason?: string
  // dispatch
  method?: 'PRINT' | 'LINK'
  // payment
  amount?: number
  paymentMethod?: string
  posReceiptNo?: string
  // assign_vendor
  vendorCenterId?: string
  channel?: 'DC' | 'DSD' | 'TPL'
}

export interface Actor {
  userId: string
  role: string
  siteId?: string | null
  vendorCenterId?: string | null
}

type ActionResult = { success: true; job: Record<string, unknown> } | { success: false; error: string }

// Stage transitions per action
const STAGE_MAP: Record<string, { from: JobStage[]; toFn: (job: Record<string, unknown>, input: ActionInput) => JobStage }> = {
  gr_receive:          { from: [JobStage.CS_OPENED], toFn: () => JobStage.GR_RECEIVED },
  gr_pack:             { from: [JobStage.GR_RECEIVED], toFn: () => JobStage.GR_PACKED },
  gr_handoff:          { from: [JobStage.GR_PACKED], toFn: (job) => (job.channel as string) === 'DC' ? JobStage.OUTBOUND_TO_DC : JobStage.OUTBOUND_TO_VD },
  dc_receive_outbound: { from: [JobStage.OUTBOUND_TO_DC], toFn: () => JobStage.AT_DC_OUTBOUND },
  dc_handoff_vd:       { from: [JobStage.AT_DC_OUTBOUND], toFn: () => JobStage.OUTBOUND_TO_VD },
  vd_receive:          { from: [JobStage.OUTBOUND_TO_VD], toFn: () => JobStage.VD_INSPECTING },
  vd_start_repair:     { from: [JobStage.VD_INSPECTING], toFn: () => JobStage.REPAIRING },
  vd_finish_repair:    { from: [JobStage.REPAIRING], toFn: () => JobStage.RETURN_PACKING },
  vd_return_pack:      { from: [JobStage.RETURN_PACKING], toFn: (job) => (job.channel as string) === 'DC' ? JobStage.INBOUND_TO_DC : JobStage.INBOUND_TO_BRANCH },
  dc_receive_inbound:  { from: [JobStage.INBOUND_TO_DC], toFn: () => JobStage.AT_DC_INBOUND },
  dc_dispatch_confirm: { from: [JobStage.AT_DC_INBOUND], toFn: () => JobStage.INBOUND_TO_BRANCH },
  gr_receive_return:   { from: [JobStage.INBOUND_TO_BRANCH], toFn: () => JobStage.GR_RETURN_RECEIVED },
  gr_deliver_cs:       { from: [JobStage.GR_RETURN_RECEIVED], toFn: () => JobStage.READY_FOR_PICKUP },
  customer_approve:    { from: [JobStage.WAITING_APPROVAL], toFn: () => JobStage.REPAIRING },
  customer_reject:     { from: [JobStage.WAITING_APPROVAL], toFn: () => JobStage.RETURN_PACKING },
  assign_vendor:       { from: [JobStage.PENDING_VENDOR_ASSIGNMENT], toFn: () => JobStage.CS_OPENED },
}

// Role action permissions
const ROLE_ACTIONS: Record<string, string[]> = {
  CS: ['gr_receive', 'cs_record_decision', 'cs_close', 'record_intake_payment', 'record_repair_payment', 'cancel'],
  GR: ['gr_receive', 'gr_pack', 'gr_handoff', 'gr_receive_return', 'gr_deliver_cs'],
  DC: ['dispatch_pickup', 'dc_receive_outbound', 'dc_handoff_vd', 'dc_receive_inbound', 'dc_dispatch_confirm'],
  VD: ['dispatch_pickup', 'carrier_confirm_pickup', 'vd_receive', 'vd_submit_quote', 'vd_revise_quote', 'vd_start_repair', 'vd_pause_parts', 'vd_resume_parts', 'vd_finish_repair', 'vd_return_pack'],
  S2: ['cs_close'],
  ADMIN: ['*'],
  EXECUTIVE: [],
}

function canActorPerformAction(role: string, action: string): boolean {
  const allowed = ROLE_ACTIONS[role] ?? []
  return allowed.includes('*') || allowed.includes(action)
}

export async function executeAction(jobId: string, action: ActionType, input: ActionInput, actor: Actor): Promise<ActionResult> {
  // Check role permission
  if (!canActorPerformAction(actor.role, action)) {
    return { success: false, error: `Role ${actor.role} cannot perform action ${action}` }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.job.findUniqueOrThrow({
        where: { id: jobId },
        include: { charges: true, payments: true, quotes: { orderBy: { version: 'desc' }, take: 1 } },
      })

      // Data scope check
      if (['CS', 'GR', 'S2'].includes(actor.role) && actor.siteId && job.branchId !== actor.siteId) {
        throw new Error('ไม่มีสิทธิ์เข้าถึงงานของสาขาอื่น')
      }
      if (actor.role === 'VD' && actor.vendorCenterId && job.vendorCenterId !== actor.vendorCenterId) {
        throw new Error('ไม่มีสิทธิ์เข้าถึงงานของ VD อื่น')
      }

      let nextStage: JobStage = job.stage
      const eventType = action.toUpperCase()
      const now = new Date()

      // Handle special actions
      if (action === 'vd_submit_quote') {
        if (job.stage !== JobStage.VD_INSPECTING) throw new Error('งานต้องอยู่ที่ขั้นตอน VD ตรวจสอบ')
        if (!input.lines || input.lines.length === 0) throw new Error('ต้องมีรายการค่าใช้จ่ายอย่างน้อย 1 รายการ')
        const totals = calcQuoteTotals(input.lines)
        const quoteNo = await generateQuoteNo()
        await tx.quote.create({
          data: {
            jobId,
            quoteNo,
            version: 1,
            status: QuoteStatus.SENT,
            subtotal: totals.subtotal,
            vatAmount: totals.vatAmount,
            total: totals.total,
            repairDays: input.repairDays ?? 1,
            vendorNote: input.vendorNote,
            sentAt: now,
            expiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
            createdBy: actor.userId,
            lines: {
              create: input.lines.map(l => ({
                type: l.type as any,
                description: l.description,
                unitPrice: l.unitPrice,
                quantity: l.quantity,
                partWaitDays: l.partWaitDays ?? 0,
                partWarrantyDays: l.partWarrantyDays ?? 0,
              })),
            },
          },
        })
        // Create public QUOTE token
        const token = crypto.randomBytes(32).toString('base64url')
        await tx.publicToken.create({
          data: { jobId, type: 'QUOTE', token, expiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000) },
        })
        nextStage = totals.total === 0 ? JobStage.REPAIRING : JobStage.WAITING_APPROVAL

      } else if (action === 'cs_record_decision') {
        if (job.stage !== JobStage.WAITING_APPROVAL) throw new Error('งานต้องอยู่ที่ขั้นตอนรอลูกค้าอนุมัติ')
        nextStage = input.decision === 'approve' ? JobStage.REPAIRING : JobStage.RETURN_PACKING
        await tx.job.update({ where: { id: jobId }, data: { decision: input.decision === 'approve' ? QuoteDecision.APPROVED : QuoteDecision.REJECTED } })

      } else if (action === 'cs_close') {
        if (job.stage !== JobStage.READY_FOR_PICKUP) throw new Error('งานต้องอยู่ที่ขั้นตอนพร้อมรับที่สาขา')
        if (job.decision === QuoteDecision.APPROVED) {
          const balance = calcBalance(job.charges, job.payments)
          if (balance > 0) throw new Error(`ยังมียอดค้างชำระ ฿${balance}`)
        }
        nextStage = job.decision === QuoteDecision.REJECTED ? JobStage.CLOSED_NOT_REPAIRED : JobStage.CLOSED_REPAIRED
        await tx.job.update({ where: { id: jobId }, data: { closedAt: now } })

      } else if (action === 'cancel') {
        const closedStages: string[] = [JobStage.CLOSED_REPAIRED, JobStage.CLOSED_NOT_REPAIRED, JobStage.CANCELLED]
        if (closedStages.includes(job.stage as string)) {
          throw new Error('ไม่สามารถยกเลิกงานที่ปิดแล้ว')
        }
        const csAllowedStages: string[] = [JobStage.CS_OPENED, JobStage.PENDING_VENDOR_ASSIGNMENT]
        if (actor.role !== 'ADMIN' && !csAllowedStages.includes(job.stage as string)) {
          throw new Error('CS ยกเลิกได้เฉพาะขั้นตอน CS เปิดใบแจ้งซ่อม เท่านั้น')
        }
        nextStage = JobStage.CANCELLED

      } else if (action === 'vd_pause_parts') {
        await tx.slaClock.updateMany({
          where: { jobId, slaStep: { code: 'VD_REPAIR' }, status: 'RUNNING' },
          data: { status: 'PAUSED', pausedAt: now },
        })

      } else if (action === 'vd_resume_parts') {
        const clock = await tx.slaClock.findFirst({
          where: { jobId, slaStep: { code: 'VD_REPAIR' }, status: 'PAUSED' },
        })
        if (clock && clock.pausedAt) {
          const addedMs = now.getTime() - clock.pausedAt.getTime()
          const addedMin = Math.floor(addedMs / 60000)
          await tx.slaClock.update({
            where: { id: clock.id },
            data: {
              status: 'RUNNING',
              pausedAt: null,
              pausedMinutes: clock.pausedMinutes + addedMin,
              dueAt: new Date(clock.dueAt.getTime() + addedMs),
            },
          })
        }

      } else if (STAGE_MAP[action]) {
        const map = STAGE_MAP[action]
        if (!map.from.includes(job.stage)) {
          throw new Error(`ไม่สามารถทำ ${action} จากขั้นตอน ${job.stage}`)
        }
        nextStage = map.toFn(job as any, input)

      } else if (action === 'assign_vendor') {
        if (!input.vendorCenterId) throw new Error('ต้องระบุ VD')
        nextStage = JobStage.CS_OPENED
        await tx.job.update({ where: { id: jobId }, data: { vendorCenterId: input.vendorCenterId, channel: (input.channel ?? 'DC') as Channel } })
      }

      // Create event
      await tx.jobEvent.create({
        data: {
          jobId,
          type: eventType,
          fromStage: job.stage,
          toStage: nextStage,
          actorUserId: actor.userId,
          actorRole: actor.role,
          payload: input as any,
          note: input.note,
        },
      })

      // Update job stage
      const updated = await tx.job.update({
        where: { id: jobId, version: job.version },
        data: {
          stage: nextStage,
          stageEnteredAt: nextStage !== job.stage ? now : undefined,
          version: { increment: 1 },
        },
      })

      return updated
    })

    return { success: true, job: result as any }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'
    return { success: false, error: msg }
  }
}
