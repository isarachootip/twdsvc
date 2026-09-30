import crypto from 'crypto'
import { ShipmentLegType, QuoteDecision, QuoteStatus } from '@prisma/client'
import { generateQuoteNo, generateTrackingNo } from '../number-generator'
import { calcQuoteTotals } from '../fees'
import { Tx, JobFull, Ctx, ActionInput } from './types'
import { ActionError } from './errors'

export const OUT_LEGS: ShipmentLegType[] = ['BRANCH_TO_DC', 'DC_TO_VD', 'BRANCH_TO_VD']
export const IN_LEGS: ShipmentLegType[] = ['VD_TO_DC', 'DC_TO_BRANCH', 'VD_TO_BRANCH']

export function lastShipment(job: JobFull, legs: ShipmentLegType[]) {
  const s = job.shipments
    .filter(x => legs.includes(x.legType) && x.status !== 'CANCELLED')
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  return s[s.length - 1] ?? null
}

export function intakeBalance(job: JobFull) {
  const charges = job.charges.filter(c => c.type === 'OPERATION_FEE' || c.type === 'SHIPPING_FEE').reduce((s, c) => s + c.amount, 0)
  const paid = job.payments.filter(p => p.status === 'PAID' && (p.chargeType === 'OPERATION_FEE' || p.chargeType === 'SHIPPING_FEE')).reduce((s, p) => s + p.amount, 0)
  return charges - paid
}

export function totalBalance(job: JobFull) {
  const charges = job.charges.reduce((s, c) => s + c.amount, 0)
  const paid = job.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
  return charges - paid
}

export async function getSetting(tx: Tx, key: string, fallback: string): Promise<string> {
  try {
    const row = await tx.systemSetting.findUnique({ where: { key } })
    return row?.value ?? fallback
  } catch {
    return fallback
  }
}

export async function getNumberSetting(tx: Tx, key: string, fallback: number): Promise<number> {
  try {
    const row = await tx.systemSetting.findUnique({ where: { key } })
    const n = Number(row?.value)
    return Number.isFinite(n) ? n : fallback
  } catch {
    return fallback
  }
}

export async function createOutboundShipment(c: Ctx) {
  const ch = c.job.channel
  if (ch === 'DC') {
    await c.tx.shipment.create({ data: { jobId: c.job.id, legType: 'BRANCH_TO_DC', carrier: 'DC_FLEET', status: 'PENDING_DISPATCH' } })
  } else if (ch === 'DSD') {
    await c.tx.shipment.create({ data: { jobId: c.job.id, legType: 'BRANCH_TO_VD', carrier: 'VD_FLEET', status: 'PENDING_DISPATCH' } })
  } else if (ch === 'TPL') {
    const trackingNo = await generateTrackingNo()
    await c.tx.shipment.create({ data: { jobId: c.job.id, legType: 'BRANCH_TO_VD', carrier: 'TPL', status: 'DISPATCHED', trackingNo, dispatchedAt: c.now } })
    c.extra.trackingNo = trackingNo
    c.extraEvents.push('SHIPMENT_DISPATCHED')
  }
}

export async function createInboundShipment(c: Ctx) {
  const ch = c.job.channel
  const fresh = await c.tx.shipment.findFirst({ where: { jobId: c.job.id, legType: { in: IN_LEGS }, status: { not: 'CANCELLED' } } })
  if (fresh) return
  if (ch === 'DC') await c.tx.shipment.create({ data: { jobId: c.job.id, legType: 'VD_TO_DC', carrier: 'VD_FLEET', status: 'PENDING_DISPATCH' } })
  else if (ch === 'DSD') await c.tx.shipment.create({ data: { jobId: c.job.id, legType: 'VD_TO_BRANCH', carrier: 'VD_FLEET', status: 'PENDING_DISPATCH' } })
  else await c.tx.shipment.create({ data: { jobId: c.job.id, legType: 'VD_TO_BRANCH', carrier: 'TPL', status: 'PENDING_DISPATCH' } })
}

export function isApprove(d?: string | null): boolean {
  if (!d) return false
  const s = d.toLowerCase().trim()
  return s === 'approve' || s === 'approved'
}

export async function applyDecision(c: Ctx, approve: boolean) {
  const quote = c.job.quotes.find(q => q.status === 'SENT')
  if (!quote) throw new ActionError('ไม่พบใบเสนอราคาที่รอการตัดสินใจ')
  if (approve) {
    if (quote.expiresAt && quote.expiresAt < c.now && c.actor.role === 'CUSTOMER') {
      throw new ActionError('ใบเสนอราคาหมดอายุแล้ว กรุณาติดต่อสาขา')
    }
    await c.tx.quote.update({ where: { id: quote.id }, data: { status: QuoteStatus.APPROVED, decidedAt: c.now } })
    await c.tx.job.update({ where: { id: c.job.id }, data: { decision: QuoteDecision.APPROVED } })

    await c.tx.jobCharge.create({
      data: {
        jobId: c.job.id,
        type: 'REPAIR',
        amount: quote.total,
        description: `ค่าซ่อมตามใบเสนอราคา ${quote.quoteNo}`,
      },
    })

    const opFeeCharged = c.job.charges
      .filter(x => x.type === 'OPERATION_FEE')
      .reduce((s, x) => s + x.amount, 0)
    const creditBase = Math.min(opFeeCharged, quote.total)
    if (creditBase > 0 && !c.job.charges.some(x => x.type === 'OPERATION_FEE_CREDIT')) {
      await c.tx.jobCharge.create({
        data: {
          jobId: c.job.id,
          type: 'OPERATION_FEE_CREDIT',
          amount: -creditBase,
          description: 'ค่าดำเนินการ (หักเป็นส่วนลดค่าซ่อม)',
        },
      })
    }
  } else {
    await c.tx.quote.update({ where: { id: quote.id }, data: { status: QuoteStatus.REJECTED, decidedAt: c.now } })
    await c.tx.job.update({ where: { id: c.job.id }, data: { decision: QuoteDecision.REJECTED } })
    await createInboundShipment(c)
  }
  await c.tx.publicToken.updateMany({ where: { jobId: c.job.id, type: 'QUOTE', usedAt: null }, data: { usedAt: c.now } })
}

export { buildQuote } from './quote-builder'

export function requirePosReceipt(input: ActionInput) {
  if (input.paymentMethod === 'POS_RECEIPT' && !(input.posReceiptNo ?? '').trim()) {
    throw new ActionError('กรุณากรอกเลขที่ใบเสร็จ POS')
  }
}

export const VALID_METHODS = ['PROMPTPAY_QR', 'CARD_LINK', 'POS_RECEIPT', 'CASH']
export type PayMethod = 'PROMPTPAY_QR' | 'CARD_LINK' | 'POS_RECEIPT' | 'CASH'
export function payMethod(m?: string): PayMethod {
  return (VALID_METHODS.includes(m ?? '') ? m : 'POS_RECEIPT') as PayMethod
}
