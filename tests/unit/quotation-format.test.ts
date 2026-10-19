import assert from 'node:assert'
import { describe, it, expect, setTier } from '../framework/core'
import {
  computeQuotationFinancials,
  formatThaiShortDate,
  resolveQuoteDates,
} from '../../src/lib/quotation-format'

setTier('Tier 1')

describe('Unit: Standardized Repair Quotation Format & Math', () => {
  it('QF-01: computeQuotationFinancials matches exact PDF example (900 + 63 = 963 - 300 = 663)', () => {
    const fin = computeQuotationFinancials({
      lines: [
        { type: 'INSPECTION_FEE', description: 'ค่าดำเนินการ (ค่าเปิดเครื่อง)', quantity: 1, amount: 300 },
        { type: 'PART', description: 'แปรงถ่านมอเตอร์ (คู่)', quantity: 1, amount: 250 },
        { type: 'PART', description: 'ชุดเกียร์ทดรอบ', quantity: 1, amount: 350 },
      ],
      subtotal: 900,
      vatAmount: 63,
      total: 963,
      operationFeePaid: 300,
      hasWarranty: false,
    })

    expect(fin.displayLines.length).toBe(3)
    expect(fin.displayLines[0].description).toBe('ค่าดำเนินการ (ค่าเปิดเครื่อง/ตรวจสอบ)')
    expect(fin.displayLines[0].amount).toBe(300)
    expect(fin.subtotal).toBe(900)
    expect(fin.vatAmount).toBe(63)
    expect(fin.total).toBe(963)
    expect(fin.operationFeeDiscount).toBe(300)
    expect(fin.netPayable).toBe(663)
  })

  it('QF-02: computeQuotationFinancials derives operationFeeDiscount from INSPECTION_FEE line if operationFeePaid is omitted', () => {
    const fin = computeQuotationFinancials({
      lines: [
        { type: 'INSPECTION_FEE', description: 'ค่าดำเนินการ (ค่าเปิดเครื่อง)', quantity: 1, amount: 300 },
        { type: 'PART', description: 'สวิตช์กด', quantity: 1, amount: 200 },
      ],
      subtotal: 500,
      vatAmount: 35,
      total: 535,
    })

    expect(fin.operationFeeDiscount).toBe(300)
    expect(fin.netPayable).toBe(235)
  })

  it('QF-03: computeQuotationFinancials handles zero operation fee / warranty jobs and never produces negative netPayable', () => {
    const finWarranty = computeQuotationFinancials({
      lines: [
        { type: 'INSPECTION_FEE', description: 'ค่าดำเนินการ (ค่าเปิดเครื่อง)', quantity: 1, amount: 0 },
        { type: 'PART', description: 'เปลี่ยนหัวจับดอกสว่าน', quantity: 1, amount: 400 },
      ],
      subtotal: 400,
      vatAmount: 28,
      total: 428,
      operationFeePaid: 0,
      hasWarranty: true,
    })

    expect(finWarranty.operationFeeDiscount).toBe(0)
    expect(finWarranty.netPayable).toBe(428)

    const finCapped = computeQuotationFinancials({
      lines: [{ type: 'PART', description: 'อะไหล่เล็ก', quantity: 1, amount: 100 }],
      subtotal: 100,
      vatAmount: 7,
      total: 107,
      operationFeePaid: 300,
    })

    expect(finCapped.operationFeeDiscount).toBe(107)
    expect(finCapped.netPayable).toBe(0)
  })

  it('QF-04: formatThaiShortDate and resolveQuoteDates format Buddhist era dates accurately', () => {
    const sent = new Date('2026-10-15T05:00:00Z')
    const opened = new Date('2026-10-13T05:00:00Z')
    assert.strictEqual(formatThaiShortDate(sent), '15 ต.ค. 2569')

    const dates = resolveQuoteDates({ sentAt: sent, openedAt: opened, expiresAt: null })
    expect(dates.quoteDateText).toBe('15 ต.ค. 2569')
    expect(dates.validUntilText).toBe('22 ต.ค. 2569')
    expect(dates.inspectedDateText).toBe('13 ต.ค. 2569')
  })

  it('QF-05: Audit Slide Scenario — ฿750 repair quote (75000 satang) with ฿150 intake fee (15000 satang) deducts ฿150 and leaves ฿652.50 (65250 satang) net payable', async () => {
    const { fmtBaht } = await import('../../src/lib/constants')
    const fin = computeQuotationFinancials({
      lines: [
        { type: 'PART', description: 'ซ่อมชุดมอเตอร์', quantity: 1, amount: 75000 },
      ],
      subtotal: 75000,
      vatAmount: 5250,
      total: 80250,
      operationFeePaid: 15000,
      hasWarranty: false,
    })

    expect(fin.subtotal).toBe(75000)
    expect(fin.vatAmount).toBe(5250)
    expect(fin.total).toBe(80250)
    expect(fin.operationFeeDiscount).toBe(15000)
    expect(fin.netPayable).toBe(65250)
    expect(fmtBaht(fin.subtotal)).toBe('฿750')
    expect(fmtBaht(fin.operationFeeDiscount)).toBe('฿150')
    expect(fmtBaht(fin.netPayable)).toBe('฿653')
    // VD report divides subtotal (75000 satang) by 100 -> ฿750 (never ฿11)
    expect(Math.round(fin.subtotal / 100)).toBe(750)
  })

  it('QF-06: Direct Baht calculation & 2-decimal display — ฿50 part + 7% VAT = ฿3.50, total ฿53.50, minus ฿150 open fee = -฿53.50 discount & ฿0.00 net', async () => {
    const { fmtBahtDecimal } = await import('../../src/lib/constants')
    const { calcQuoteTotalsBaht } = await import('../../src/lib/quotation-format')

    const totals = calcQuoteTotalsBaht([{ unitPrice: '50' }], 150)
    expect(totals.partsTotal).toBe(50)
    expect(totals.vat).toBe(3.5)
    expect(totals.total).toBe(53.5)
    expect(totals.openFee).toBe(150)

    const discount = Math.min(totals.openFee, totals.total)
    const net = Math.max(0, totals.total - discount)

    expect(fmtBahtDecimal(totals.partsTotal)).toBe('฿50.00')
    expect(fmtBahtDecimal(totals.vat)).toBe('฿3.50')
    expect(fmtBahtDecimal(totals.total)).toBe('฿53.50')
    expect(`-${fmtBahtDecimal(discount)}`).toBe('-฿53.50')
    expect(fmtBahtDecimal(net)).toBe('฿0.00')

    const fin = computeQuotationFinancials({
      lines: [{ type: 'PART', description: 'หลอดไฟ', quantity: 1, amount: 5000 }],
      subtotal: 5000,
      vatAmount: 350,
      total: 5350,
      operationFeePaid: 15000,
      hasWarranty: false,
    })
    expect(fmtBahtDecimal(fin.subtotalBaht)).toBe('฿50.00')
    expect(fmtBahtDecimal(fin.vatAmountBaht)).toBe('฿3.50')
    expect(fmtBahtDecimal(fin.totalBaht)).toBe('฿53.50')
    expect(`-${fmtBahtDecimal(fin.operationFeeDiscountBaht)}`).toBe('-฿53.50')
    expect(fmtBahtDecimal(fin.netPayableBaht)).toBe('฿0.00')
  })
})


