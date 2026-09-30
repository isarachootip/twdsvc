import crypto from 'crypto'
import { QuoteStatus } from '@prisma/client'
import { generateQuoteNo } from '../number-generator'
import { calcQuoteTotals } from '../fees'
import { Ctx } from './types'
import { ActionError } from './errors'
import { getNumberSetting } from './helpers'

export async function buildQuote(c: Ctx, version: number) {
  let vendorCenter = c.job.vendorCenter
  const requestedCenterId = c.input.vendorCenterId as string | undefined
  if (requestedCenterId && (c.actor.role === 'ADMIN' || !vendorCenter)) {
    const found = await c.tx.vendorCenter.findUnique({
      where: { id: requestedCenterId },
      include: { vendorParent: true },
    })
    if (found) {
      vendorCenter = found
      await c.tx.job.update({ where: { id: c.job.id }, data: { vendorCenterId: found.id } })
      c.job.vendorCenterId = found.id
      c.job.vendorCenter = found
    }
  } else if (!vendorCenter && c.actor.role === 'ADMIN') {
    const fallbackCenter = await c.tx.vendorCenter.findFirst({
      where: { active: true },
      include: { vendorParent: true },
      orderBy: { code: 'asc' },
    }) ?? await c.tx.vendorCenter.findFirst({
      include: { vendorParent: true },
      orderBy: { code: 'asc' },
    })
    if (fallbackCenter) {
      vendorCenter = fallbackCenter
      await c.tx.job.update({ where: { id: c.job.id }, data: { vendorCenterId: fallbackCenter.id } })
      c.job.vendorCenterId = fallbackCenter.id
      c.job.vendorCenter = fallbackCenter
    }
  }

  let vendor = vendorCenter?.vendorParent
  if (!vendor && c.actor.role === 'ADMIN') {
    let parent = await c.tx.vendorParent.findFirst({ orderBy: { code: 'asc' } })
    if (!parent) {
      parent = await c.tx.vendorParent.create({
        data: {
          code: 'VD-HQ',
          name: 'ศูนย์ซ่อมสำนักงานใหญ่ (ระบบสร้างอัตโนมัติ)',
          repairWarrantyDays: 90,
          inspectionFeeCovered: 0,
          inspectionFeeNotCovered: 300,
          active: true,
        },
      })
    }
    const defaultCenter = await c.tx.vendorCenter.create({
      data: {
        vendorParentId: parent.id,
        code: 'VC-HQ',
        deliveryMethod: 'DC',
        active: true,
      },
      include: { vendorParent: true },
    })
    vendorCenter = defaultCenter
    vendor = defaultCenter.vendorParent
    await c.tx.job.update({ where: { id: c.job.id }, data: { vendorCenterId: defaultCenter.id } })
    c.job.vendorCenterId = defaultCenter.id
    c.job.vendorCenter = defaultCenter
  }

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
