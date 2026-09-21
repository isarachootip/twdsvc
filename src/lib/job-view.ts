// Job serializer for queues / lists (04 §4, 05 §4.4, 08 §5 masking)
import type { Prisma } from '@prisma/client'
import { STAGE_LABELS, STAGE_BADGE, type Stage } from './constants'
import { resolveOwner } from './sla-engine'

export const JOB_LIST_INCLUDE = {
  branch: { select: { id: true, name: true, nickname: true, address: true } },
  vendorCenter: { select: { id: true, code: true, deliveryMethod: true, vendorParent: { select: { id: true, code: true, name: true, defaultGpPct: true, inspectionFeeCovered: true, inspectionFeeNotCovered: true, repairWarrantyDays: true } } } },
  slaClocks: { include: { slaStep: { select: { id: true, seq: true, code: true, name: true, ownerDept: true, hours: true } } } },
  charges: { select: { amount: true, type: true } },
  payments: { select: { amount: true, status: true, chargeType: true, method: true } },
  shipments: { select: { id: true, legType: true, carrier: true, status: true, trackingNo: true, driverToken: true, dispatchedAt: true, pickedUpAt: true, deliveredAt: true, createdAt: true }, orderBy: { createdAt: 'asc' as const } },
  quotes: { select: { id: true, quoteNo: true, version: true, status: true, total: true, subtotal: true, repairDays: true, sentAt: true, expiresAt: true, decidedAt: true }, orderBy: { version: 'desc' as const }, take: 1 },
  items: true,
  events: { select: { type: true, payload: true, createdAt: true }, orderBy: { createdAt: 'desc' as const }, take: 12 },
} satisfies Prisma.JobInclude

export type JobWithList = Prisma.JobGetPayload<{ include: typeof JOB_LIST_INCLUDE }>

export interface SlaInfo {
  stepCode: string
  stepName: string
  owner: string
  hoursInStep: number
  slaHours: number
  overdue: boolean
  overHours: number
  paused: boolean
}

export function clockHours(c: { startedAt: Date; stoppedAt: Date | null; pausedAt: Date | null; pausedMinutes: number; status: string }, now = new Date()): number {
  const end = c.stoppedAt ?? (c.status === 'PAUSED' && c.pausedAt ? c.pausedAt : now)
  const ms = end.getTime() - c.startedAt.getTime() - c.pausedMinutes * 60000
  return Math.max(0, ms / 3600000)
}

export function jobSla(job: Pick<JobWithList, 'slaClocks' | 'channel'>, preferCodes?: string[], now = new Date()): { primary: SlaInfo | null; overdue: boolean; overdueOwner: string | null; maxOverHours: number } {
  const running = job.slaClocks.filter(c => c.status !== 'STOPPED')
  const infos = running.map(c => {
    const due = c.status === 'PAUSED' && c.pausedAt ? new Date(c.dueAt.getTime() + (now.getTime() - c.pausedAt.getTime())) : c.dueAt
    const overdue = c.status === 'RUNNING' && now.getTime() > due.getTime()
    return {
      stepCode: c.slaStep.code,
      stepName: c.slaStep.name,
      seq: c.slaStep.seq,
      owner: resolveOwner(c.slaStep.ownerDept, c.slaStep.code, job.channel),
      hoursInStep: Math.floor(clockHours(c, now)),
      slaHours: Math.round((c.dueAt.getTime() - c.startedAt.getTime()) / 3600000 - c.pausedMinutes / 60),
      overdue,
      overHours: overdue ? (now.getTime() - due.getTime()) / 3600000 : 0,
      paused: c.status === 'PAUSED',
      startedAt: c.startedAt,
    }
  })
  let primary = null as (typeof infos)[number] | null
  if (preferCodes?.length) primary = infos.find(i => preferCodes.includes(i.stepCode)) ?? null
  if (!primary) primary = [...infos].sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime() || b.seq - a.seq)[0] ?? null
  const overdues = infos.filter(i => i.overdue).sort((a, b) => b.overHours - a.overHours)
  return {
    primary: primary ? { stepCode: primary.stepCode, stepName: primary.stepName, owner: primary.owner, hoursInStep: primary.hoursInStep, slaHours: primary.slaHours, overdue: primary.overdue, overHours: Math.round(primary.overHours), paused: primary.paused } : null,
    overdue: overdues.length > 0,
    overdueOwner: overdues[0]?.owner ?? null,
    maxOverHours: overdues[0] ? Math.round(overdues[0].overHours) : 0,
  }
}

export function calcMoney(job: Pick<JobWithList, 'charges' | 'payments'>) {
  const sum = (t: string[]) => job.charges.filter(c => t.includes(c.type)).reduce((s, c) => s + c.amount, 0)
  const paidOf = (t: string[]) => job.payments.filter(p => p.status === 'PAID' && t.includes(p.chargeType)).reduce((s, p) => s + p.amount, 0)
  const totalCharges = job.charges.reduce((s, c) => s + c.amount, 0)
  const totalPaid = job.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
  const intakeCharges = sum(['OPERATION_FEE', 'SHIPPING_FEE'])
  const intakePaid = paidOf(['OPERATION_FEE', 'SHIPPING_FEE'])
  return {
    operationFee: sum(['OPERATION_FEE']),
    shippingFee: sum(['SHIPPING_FEE']),
    repair: sum(['REPAIR']),
    credit: sum(['OPERATION_FEE_CREDIT']),
    intakeCharges,
    intakePaid,
    intakeBalance: Math.max(0, intakeCharges - intakePaid),
    totalCharges,
    totalPaid,
    balance: totalCharges - totalPaid,
  }
}

export function maskPhone(p: string | null | undefined, role: string): string | null {
  if (!p) return null
  if (['ADMIN', 'EXECUTIVE', 'CS'].includes(role)) return p
  if (role === 'S2') return null
  const d = p.replace(/\D/g, '')
  return `xxx-xxx-${d.slice(-4)}`
}

export function latestLocation(job: Pick<JobWithList, 'events'>): string | null {
  for (const e of job.events) {
    const p = e.payload as Record<string, unknown> | null
    if (p && typeof p.location === 'string' && p.location) return p.location
    if (e.type === 'DC_HANDED_OFF_VD' || e.type === 'OUTBOUND_HANDED_OFF' || e.type === 'DELIVERED_TO_CS') return null
  }
  return null
}

const OUTBOUND_LEGS = ['BRANCH_TO_DC', 'DC_TO_VD', 'BRANCH_TO_VD']
const INBOUND_LEGS = ['VD_TO_DC', 'DC_TO_BRANCH', 'VD_TO_BRANCH']

export function serializeJob(job: JobWithList, role: string, opts?: { preferSla?: string[] }) {
  const sla = jobSla(job, opts?.preferSla)
  const money = calcMoney(job)
  const outbound = job.shipments.filter(s => OUTBOUND_LEGS.includes(s.legType))
  const inbound = job.shipments.filter(s => INBOUND_LEGS.includes(s.legType))
  const quote = job.quotes[0] ?? null
  const stage = job.stage as Stage
  const hideMoney = ['GR', 'DC', 'S2'].includes(role)
  return {
    id: job.id,
    jobNo: job.jobNo,
    type: job.type,
    stage,
    stageLabel: STAGE_LABELS[stage],
    stageBadge: STAGE_BADGE[stage],
    channel: job.channel,
    version: job.version,
    openedAt: job.openedAt,
    stageEnteredAt: job.stageEnteredAt,
    closedAt: job.closedAt,
    decision: job.decision,
    customerName: role === 'S2' ? null : job.customerName,
    customerPhone: maskPhone(job.customerPhone, role),
    productName: job.productName,
    brandName: job.brandName,
    sku: job.sku,
    symptom: job.symptom,
    hasWarranty: job.hasWarranty,
    shippingMethod: job.shippingMethod,
    receiverName: job.receiverName,
    branch: job.branch,
    vendor: job.vendorCenter ? {
      centerId: job.vendorCenter.id, centerCode: job.vendorCenter.code, code: job.vendorCenter.vendorParent.code, name: job.vendorCenter.vendorParent.name,
      deliveryMethod: job.vendorCenter.deliveryMethod,
      inspectionFee: job.hasWarranty ? job.vendorCenter.vendorParent.inspectionFeeCovered : job.vendorCenter.vendorParent.inspectionFeeNotCovered,
      repairWarrantyDays: job.vendorCenter.vendorParent.repairWarrantyDays,
    } : null,
    sla: sla.primary,
    overdue: sla.overdue,
    overdueOwner: sla.overdueOwner,
    maxOverHours: sla.maxOverHours,
    money: hideMoney ? null : money,
    unpaid: job.type === 'CUSTOMER' && ['APPROVED', 'AUTO_APPROVED'].includes(job.decision) && money.balance > 0 && !['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED', 'CANCELLED'].includes(stage),
    intakeUnpaid: job.type === 'CUSTOMER' && money.intakeBalance > 0,
    outboundShipment: outbound[outbound.length - 1] ?? null,
    inboundShipment: inbound[inbound.length - 1] ?? null,
    location: latestLocation(job),
    quote: quote ? { ...quote, total: hideMoney ? null : quote.total, subtotal: hideMoney ? null : quote.subtotal } : null,
    items: job.items,
  }
}

export type JobView = ReturnType<typeof serializeJob>
