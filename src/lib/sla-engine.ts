// SLA Engine (05_business_rules.md §4)
import type { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from './db'

type Tx = Prisma.TransactionClient | PrismaClient

export interface SlaJobCtx {
  id: string
  type: string
  channel: string | null
  vendorCenterId: string | null
}

function splitEvents(s: string): string[] {
  return s.split(/[,|]/).map(x => x.trim()).filter(Boolean)
}

function conditionOk(condition: string | null, job: SlaJobCtx): boolean {
  if (!condition) return true
  return condition.split(/[;&]/).every(c => {
    const m = c.trim().match(/^(\w+)\s*(!=|=)\s*(\w+)$/)
    if (!m) return true
    const [, field, op, val] = m
    const actual = field === 'channel' ? job.channel : field === 'type' ? job.type : null
    return op === '=' ? actual === val : actual !== val
  })
}

/** Owner resolve (05 §4.2) */
export function resolveOwner(ownerDept: string, stepCode: string, channel: string | null): string {
  if (ownerDept !== 'CARRIER') return ownerDept
  if (stepCode === 'VD_RECEIVE' && channel === 'DC') return 'VD'
  if (channel === 'DC') return 'DC'
  if (channel === 'DSD') return 'VD'
  if (channel === 'TPL') return 'TPL'
  return 'CARRIER'
}

async function stepHours(tx: Tx, step: { id: number; code: string; hours: number }, job: SlaJobCtx): Promise<number> {
  if (job.vendorCenterId) {
    const ov = await tx.slaStep_Override.findUnique({ where: { slaStepId_centerId: { slaStepId: step.id, centerId: job.vendorCenterId } } })
    if (ov) return ov.hoursOverride
    if (step.code === 'VD_REPAIR') {
      const c = await tx.vendorCenter.findUnique({ where: { id: job.vendorCenterId }, include: { vendorParent: true } })
      if (c) return (c.repairSlaDaysOverride ?? c.vendorParent.defaultRepairSlaDays) * 24
    }
  }
  return step.hours
}

/**
 * Called on every event affecting a job (after stage update) — stop/start/pause clocks
 */
export async function slaOnEvent(tx: Tx, job: SlaJobCtx, eventType: string, at: Date = new Date()) {
  const steps = await tx.slaStep.findMany({ where: { active: true }, orderBy: { seq: 'asc' } })
  const clocks = await tx.slaClock.findMany({ where: { jobId: job.id } })

  // pause / resume
  if (eventType === 'REPAIR_PAUSED' || eventType === 'REPAIR_RESUMED') {
    for (const c of clocks) {
      const step = steps.find(s => s.id === c.slaStepId)
      if (!step?.pausable) continue
      if (eventType === 'REPAIR_PAUSED' && c.status === 'RUNNING') {
        await tx.slaClock.update({ where: { id: c.id }, data: { status: 'PAUSED', pausedAt: at } })
      }
      if (eventType === 'REPAIR_RESUMED' && c.status === 'PAUSED' && c.pausedAt) {
        const addMs = at.getTime() - c.pausedAt.getTime()
        await tx.slaClock.update({
          where: { id: c.id },
          data: {
            status: 'RUNNING',
            pausedAt: null,
            pausedMinutes: c.pausedMinutes + Math.floor(addMs / 60000),
            dueAt: new Date(c.dueAt.getTime() + addMs),
          },
        })
      }
    }
    return
  }

  // job closed / cancelled -> stop every running clock and return early
  if (eventType === 'JOB_CLOSED' || eventType === 'JOB_CANCELLED') {
    for (const c of clocks) {
      if (c.status === 'STOPPED') continue
      await stopClock(tx, c, at)
      c.status = 'STOPPED'
    }
    return
  }

  for (const step of steps) {
    const applies = step.appliesTo.split(',').map(s => s.trim()).includes(job.type)
    if (!applies) continue
    const clock = clocks.find(c => c.slaStepId === step.id)

    // stop
    if (clock && clock.status !== 'STOPPED' && splitEvents(step.stopEvent).includes(eventType)) {
      await stopClock(tx, clock, at)
    }

    // start
    if (splitEvents(step.startEvent).includes(eventType) && conditionOk(step.condition, job)) {
      // special cases (05 §4.1 notes)
      if (step.code === 'VD_RECEIVE' && job.channel === 'DC' && eventType === 'OUTBOUND_HANDED_OFF') continue
      if (step.code === 'GR_RETURN_RECEIVE' && job.channel === 'DC' && eventType === 'RETURN_PACKED') continue
      if (step.code === 'VD_RETURN_PACK' && eventType === 'CUSTOMER_REJECTED' && job.type !== 'CUSTOMER') continue

      const hours = await stepHours(tx, step, job)
      if (clock && eventType === 'QUOTE_REVISED') {
        // restart
        await tx.slaClock.update({
          where: { id: clock.id },
          data: {
            status: 'RUNNING',
            startedAt: at,
            dueAt: new Date(at.getTime() + hours * 3600000),
            stoppedAt: null,
            pausedAt: null,
            pausedMinutes: 0,
            breached: false,
            breachedAt: null,
          },
        })
        continue
      }
      if (clock) continue
      await tx.slaClock.create({
        data: {
          jobId: job.id,
          slaStepId: step.id,
          status: 'RUNNING',
          startedAt: at,
          dueAt: new Date(at.getTime() + hours * 3600000),
        },
      })
    }
  }
}

async function stopClock(tx: Tx, c: { id: string; dueAt: Date; status: string; pausedAt: Date | null; pausedMinutes: number; breached: boolean }, at: Date) {
  let due = c.dueAt
  let pausedMinutes = c.pausedMinutes
  if (c.status === 'PAUSED' && c.pausedAt) {
    const addMs = at.getTime() - c.pausedAt.getTime()
    due = new Date(due.getTime() + addMs)
    pausedMinutes += Math.floor(addMs / 60000)
  }
  const breached = c.breached || at.getTime() > due.getTime()
  await tx.slaClock.update({
    where: { id: c.id },
    data: {
      status: 'STOPPED',
      stoppedAt: at,
      dueAt: due,
      pausedAt: null,
      pausedMinutes,
      breached,
      breachedAt: breached ? (c.breached ? undefined : at) : null,
    },
  })
}

let lastRefresh = 0
/** mark RUNNING clocks that passed dueAt as breached (throttled to max once per minute) */
export async function refreshBreaches(force = false) {
  const now = Date.now()
  if (!force && now - lastRefresh < 60_000) return
  lastRefresh = now
  await prisma.slaClock.updateMany({
    where: { status: 'RUNNING', breached: false, dueAt: { lt: new Date(now) } },
    data: { breached: true, breachedAt: new Date(now) },
  })
}
