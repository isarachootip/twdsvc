import { describe, it, expect, setTier } from '../framework/core'
import {
  BILLING_CYCLE_PRESETS,
  formatBillingCycleFromDays,
  parseBillingDaysFromText,
  toggleBillingDay,
  extractApplicationCommercialTerms,
} from '../../src/lib/vendor-billing-cycle'
import { vendorApplicationV6Schema } from '../../src/lib/validations/vendor-application-v6.schema'
import { INITIAL_FORM_V6 } from '../../src/components/vendor-setup/initial-form-v6'

setTier('Tier 1')

describe('Unit: Vendor Billing Cycle Formatter, Parser & Commercial Extractor', () => {
  it('VBC-01: Provides standard Thai Watsadu billing cycle presets including day 25 default', () => {
    expect(BILLING_CYCLE_PRESETS.length >= 4).toBe(true)
    expect(BILLING_CYCLE_PRESETS.some(p => p.value === 'ทุกวันที่ 25 ของเดือน')).toBe(true)
    expect(BILLING_CYCLE_PRESETS.some(p => p.value === 'ทุกสิ้นเดือน')).toBe(true)
  })

  it('VBC-02: Formats single day of month (1-31) cleanly', () => {
    expect(formatBillingCycleFromDays([25], false)).toBe('ทุกวันที่ 25 ของเดือน')
    expect(formatBillingCycleFromDays([5], false)).toBe('ทุกวันที่ 5 ของเดือน')
  })

  it('VBC-03: Formats end-of-month and bi-monthly / multi-day combinations cleanly', () => {
    expect(formatBillingCycleFromDays([], true)).toBe('ทุกสิ้นเดือน')
    expect(formatBillingCycleFromDays([15], true)).toBe('เดือนละ 2 รอบ (วันที่ 15 และสิ้นเดือน)')
    expect(formatBillingCycleFromDays([25, 10], false)).toBe('เดือนละ 2 รอบ (วันที่ 10 และ 25 ของเดือน)')
    expect(formatBillingCycleFromDays([25, 5, 15], false)).toBe('ทุกวันที่ 5, 15, 25 ของเดือน')
    expect(formatBillingCycleFromDays([5, 20], true)).toBe('ทุกวันที่ 5, 20 และสิ้นเดือน')
  })

  it('VBC-04: Ignores out-of-range or duplicate days when formatting', () => {
    expect(formatBillingCycleFromDays([0, 32, -5, 25, 25], false)).toBe('ทุกวันที่ 25 ของเดือน')
    expect(formatBillingCycleFromDays([], false)).toBe('')
  })

  it('VBC-05: Parses existing billing cycle strings back into calendar days and end-of-month flag', () => {
    const p1 = parseBillingDaysFromText('ทุกวันที่ 25 ของเดือน')
    expect(p1.days).toEqual([25])
    expect(p1.includeEndOfMonth).toBe(false)

    const p2 = parseBillingDaysFromText('เดือนละ 2 รอบ (วันที่ 15 และสิ้นเดือน)')
    // Notice "2 รอบ" has digit 2! Make sure parser does NOT falsely treat "2 รอบ" as day 2!
    expect(p2.days).toEqual([15])
    expect(p2.includeEndOfMonth).toBe(true)

    const p3 = parseBillingDaysFromText('เดือนละ 2 รอบ (วันที่ 10 และ 25 ของเดือน)')
    expect(p3.days).toEqual([10, 25])
    expect(p3.includeEndOfMonth).toBe(false)

    const p4 = parseBillingDaysFromText('ทุกสิ้นเดือน')
    expect(p4.days).toEqual([])
    expect(p4.includeEndOfMonth).toBe(true)
  })

  it('VBC-06: Toggles day selection cleanly in sorted ascending order', () => {
    const afterAdd = toggleBillingDay([25], 10)
    expect(afterAdd).toEqual([10, 25])
    const afterRemove = toggleBillingDay(afterAdd, 25)
    expect(afterRemove).toEqual([10])
  })

  it('VBC-07: Extracts commercial terms safely from VendorApplication agreements JSON', () => {
    const extracted = extractApplicationCommercialTerms({
      commercial: {
        gpPct: '20%',
        creditTerm: '45 วัน',
        billingCycle: 'เดือนละ 2 รอบ (วันที่ 15 และสิ้นเดือน)',
      },
    })
    expect(extracted.gpPct).toBe('20%')
    expect(extracted.creditTerm).toBe('45 วัน')
    expect(extracted.billingCycle).toBe('เดือนละ 2 รอบ (วันที่ 15 และสิ้นเดือน)')

    const fallback = extractApplicationCommercialTerms(null)
    expect(fallback.creditTerm).toBe('-')
    expect(fallback.billingCycle).toBe('-')
  })

  it('VBC-08: Rejects whitespace-only billingCycle in vendorApplicationV6Schema', () => {
    const baseValid = {
      ...INITIAL_FORM_V6,
      supplierRegistered: 'ไม่เคยลงทะเบียนทำการค้ากับไทวัสดุ' as const,
      company: 'บริษัท ทดสอบ จำกัด',
      taxId: '0105558123456',
      companyAddr: {
        line1: '123 ถนนสุขุมวิท',
        subdistrict: 'บางนาใต้',
        district: 'บางนา',
        province: 'กรุงเทพมหานคร',
        zip: '10260',
        phone: '021112222',
        note: '',
      },
      branches: [
        {
          line1: '123 ถนนสุขุมวิท',
          subdistrict: 'บางนาใต้',
          district: 'บางนา',
          province: 'กรุงเทพมหานคร',
          zip: '10260',
          phone: '021112222',
          contactName: 'นายสมชาย',
          note: '',
        },
      ],
      primaryContact: {
        name: 'นายสมชาย',
        pos: 'ผจก.',
        phone: '0812345678',
        email: 'test@example.com',
        line: '',
      },
      bank: {
        accName: 'บริษัท ทดสอบ จำกัด',
        accNo: '1234567890',
        bank: 'กสิกรไทย',
        bankBranch: 'บางนา',
        vat20: 'มี' as const,
      },
      agreements: {
        sla: true as const,
        inspect: true as const,
        reportApp: true as const,
        training: true as const,
        pdpa: true as const,
        truth: true as const,
      },
      signName: 'นายสมชาย',
      signPos: 'กรรมการ',
      billingCycle: '   ',
    }
    const res = vendorApplicationV6Schema.safeParse(baseValid)
    expect(res.success).toBe(false)
  })
})
