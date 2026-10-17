import { prisma } from '@/lib/db'
import { sendLinePush, type LineMessage, type SendLineResult } from '@/lib/line'
import { CLOSED_STAGES, STAGE_LABELS, type Stage } from '@/lib/constants'
import { resolveOwner } from '@/lib/sla-engine'
import { getIntegrationConfig } from '@/lib/services/integration-config.service'

export interface SlaClockRiskCheck {
  atRisk: boolean
  remainingMinutes: number
  ratioRemaining: number
}

export interface SlaWarningMessageInput {
  jobNo: string
  productName: string
  stageLabel: string
  stepName: string
  ownerDept: string
  remainingMinutes: number
  baseUrl: string
}

export type LinePushFn = (toUserId: string, messages: LineMessage[]) => Promise<SendLineResult>

/**
 * Checks whether a running SLA clock has strictly less than 20% of its total allotted time remaining
 * (and has not yet breached).
 */
export function isSlaClockBelowTwentyPercent(
  clock: { startedAt: Date; dueAt: Date; status: string; breached: boolean },
  now: Date = new Date()
): SlaClockRiskCheck {
  if (clock.status !== 'RUNNING' || clock.breached) {
    return { atRisk: false, remainingMinutes: 0, ratioRemaining: 0 }
  }
  const totalMs = clock.dueAt.getTime() - clock.startedAt.getTime()
  const remainingMs = clock.dueAt.getTime() - now.getTime()
  if (totalMs <= 0 || remainingMs <= 0) {
    return { atRisk: false, remainingMinutes: 0, ratioRemaining: 0 }
  }
  const ratioRemaining = remainingMs / totalMs
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60_000))
  return {
    atRisk: ratioRemaining > 0 && ratioRemaining < 0.2,
    remainingMinutes,
    ratioRemaining,
  }
}

function ownerQueuePath(ownerDept: string): string {
  switch (ownerDept) {
    case 'CS':
      return '/cs'
    case 'GR':
      return '/gr'
    case 'DC':
      return '/dc'
    case 'VD':
      return '/vd'
    default:
      return '/jobs'
  }
}

export function buildSlaWarningLineMessage(input: SlaWarningMessageInput): string {
  const cleanBase = input.baseUrl.replace(/\/$/, '')
  const path = ownerQueuePath(input.ownerDept)
  return [
    '⚠️ แจ้งเตือน SLA เหลือเวลา < 20%',
    `เลขที่ใบแจ้งซ่อม: ${input.jobNo}`,
    `สินค้า: ${input.productName}`,
    `สถานะปัจจุบัน: ${input.stageLabel}`,
    `ขั้นตอน SLA: ${input.stepName} (ผู้รับผิดชอบ: ${input.ownerDept})`,
    `เวลาคงเหลือ: ${input.remainingMinutes} นาที`,
    `เปิดดูคิวงาน: ${cleanBase}${path}`,
  ].join('\n')
}

export async function findSlaOwnerLineRecipients(
  ownerDept: string,
  branchId: string,
  vendorCenterId: string | null
): Promise<Array<{ id: string; lineUserId: string }>> {
  if (ownerDept === 'CS' || ownerDept === 'GR') {
    const users = await prisma.user.findMany({
      where: {
        role: ownerDept,
        active: true,
        lineUserId: { not: null },
        OR: [{ siteId: branchId }, { siteId: null }],
      },
      select: { id: true, lineUserId: true },
    })
    return users.flatMap(u => (u.lineUserId ? [{ id: u.id, lineUserId: u.lineUserId }] : []))
  }

  if (ownerDept === 'DC') {
    const users = await prisma.user.findMany({
      where: { role: 'DC', active: true, lineUserId: { not: null } },
      select: { id: true, lineUserId: true },
    })
    return users.flatMap(u => (u.lineUserId ? [{ id: u.id, lineUserId: u.lineUserId }] : []))
  }

  if (ownerDept === 'VD') {
    const users = await prisma.user.findMany({
      where: {
        role: 'VD',
        active: true,
        lineUserId: { not: null },
        ...(vendorCenterId ? { OR: [{ vendorCenterId }, { vendorCenterId: null }] } : {}),
      },
      select: { id: true, lineUserId: true },
    })
    return users.flatMap(u => (u.lineUserId ? [{ id: u.id, lineUserId: u.lineUserId }] : []))
  }

  // Fallback for TPL / CARRIER -> notify branch GR and active ADMINs with linked LINE
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['GR', 'ADMIN'] },
      active: true,
      lineUserId: { not: null },
      OR: [{ siteId: branchId }, { siteId: null }],
    },
    select: { id: true, lineUserId: true },
  })
  return users.flatMap(u => (u.lineUserId ? [{ id: u.id, lineUserId: u.lineUserId }] : []))
}

function hasClockWarningEvent(
  events: Array<{ payload: unknown }>,
  clockId: string
): boolean {
  return events.some(ev => {
    if (!ev.payload || typeof ev.payload !== 'object') return false
    const record = ev.payload as Record<string, unknown>
    return record.slaClockId === clockId
  })
}

/**
 * Scans running SLA clocks on active real jobs (isTest = false) and sends a one-time
 * LINE alert when remaining SLA time drops below 20%.
 */
export async function checkAndNotifySlaWarnings(
  now: Date = new Date(),
  pushFn: LinePushFn = sendLinePush
): Promise<{ checkedClocks: number; notifiedClocks: number }> {
  const runningClocks = await prisma.slaClock.findMany({
    where: {
      status: 'RUNNING',
      breached: false,
      dueAt: { gt: now },
      job: {
        isTest: false,
        stage: { notIn: CLOSED_STAGES },
      },
    },
    include: {
      slaStep: true,
      job: {
        select: {
          id: true,
          jobNo: true,
          productName: true,
          stage: true,
          channel: true,
          branchId: true,
          vendorCenterId: true,
          events: {
            where: { type: 'SLA_WARNING_80' },
            select: { id: true, payload: true },
          },
        },
      },
    },
  })

  let notifiedClocks = 0
  const baseUrl = (await getIntegrationConfig()).APP_BASE_URL || 'https://vhomesvc.online'

  for (const clock of runningClocks) {
    const risk = isSlaClockBelowTwentyPercent(clock, now)
    if (!risk.atRisk) continue
    if (hasClockWarningEvent(clock.job.events, clock.id)) continue

    const ownerDept = resolveOwner(clock.slaStep.ownerDept, clock.slaStep.code, clock.job.channel)
    const recipients = await findSlaOwnerLineRecipients(
      ownerDept,
      clock.job.branchId,
      clock.job.vendorCenterId
    )
    if (recipients.length === 0) continue

    const stageLabel = STAGE_LABELS[clock.job.stage as Stage] ?? clock.job.stage
    const text = buildSlaWarningLineMessage({
      jobNo: clock.job.jobNo,
      productName: clock.job.productName,
      stageLabel,
      stepName: clock.slaStep.name,
      ownerDept,
      remainingMinutes: risk.remainingMinutes,
      baseUrl,
    })

    await Promise.all(recipients.map(r => pushFn(r.lineUserId, [{ type: 'text', text }])))

    await prisma.jobEvent.create({
      data: {
        jobId: clock.job.id,
        type: 'SLA_WARNING_80',
        actorRole: 'SYSTEM',
        note: `แจ้งเตือน LINE SLA เหลือ ${risk.remainingMinutes} นาที (<20%) ขั้น ${clock.slaStep.code}`,
        payload: {
          slaClockId: clock.id,
          slaStepCode: clock.slaStep.code,
          ownerDept,
          remainingMinutes: risk.remainingMinutes,
        },
      },
    })

    notifiedClocks += 1
  }

  return { checkedClocks: runningClocks.length, notifiedClocks }
}
