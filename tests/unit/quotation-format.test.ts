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
})
