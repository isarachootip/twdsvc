// Job Engine (04_workflow_state_machine.md §3) — การเปลี่ยน stage ทำผ่าน executeAction เท่านั้น
import crypto from 'crypto'
import { Prisma, JobStage, Channel, CarrierType, ShipmentLegType, QuoteDecision, QuoteStatus } from '@prisma/client'
import { prisma } from './db'
import { generateQuoteNo } from './number-generator'
import { calcQuoteTotals } from './fees'
import { slaOnEvent } from './sla-engine'

type Tx = Prisma.TransactionClient

export type ActionType =
  | 'open' | 'assign_vendor' | 'record_intake_payment'
  | 'gr_receive' | 'gr_pack' | 'gr_handoff' | 'gr_receive_return' | 'gr_deliver_cs'
  | 'dispatch_pickup' | 'carrier_confirm_pickup'
  | 'dc_receive_outbound' | 'dc_handoff_vd' | 'dc_receive_inbound' | 'dc_dispatch_confirm'
  | 'vd_receive' | 'tpl_delivered' | 'vd_submit_quote' | 'vd_revise_quote'
  | 'vd_start_repair' | 'vd_pause_parts' | 'vd_resume_parts' | 'vd_finish_repair' | 'vd_return_pack'
  | 'customer_approve' | 'customer_reject' | 'cs_record_decision'
  | 'record_repair_payment' | 'cs_close' | 'cancel' | 'add_note'
  | 'cs_receive_payment' | 'cs_close_job' | 'cs_trade_in' | 'cs_return_only'

export interface PhotoInput {
  fileUrl: string
  fileName?: string
  mimeType?: string
  fileSize?: number
}

export interface ActionInput {
  version?: number
  note?: string
  location?: string
  photos?: PhotoInput[]
  // quote
  lines?: Array<{ type: string; description: string; unitPrice: number; quantity?: number; partWaitDays?: number; partWarrantyDays?: number }>
  repairDays?: number
  vendorNote?: string
  // decision
  decision?: 'approve' | 'reject' | 'APPROVED' | 'REJECTED'
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
  // close / pickup options
  pickupOption?: 'CUSTOMER' | 'STOCK' | '3PL' | 'TRADEIN' | 'RETURN_ONLY' | 'REPAIRED'
}

export interface Actor {
  userId: string | null
  role: string // CS/GR/DC/VD/S2/ADMIN/EXECUTIVE/CUSTOMER/DRIVER/SYSTEM
  siteId?: string | null
  vendorCenterId?: string | null
}

export type ActionResult =
  | { success: true; job: { id: string; jobNo: string; stage: JobStage; version: number }; extra: Record<string, unknown> }
  | { success: false; error: string; status?: number }

export class ActionError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}

type JobFull = Prisma.JobGetPayload<{
  include: {
    charges: true
    payments: true
    shipments: true
    quotes: { include: { lines: true } }
    vendorCenter: { include: { vendorParent: true } }
  }
}>

interface Ctx {
  tx: Tx
  job: JobFull
  input: ActionInput
  actor: Actor
  now: Date
  extra: Record<string, unknown>
  extraEvents: string[]
}

interface ActionDef {
  roles: string[]
  from?: JobStage[]
  event: string | ((c: Ctx) => string)
  to?: (c: Ctx) => JobStage
  photo?: boolean | ((c: Ctx) => boolean)
  location?: boolean
  effects?: (c: Ctx) => Promise<void>
  validate?: (c: Ctx) => void | Promise<void>
}

// ─── helpers ────────────────────────────────────────────────────────────────
const OUT_LEGS: ShipmentLegType[] = ['BRANCH_TO_DC', 'DC_TO_VD', 'BRANCH_TO_VD']
const IN_LEGS: ShipmentLegType[] = ['VD_TO_DC', 'DC_TO_BRANCH', 'VD_TO_BRANCH']

function lastShipment(job: JobFull, legs: ShipmentLegType[]) {
  const s = job.shipments
    .filter(x => legs.includes(x.legType) && x.status !== 'CANCELLED')
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  return s[s.length - 1] ?? null
}

function mockTracking(prefix = 'TPL') {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`
}

function intakeBalance(job: JobFull) {
  const charges = job.charges.filter(c => c.type === 'OPERATION_FEE' || c.type === 'SHIPPING_FEE').reduce((s, c) => s + c.amount, 0)
  const paid = job.payments.filter(p => p.status === 'PAID' && (p.chargeType === 'OPERATION_FEE' || p.chargeType === 'SHIPPING_FEE')).reduce((s, p) => s + p.amount, 0)
  return charges - paid
}

function totalBalance(job: JobFull) {
  const charges = job.charges.reduce((s, c) => s + c.amount, 0)
  const paid = job.payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
  return charges - paid
}

async function getSetting(tx: Tx, key: string, fallback: string): Promise<string> {
  try {
    const row = await tx.systemSetting.findUnique({ where: { key } })
    return row?.value ?? fallback
  } catch {
    return fallback
  }
}

async function getNumberSetting(tx: Tx, key: string, fallback: number): Promise<number> {
  try {
    const row = await tx.systemSetting.findUnique({ where: { key } })
    const n = Number(row?.value)
    return Number.isFinite(n) ? n : fallback
  } catch {
    return fallback
  }
}

async function createOutboundShipment(c: Ctx) {
  const ch = c.job.channel
  if (ch === 'DC') {
    await c.tx.shipment.create({ data: { jobId: c.job.id, legType: 'BRANCH_TO_DC', carrier: 'DC_FLEET', status: 'PENDING_DISPATCH' } })
  } else if (ch === 'DSD') {
    await c.tx.shipment.create({ data: { jobId: c.job.id, legType: 'BRANCH_TO_VD', carrier: 'VD_FLEET', status: 'PENDING_DISPATCH' } })
  } else if (ch === 'TPL') {
    const trackingNo = mockTracking()
    await c.tx.shipment.create({ data: { jobId: c.job.id, legType: 'BRANCH_TO_VD', carrier: 'TPL', status: 'DISPATCHED', trackingNo, dispatchedAt: c.now } })
    c.extra.trackingNo = trackingNo
    c.extraEvents.push('SHIPMENT_DISPATCHED')
  }
}

async function createInboundShipment(c: Ctx) {
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

async function applyDecision(c: Ctx, approve: boolean) {
  const quote = c.job.quotes.find(q => q.status === 'SENT')
  if (!quote) throw new ActionError('ไม่พบใบเสนอราคาที่รอการตัดสินใจ')
  if (approve) {
    if (quote.expiresAt && quote.expiresAt < c.now && c.actor.role === 'CUSTOMER') {
      throw new ActionError('ใบเสนอราคาหมดอายุแล้ว กรุณาติดต่อสาขา')
    }
    await c.tx.quote.update({ where: { id: quote.id }, data: { status: QuoteStatus.APPROVED, decidedAt: c.now } })
    await c.tx.job.update({ where: { id: c.job.id }, data: { decision: QuoteDecision.APPROVED } })

    // C4: Create REPAIR charge
    await c.tx.jobCharge.create({
      data: {
        jobId: c.job.id,
        type: 'REPAIR',
        amount: quote.total,
        description: `ค่าซ่อมตามใบเสนอราคา ${quote.quoteNo}`,
      },
    })

    // C4: Operation fee credit = -min(operationFeePaid, quote.total) (05 §1.3)
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

async function buildQuote(c: Ctx, version: number) {
  const vendor = c.job.vendorCenter?.vendorParent
  if (!vendor) throw new ActionError('งานนี้ยังไม่ได้กำหนดศูนย์ซ่อม')
  const vatRate = await getNumberSetting(c.tx, 'VAT_RATE', 0.07)
  const expiryDays = await getNumberSetting(c.tx, 'QUOTE_EXPIRY_DAYS', 7)
  const userLines = (c.input.lines ?? [])
    .filter(l => (l.description ?? '').trim() || Number(l.unitPrice) > 0)
    .map(l => ({
      type: (['PART', 'LABOR', 'OTHER'].includes(l.type) ? l.type : 'PART') as 'PART' | 'LABOR' | 'OTHER',
      description: ((l.description ?? '').trim() || (l.type === 'LABOR' ? 'ค่าแรงช่าง' : 'รายการอะไหล่')),
      unitPrice: Math.max(0, Math.round(Number(l.unitPrice) || 0)),
      quantity: Math.max(1, Math.round(Number(l.quantity) || 1)),
      partWaitDays: Math.max(0, Math.round(Number(l.partWaitDays) || 0)),
      partWarrantyDays: Math.max(0, Math.round(Number(l.partWarrantyDays) || 0)),
    }))
  const inspectionFee = c.job.hasWarranty ? vendor.inspectionFeeCovered : vendor.inspectionFeeNotCovered
  const lines = [
    { type: 'INSPECTION_FEE' as const, description: 'ค่าดำเนินการ (ค่าเปิดเครื่อง)', unitPrice: inspectionFee, quantity: 1, partWaitDays: 0, partWarrantyDays: 0 },
    ...userLines,
  ]
  const repairDays = Math.round(Number(c.input.repairDays) || 0)
  if (repairDays < 1) throw new ActionError('กรุณาระบุระยะเวลาซ่อมโดยประมาณ (อย่างน้อย 1 วัน)')
  const totals = calcQuoteTotals(lines, vatRate)
  const quoteNo = await generateQuoteNo()
  const quote = await c.tx.quote.create({
    data: {
      jobId: c.job.id, quoteNo, version, status: QuoteStatus.SENT,
      subtotal: totals.subtotal, vatAmount: totals.vatAmount, total: totals.total,
      repairDays, repairWarrantyDays: vendor.repairWarrantyDays,
      vendorNote: c.input.vendorNote || null,
      sentAt: c.now, expiresAt: new Date(c.now.getTime() + expiryDays * 86400000),
      createdBy: c.actor.userId ?? 'system',
      lines: { create: lines },
    },
  })
  const token = crypto.randomBytes(32).toString('base64url')
  await c.tx.publicToken.create({ data: { jobId: c.job.id, type: 'QUOTE', token, expiresAt: new Date(c.now.getTime() + expiryDays * 86400000) } })
  c.extra.quoteId = quote.id
  c.extra.quoteNo = quote.quoteNo
  c.extra.quoteTotal = quote.total
  c.extra.quoteUrl = `/q/${token}`
  return quote
}

function requirePosReceipt(input: ActionInput) {
  if (input.paymentMethod === 'POS_RECEIPT' && !(input.posReceiptNo ?? '').trim()) {
    throw new ActionError('กรุณากรอกเลขที่ใบเสร็จ POS')
  }
}

const VALID_METHODS = ['PROMPTPAY_QR', 'CARD_LINK', 'POS_RECEIPT', 'CASH']
type PayMethod = 'PROMPTPAY_QR' | 'CARD_LINK' | 'POS_RECEIPT' | 'CASH'
function payMethod(m?: string): PayMethod {
  return (VALID_METHODS.includes(m ?? '') ? m : 'POS_RECEIPT') as PayMethod
}

// ─── Action catalog ───────────────────────────────────────────────────────────
const ACTIONS: Record<string, ActionDef> = {
  record_intake_payment: {
    roles: ['CS', 'CUSTOMER', 'ADMIN'],
    from: [JobStage.CS_OPENED, JobStage.PENDING_VENDOR_ASSIGNMENT, JobStage.GR_RECEIVED],
    event: 'PAYMENT_RECEIVED',
    effects: async c => {
      const bal = intakeBalance(c.job)
      if (bal <= 0) throw new ActionError('ไม่มียอดค่าดำเนินการค้างชำระ')
      const method = payMethod(c.input.paymentMethod)
      requirePosReceipt(c.input)
      await c.tx.payment.updateMany({ where: { jobId: c.job.id, status: 'PENDING', chargeType: { in: ['OPERATION_FEE', 'SHIPPING_FEE'] } }, data: { status: 'VOIDED', voidedAt: c.now } })
      for (const t of ['OPERATION_FEE', 'SHIPPING_FEE'] as const) {
        const charged = c.job.charges.filter(x => x.type === t).reduce((s, x) => s + x.amount, 0)
        const paid = c.job.payments.filter(p => p.status === 'PAID' && p.chargeType === t).reduce((s, p) => s + p.amount, 0)
        if (charged - paid > 0) {
          await c.tx.payment.create({ data: { jobId: c.job.id, chargeType: t, amount: charged - paid, method, status: 'PAID', posReceiptNo: c.input.posReceiptNo || null, receivedAt: c.now, receivedBy: c.actor.userId } })
        }
      }
      c.extra.paidAmount = bal
    },
  },

  assign_vendor: {
    roles: ['ADMIN'],
    from: [JobStage.PENDING_VENDOR_ASSIGNMENT, JobStage.CS_OPENED, JobStage.GR_RECEIVED],
    event: 'VENDOR_ASSIGNED',
    to: c => (c.job.stage === JobStage.PENDING_VENDOR_ASSIGNMENT ? JobStage.CS_OPENED : c.job.stage),
    effects: async c => {
      if (!c.input.vendorCenterId) throw new ActionError('ต้องระบุศูนย์ซ่อม')
      const center = await c.tx.vendorCenter.findUnique({ where: { id: c.input.vendorCenterId } })
      if (!center) throw new ActionError('ไม่พบศูนย์ซ่อม')
      let channel = (c.input.channel ?? (center.deliveryMethod === 'DSD' ? 'DSD' : 'DC')) as Channel
      if (c.job.shippingMethod === 'EXPRESS') channel = Channel.TPL
      if (channel === Channel.DC && center.deliveryMethod === 'DSD') throw new ActionError('ศูนย์นี้รับเฉพาะ DSD')
      if (channel === Channel.DSD && center.deliveryMethod === 'DC') throw new ActionError('ศูนย์นี้รับเฉพาะ DC')
      await c.tx.job.update({ where: { id: c.job.id }, data: { vendorCenterId: center.id, channel } })
      c.job.vendorCenterId = center.id
      c.job.channel = channel
    },
  },

  gr_receive: {
    roles: ['GR', 'ADMIN'],
    from: [JobStage.CS_OPENED],
    event: 'GR_RECEIVED',
    to: () => JobStage.GR_RECEIVED,
    photo: true,
    location: true,
    validate: c => {
      if (c.job.type === 'CUSTOMER' && intakeBalance(c.job) > 0) throw new ActionError('รอชำระค่าดำเนินการก่อนรับสินค้า')
      if (!c.job.vendorCenterId) throw new ActionError('งานนี้ยังไม่ได้กำหนดศูนย์ซ่อม (รอ Admin กำหนด)')
    },
  },

  gr_pack: {
    roles: ['GR', 'ADMIN'],
    from: [JobStage.GR_RECEIVED],
    event: 'GR_PACKED',
    to: () => JobStage.GR_PACKED,
    photo: true,
    location: true,
    effects: async c => {
      await createOutboundShipment(c)
      c.extra.printLabel = true
    },
  },

  dispatch_pickup: {
    roles: ['DC', 'VD', 'ADMIN'],
    from: [JobStage.GR_PACKED, JobStage.AT_DC_OUTBOUND, JobStage.AT_DC_INBOUND],
    event: 'SHIPMENT_DISPATCHED',
    effects: async c => {
      let leg: ShipmentLegType | null = null
      let carrier: CarrierType | null = null
      const st = c.job.stage
      if (st === JobStage.GR_PACKED && c.job.channel === Channel.DC) { leg = 'BRANCH_TO_DC'; carrier = 'DC_FLEET' }
      else if (st === JobStage.GR_PACKED && c.job.channel === Channel.DSD) { leg = 'BRANCH_TO_VD'; carrier = 'VD_FLEET' }
      else if (st === JobStage.AT_DC_OUTBOUND) { leg = 'DC_TO_VD'; carrier = 'VD_FLEET' }
      else if (st === JobStage.AT_DC_INBOUND) { leg = 'DC_TO_BRANCH'; carrier = 'DC_FLEET' }
      if (!leg || !carrier) throw new ActionError('งานนี้ไม่อยู่ในขั้นตอนที่ต้องจัดรถ')
      if (c.actor.role === 'DC' && carrier !== 'DC_FLEET') throw new ActionError('ขาขนส่งนี้ VD เป็นผู้จัดรถ')
      if (c.actor.role === 'VD' && carrier !== 'VD_FLEET') throw new ActionError('ขาขนส่งนี้ DC เป็นผู้จัดรถ')
      let ship = c.job.shipments.find(s => s.legType === leg && s.status !== 'CANCELLED')
      if (!ship) ship = await c.tx.shipment.create({ data: { jobId: c.job.id, legType: leg, carrier, status: 'PENDING_DISPATCH' } })
      if (ship.status !== 'PENDING_DISPATCH') throw new ActionError('แจ้งคนรถไปแล้ว')
      let driverToken: string | null = null
      if (c.input.method === 'LINK') {
        driverToken = crypto.randomBytes(24).toString('base64url')
        await c.tx.publicToken.create({ data: { jobId: c.job.id, type: 'DRIVER', token: driverToken, expiresAt: new Date(c.now.getTime() + 48 * 3600000) } })
        c.extra.driverUrl = `/d/${driverToken}`
      }
      await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'DISPATCHED', dispatchedAt: c.now, driverToken } })
      c.extra.legType = leg
      c.extra.method = c.input.method ?? 'PRINT'
    },
  },

  gr_handoff: {
    roles: ['GR', 'ADMIN'],
    from: [JobStage.GR_PACKED],
    event: 'OUTBOUND_HANDED_OFF',
    to: c => (c.job.channel === Channel.DC ? JobStage.OUTBOUND_TO_DC : JobStage.OUTBOUND_TO_VD),
    photo: true,
    effects: async c => {
      const ship = lastShipment(c.job, OUT_LEGS)
      if (!ship || ship.status === 'PENDING_DISPATCH') throw new ActionError('ยังไม่ได้จัดรถเข้ารับ (รอ DC/VD แจ้งคนรถ)')
      await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'PICKED_UP', pickedUpAt: c.now } })
    },
  },

  carrier_confirm_pickup: {
    roles: ['VD', 'DRIVER', 'ADMIN'],
    from: [JobStage.GR_PACKED, JobStage.OUTBOUND_TO_VD],
    event: c => (c.job.stage === JobStage.GR_PACKED ? 'OUTBOUND_HANDED_OFF' : 'CARRIER_PICKUP_CONFIRMED'),
    to: c => (c.job.stage === JobStage.GR_PACKED ? JobStage.OUTBOUND_TO_VD : c.job.stage),
    photo: true,
    validate: c => {
      if (c.job.channel !== Channel.DSD) throw new ActionError('ใช้ได้เฉพาะงานช่องทาง DSD (VD เข้ารับที่สาขา)')
    },
    effects: async c => {
      const ship = lastShipment(c.job, OUT_LEGS)
      if (!ship || ship.status === 'PENDING_DISPATCH') throw new ActionError('ยังไม่ได้ส่งรถเข้ารับ')
      if (ship.status === 'DISPATCHED') await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'PICKED_UP', pickedUpAt: c.now } })
    },
  },

  dc_receive_outbound: {
    roles: ['DC', 'ADMIN'],
    from: [JobStage.OUTBOUND_TO_DC],
    event: 'DC_RECEIVED_OUTBOUND',
    to: () => JobStage.AT_DC_OUTBOUND,
    location: true,
    effects: async c => {
      const ship = c.job.shipments.find(s => s.legType === 'BRANCH_TO_DC' && s.status !== 'CANCELLED')
      if (ship) await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'DELIVERED', deliveredAt: c.now } })
      if (!c.job.shipments.some(s => s.legType === 'DC_TO_VD' && s.status !== 'CANCELLED')) {
        await c.tx.shipment.create({ data: { jobId: c.job.id, legType: 'DC_TO_VD', carrier: 'VD_FLEET', status: 'PENDING_DISPATCH' } })
      }
    },
  },

  dc_handoff_vd: {
    roles: ['DC', 'ADMIN'],
    from: [JobStage.AT_DC_OUTBOUND],
    event: 'DC_HANDED_OFF_VD',
    to: () => JobStage.OUTBOUND_TO_VD,
    photo: true,
    effects: async c => {
      const ship = c.job.shipments.find(s => s.legType === 'DC_TO_VD' && s.status !== 'CANCELLED')
      if (!ship || ship.status === 'PENDING_DISPATCH') throw new ActionError('VD ยังไม่ได้ส่งรถเข้ารับที่ DC')
      await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'PICKED_UP', pickedUpAt: c.now } })
    },
  },

  vd_receive: {
    roles: ['VD', 'ADMIN'],
    from: [JobStage.OUTBOUND_TO_VD],
    event: 'VD_RECEIVED',
    to: () => JobStage.VD_INSPECTING,
    effects: async c => {
      const ship = lastShipment(c.job, OUT_LEGS)
      if (ship && ship.status !== 'DELIVERED') await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'DELIVERED', deliveredAt: c.now, pickedUpAt: ship.pickedUpAt ?? c.now } })
    },
  },

  tpl_delivered: {
    roles: ['VD', 'SYSTEM', 'ADMIN'],
    from: [JobStage.OUTBOUND_TO_VD, JobStage.GR_PACKED],
    event: 'VD_RECEIVED',
    to: () => JobStage.VD_INSPECTING,
    validate: c => { if (c.job.channel !== Channel.TPL) throw new ActionError('ใช้ได้เฉพาะงานช่องทาง 3PL') },
    effects: async c => {
      const ship = lastShipment(c.job, OUT_LEGS)
      if (ship && ship.status !== 'DELIVERED') await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'DELIVERED', deliveredAt: c.now, pickedUpAt: ship.pickedUpAt ?? c.now } })
      if (c.job.stage === JobStage.GR_PACKED) c.extraEvents.push('OUTBOUND_HANDED_OFF')
    },
  },

  vd_submit_quote: {
    roles: ['VD', 'ADMIN'],
    from: [JobStage.VD_INSPECTING],
    event: 'QUOTE_SENT',
    to: c => ((c.extra.quoteTotal as number) === 0 ? JobStage.REPAIRING : JobStage.WAITING_APPROVAL),
    validate: c => { if (c.job.type !== 'CUSTOMER') throw new ActionError('งานสต็อกไม่มีขั้นตอนเสนอราคา — ใช้ "เริ่มซ่อม"') },
    effects: async c => {
      const version = c.job.quotes.reduce((m, q) => Math.max(m, q.version), 0) + 1
      const q = await buildQuote(c, version)
      if (q.total === 0) {
        await c.tx.quote.update({ where: { id: q.id }, data: { status: QuoteStatus.APPROVED, decidedAt: c.now } })
        await c.tx.job.update({ where: { id: c.job.id }, data: { decision: QuoteDecision.AUTO_APPROVED } })
        await c.tx.publicToken.updateMany({ where: { jobId: c.job.id, type: 'QUOTE', usedAt: null }, data: { usedAt: c.now } })
        c.extraEvents.push('CUSTOMER_APPROVED')
      }
    },
  },

  vd_revise_quote: {
    roles: ['VD', 'ADMIN'],
    from: [JobStage.WAITING_APPROVAL],
    event: 'QUOTE_REVISED',
    effects: async c => {
      await c.tx.quote.updateMany({ where: { jobId: c.job.id, status: 'SENT' }, data: { status: QuoteStatus.SUPERSEDED } })
      await c.tx.publicToken.updateMany({ where: { jobId: c.job.id, type: 'QUOTE', usedAt: null }, data: { usedAt: c.now } })
      const version = c.job.quotes.reduce((m, q) => Math.max(m, q.version), 0) + 1
      await buildQuote(c, version)
    },
  },

  vd_start_repair: {
    roles: ['VD', 'ADMIN'],
    from: [JobStage.VD_INSPECTING],
    event: 'REPAIR_STARTED',
    to: () => JobStage.REPAIRING,
    validate: c => { if (c.job.type !== 'STOCK') throw new ActionError('งานลูกค้าต้องส่งใบเสนอราคาก่อน') },
  },

  vd_pause_parts: { roles: ['VD', 'ADMIN'], from: [JobStage.REPAIRING], event: 'REPAIR_PAUSED' },
  vd_resume_parts: { roles: ['VD', 'ADMIN'], from: [JobStage.REPAIRING], event: 'REPAIR_RESUMED' },

  vd_finish_repair: {
    roles: ['VD', 'ADMIN'],
    from: [JobStage.REPAIRING],
    event: 'REPAIR_FINISHED',
    to: () => JobStage.RETURN_PACKING,
    effects: async c => { await createInboundShipment(c) },
  },

  vd_return_pack: {
    roles: ['VD', 'ADMIN'],
    from: [JobStage.RETURN_PACKING],
    event: 'RETURN_PACKED',
    to: c => (c.job.channel === Channel.DC ? JobStage.INBOUND_TO_DC : JobStage.INBOUND_TO_BRANCH),
    photo: c => c.job.channel !== Channel.TPL,
    effects: async c => {
      await createInboundShipment(c)
      const ship = await c.tx.shipment.findFirst({ where: { jobId: c.job.id, legType: { in: IN_LEGS }, status: { not: 'CANCELLED' } }, orderBy: { createdAt: 'desc' } })
      if (ship) {
        if (c.job.channel === Channel.TPL) {
          const trackingNo = mockTracking()
          await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'DISPATCHED', dispatchedAt: c.now, trackingNo } })
          c.extra.trackingNo = trackingNo
        } else {
          await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'PICKED_UP', dispatchedAt: ship.dispatchedAt ?? c.now, pickedUpAt: c.now } })
        }
      }
      c.extra.printLabel = true
    },
  },

  dc_receive_inbound: {
    roles: ['DC', 'ADMIN'],
    from: [JobStage.INBOUND_TO_DC],
    event: 'DC_RECEIVED_INBOUND',
    to: () => JobStage.AT_DC_INBOUND,
    photo: true,
    effects: async c => {
      const ship = c.job.shipments.find(s => s.legType === 'VD_TO_DC' && s.status !== 'CANCELLED')
      if (ship) await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'DELIVERED', deliveredAt: c.now } })
      if (!c.job.shipments.some(s => s.legType === 'DC_TO_BRANCH' && s.status !== 'CANCELLED')) {
        await c.tx.shipment.create({ data: { jobId: c.job.id, legType: 'DC_TO_BRANCH', carrier: 'DC_FLEET', status: 'PENDING_DISPATCH' } })
      }
    },
  },

  dc_dispatch_confirm: {
    roles: ['DC', 'ADMIN'],
    from: [JobStage.AT_DC_INBOUND],
    event: 'DC_DISPATCHED_TO_BRANCH',
    to: () => JobStage.INBOUND_TO_BRANCH,
    effects: async c => {
      const ship = c.job.shipments.find(s => s.legType === 'DC_TO_BRANCH' && s.status !== 'CANCELLED')
      if (!ship || ship.status === 'PENDING_DISPATCH') throw new ActionError('ยังไม่ได้แจ้งคนรถ (Print / ส่ง Link ก่อน)')
      await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'PICKED_UP', pickedUpAt: c.now } })
    },
  },

  gr_receive_return: {
    roles: ['GR', 'ADMIN'],
    from: [JobStage.INBOUND_TO_BRANCH],
    event: 'GR_RETURN_RECEIVED',
    to: () => JobStage.GR_RETURN_RECEIVED,
    photo: true,
    location: true,
    effects: async c => {
      const ship = lastShipment(c.job, IN_LEGS)
      if (ship && ship.status !== 'DELIVERED') await c.tx.shipment.update({ where: { id: ship.id }, data: { status: 'DELIVERED', deliveredAt: c.now, pickedUpAt: ship.pickedUpAt ?? c.now } })
    },
  },

  gr_deliver_cs: {
    roles: ['GR', 'ADMIN'],
    from: [JobStage.GR_RETURN_RECEIVED],
    event: 'DELIVERED_TO_CS',
    to: () => JobStage.READY_FOR_PICKUP,
    photo: true,
    effects: async c => {
      if (c.job.type === 'CUSTOMER' && totalBalance(c.job) > 0) {
        const token = crypto.randomBytes(24).toString('base64url')
        await c.tx.publicToken.create({ data: { jobId: c.job.id, type: 'PAYMENT', token, expiresAt: new Date(c.now.getTime() + 7 * 86400000) } })
        c.extra.payUrl = `/pay/${token}`
      }
    },
  },

  customer_approve: {
    roles: ['CUSTOMER', 'ADMIN'],
    from: [JobStage.WAITING_APPROVAL],
    event: 'CUSTOMER_APPROVED',
    to: () => JobStage.REPAIRING,
    effects: async c => applyDecision(c, true),
  },

  customer_reject: {
    roles: ['CUSTOMER', 'ADMIN'],
    from: [JobStage.WAITING_APPROVAL],
    event: 'CUSTOMER_REJECTED',
    to: () => JobStage.RETURN_PACKING,
    effects: async c => applyDecision(c, false),
  },

  cs_record_decision: {
    roles: ['CS', 'ADMIN'],
    from: [JobStage.WAITING_APPROVAL],
    event: c => (isApprove(c.input.decision) ? 'CUSTOMER_APPROVED' : 'CUSTOMER_REJECTED'),
    to: c => (isApprove(c.input.decision) ? JobStage.REPAIRING : JobStage.RETURN_PACKING),
    validate: c => {
      if (!c.input.decision) throw new ActionError('กรุณาเลือกผลการตัดสินใจของลูกค้า')
    },
    effects: async c => applyDecision(c, isApprove(c.input.decision)),
  },

  record_repair_payment: {
    roles: ['CS', 'CUSTOMER', 'ADMIN'],
    from: [
      JobStage.REPAIRING,
      JobStage.RETURN_PACKING,
      JobStage.INBOUND_TO_DC,
      JobStage.AT_DC_INBOUND,
      JobStage.INBOUND_TO_BRANCH,
      JobStage.GR_RETURN_RECEIVED,
      JobStage.READY_FOR_PICKUP,
    ],
    event: 'PAYMENT_RECEIVED',
    effects: async c => {
      const bal = totalBalance(c.job)
      if (bal <= 0) throw new ActionError('ไม่มียอดค้างชำระ')
      const amount = c.input.amount ? Math.round(Number(c.input.amount)) : bal
      if (amount <= 0 || amount > bal) throw new ActionError(`ยอดชำระต้องไม่เกินยอดค้าง ฿${bal.toLocaleString()}`)
      const method = payMethod(c.input.paymentMethod)
      requirePosReceipt(c.input)
      await c.tx.payment.updateMany({ where: { jobId: c.job.id, status: 'PENDING', chargeType: 'REPAIR' }, data: { status: 'VOIDED', voidedAt: c.now } })
      await c.tx.payment.create({
        data: {
          jobId: c.job.id,
          chargeType: 'REPAIR',
          amount,
          method,
          status: 'PAID',
          posReceiptNo: c.input.posReceiptNo || null,
          receivedAt: c.now,
          receivedBy: c.actor.userId,
        },
      })
      c.extra.paidAmount = amount
    },
  },

  cs_close: {
    roles: ['CS', 'S2', 'GR', 'ADMIN'],
    from: [JobStage.READY_FOR_PICKUP],
    event: 'JOB_CLOSED',
    to: c => (c.job.type === 'CUSTOMER' && c.job.decision === QuoteDecision.REJECTED ? JobStage.CLOSED_NOT_REPAIRED : JobStage.CLOSED_REPAIRED),
    validate: c => {
      if (c.job.type === 'STOCK' && c.actor.role === 'CS') throw new ActionError('งานสต็อกปิดโดย S2/GR')
      if (c.job.type === 'CUSTOMER' && ['S2', 'GR'].includes(c.actor.role)) throw new ActionError('งานลูกค้าปิดโดย CS')
      if (c.job.type === 'CUSTOMER' && c.job.decision !== QuoteDecision.REJECTED) {
        const bal = totalBalance(c.job)
        if (bal > 0) throw new ActionError(`ยังมียอดค้างชำระ ฿${bal.toLocaleString()}`)
      }
    },
    effects: async c => {
      await c.tx.job.update({ where: { id: c.job.id }, data: { closedAt: c.now } })
      if (c.job.type === 'CUSTOMER') {
        const token = crypto.randomBytes(24).toString('base64url')
        await c.tx.publicToken.create({ data: { jobId: c.job.id, type: 'CSAT', token, expiresAt: new Date(c.now.getTime() + 14 * 86400000) } })
        c.extra.csatUrl = `/s/${token}`
      }
      if (c.input.pickupOption) {
        c.extra.pickupOption = c.input.pickupOption
      }
    },
  },

  cancel: {
    roles: ['CS', 'ADMIN'],
    event: 'JOB_CANCELLED',
    to: () => JobStage.CANCELLED,
    validate: c => {
      const closed: JobStage[] = [JobStage.CLOSED_REPAIRED, JobStage.CLOSED_NOT_REPAIRED, JobStage.CANCELLED]
      if (closed.includes(c.job.stage)) {
        throw new ActionError('ไม่สามารถยกเลิกงานที่ปิดแล้ว')
      }
      const csAllowed: JobStage[] = [JobStage.CS_OPENED, JobStage.PENDING_VENDOR_ASSIGNMENT]
      if (c.actor.role !== 'ADMIN' && !csAllowed.includes(c.job.stage)) {
        throw new ActionError('CS ยกเลิกได้เฉพาะงานที่ยังไม่ส่งมอบ GR')
      }
      if (!(c.input.reason || c.input.note || '').trim()) throw new ActionError('กรุณาระบุเหตุผลการยกเลิก')
    },
    effects: async c => {
      await c.tx.shipment.updateMany({ where: { jobId: c.job.id, status: { in: ['PENDING_DISPATCH', 'DISPATCHED'] } }, data: { status: 'CANCELLED', cancelledAt: c.now } })
      await c.tx.payment.updateMany({ where: { jobId: c.job.id, status: 'PENDING' }, data: { status: 'VOIDED', voidedAt: c.now } })
      await c.tx.job.update({ where: { id: c.job.id }, data: { closedAt: c.now } })
    },
  },

  add_note: {
    roles: ['CS', 'GR', 'DC', 'VD', 'S2', 'ADMIN'],
    event: c => ((c.input.photos?.length ?? 0) > 0 ? 'PHOTO_ADDED' : 'NOTE_ADDED'),
  },
}

export function isValidAction(a: string): a is ActionType {
  const ALIASES = ['cs_receive_payment', 'cs_close_job', 'cs_trade_in', 'cs_return_only']
  return Object.prototype.hasOwnProperty.call(ACTIONS, a) || ALIASES.includes(a)
}

// ─── Execute ──────────────────────────────────────────────────────────────────
export async function executeAction(jobId: string, action: ActionType, input: ActionInput = {}, actor: Actor): Promise<ActionResult> {
  // Action aliases normalization (C2)
  let resolvedAction: string = action
  if (action === 'cs_receive_payment') {
    resolvedAction = 'record_repair_payment'
  } else if (action === 'cs_close_job') {
    resolvedAction = 'cs_close'
  } else if (action === 'cs_return_only') {
    resolvedAction = 'cs_close'
    input.pickupOption = 'RETURN_ONLY'
  } else if (action === 'cs_trade_in') {
    resolvedAction = 'cs_close'
    input.pickupOption = 'TRADEIN'
  }

  const def = ACTIONS[resolvedAction]
  if (!def) return { success: false, error: `ไม่รู้จัก action ${action}` }

  const isAdminOverride = actor.role === 'ADMIN' && !def.roles.includes('ADMIN')
  if (!def.roles.includes(actor.role) && actor.role !== 'ADMIN' && actor.role !== 'SYSTEM') {
    return { success: false, error: `สิทธิ์ ${actor.role} ไม่สามารถทำรายการนี้ได้`, status: 403 }
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

      // Data scope (08 §4, S1 - fail-closed)
      if (['CS', 'GR', 'S2'].includes(actor.role) && (!actor.siteId || job.branchId !== actor.siteId)) {
        throw new ActionError('ไม่มีสิทธิ์เข้าถึงงานของสาขาอื่น', 403)
      }
      if (actor.role === 'VD' && (!actor.vendorCenterId || job.vendorCenterId !== actor.vendorCenterId)) {
        throw new ActionError('ไม่มีสิทธิ์เข้าถึงงานของศูนย์ซ่อมอื่น', 403)
      }
      if (actor.role === 'DC' && job.channel !== Channel.DC) {
        throw new ActionError('งานนี้ไม่ได้ผ่าน DC', 403)
      }

      // Optimistic concurrency control (S7)
      if (input.version !== undefined && input.version !== null && Number(input.version) !== job.version) {
        throw new ActionError('ข้อมูลงานถูกเปลี่ยนแปลงโดยผู้อื่นแล้ว กรุณารีเฟรชหน้าจอ', 409)
      }

      if (def.from && !def.from.includes(job.stage)) {
        throw new ActionError(`งาน ${job.jobNo} ไม่อยู่ในขั้นตอนที่ทำรายการนี้ได้ (ปัจจุบัน: ${job.stage})`, 409)
      }

      const now = new Date()
      const c: Ctx = { tx, job, input, actor, now, extra: {}, extraEvents: [] }

      const requirePhotos = (await getSetting(tx, 'REQUIRE_PHOTOS', 'false')) === 'true'
      const needPhoto = typeof def.photo === 'function' ? def.photo(c) : !!def.photo
      if (needPhoto && requirePhotos && !(input.photos?.length)) {
        throw new ActionError('กรุณาถ่ายภาพ/แนบภาพก่อนยืนยัน')
      }
      if (def.location && !(input.location ?? '').trim()) {
        throw new ActionError('กรุณากรอกเลขที่ Location', 400)
      }
      if (input.location) {
        input.location = input.location.trim().toUpperCase()
        const locRegex = /^(?:[A-Z]-\d{2}-\d{2}|(?:DC-)?[A-Z0-9]{1,4}-\d{2}-[A-Z0-9]{1,4}|DC-\d{2}-[A-Z]|S-RET-\d{2})$/i
        if (def.location && !locRegex.test(input.location)) {
          throw new ActionError('รูปแบบ Location ไม่ถูกต้อง (ตัวอย่าง: A-01-02 หรือ DC-01-A)', 400)
        }
      }

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
