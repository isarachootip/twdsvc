import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { slaOnEvent } from '../sla-engine'
import { ActionType, ActionInput, Actor, ActionResult, Ctx } from './types'
import { ActionError } from './errors'
import { ACTIONS, normalizeAction } from './registry'
import {
  validateRolePermission,
  validateTenantScope,
  validateVersion,
  validateStageEligibility,
  validatePhotosAndLocation,
} from './validation'

export async function executeAction(
  jobId: string,
  action: ActionType,
  input: ActionInput = {},
  actor: Actor
): Promise<ActionResult> {
  const resolvedAction = normalizeAction(action, input)
  const def = ACTIONS[resolvedAction]
  if (!def) return { success: false, error: `ไม่รู้จัก action ${action}` }

  let isAdminOverride = false
  try {
    const roleCheck = validateRolePermission(actor, def)
    isAdminOverride = roleCheck.isAdminOverride
  } catch (e) {
    if (e instanceof ActionError) return { success: false, error: e.message, status: e.status }
    throw e
  }

  try {
    const result = await prisma.$transaction(async tx => {
      const job = await tx.job.findUnique({
        where: { id: jobId },
        include: {
          charges: true,
          payments: true,
          shipments: true,
          quotes: { include: { lines: true }, orderBy: { version: 'desc' } },
          vendorCenter: { include: { vendorParent: true } },
        },
      })
      if (!job) throw new ActionError('ไม่พบงานนี้', 404)

      validateTenantScope(actor, job)
      validateVersion(input, job)
      validateStageEligibility(def, job)

      const now = new Date()
      const c: Ctx = { tx, job, input, actor, now, extra: {}, extraEvents: [] }

      await validatePhotosAndLocation(c, def)
      await def.validate?.(c)
      await def.effects?.(c)

      const nextStage = def.to ? def.to(c) : job.stage
      const eventType = typeof def.event === 'function' ? def.event(c) : def.event

      const payload: Record<string, unknown> = { ...input }
      delete payload.photos
      delete payload.version
      if (Object.keys(c.extra).length) payload.result = c.extra

      const event = await tx.jobEvent.create({
        data: {
          jobId,
          type: eventType,
          fromStage: job.stage,
          toStage: nextStage,
          actorUserId: actor.userId,
          actorRole: isAdminOverride ? 'ADMIN_OVERRIDE' : actor.role,
          payload: payload as Prisma.InputJsonValue,
          note: input.note || input.reason || null,
        },
      })

      if (input.photos?.length) {
        await tx.attachment.createMany({
          data: input.photos.slice(0, 8).map(p => ({
            jobEventId: event.id,
            kind: eventType,
            fileName: p.fileName ?? 'photo.jpg',
            fileUrl: p.fileUrl,
            fileSize: p.fileSize ?? null,
            mimeType: p.mimeType ?? null,
            uploadedBy: actor.userId,
          })),
        })
      }

      const updated = await tx.job.update({
        where: { id: jobId, version: job.version },
        data: {
          stage: nextStage,
          stageEnteredAt: nextStage !== job.stage ? now : undefined,
          version: { increment: 1 },
        },
        select: { id: true, jobNo: true, stage: true, version: true, type: true, channel: true, vendorCenterId: true },
      })

      // SLA engine — OUTBOUND_HANDED_OFF (from tpl_delivered) must precede VD_RECEIVED (C3)
      const slaCtx = { id: updated.id, type: updated.type, channel: updated.channel, vendorCenterId: updated.vendorCenterId }
      const pre = c.extraEvents.filter(e => e === 'OUTBOUND_HANDED_OFF')
      const post = c.extraEvents.filter(e => e !== 'OUTBOUND_HANDED_OFF')
      for (const e of [...pre, eventType, ...post]) {
        await slaOnEvent(tx, slaCtx, e, now)
      }

      return { job: { id: updated.id, jobNo: updated.jobNo, stage: updated.stage, version: updated.version }, extra: c.extra }
    }, { timeout: 20000, maxWait: 10000 })

    return { success: true, ...result }
  } catch (e: unknown) {
    if (e instanceof ActionError) return { success: false, error: e.message, status: e.status }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return { success: false, error: 'ข้อมูลงานถูกเปลี่ยนแปลงโดยผู้อื่นแล้ว กรุณารีเฟรชหน้าจอ', status: 409 }
    }
    console.error('[executeAction]', action, e)
    return { success: false, error: e instanceof Error ? e.message : 'เกิดข้อผิดพลาด', status: 500 }
  }
}
