import { describe, it, expect, setTier } from '../framework/core'
import { vendorApplicationV6Schema } from '../../src/lib/validations/vendor-application-v6.schema'
import { INITIAL_FORM_V6 } from '../../src/components/vendor-setup/initial-form-v6'

setTier('Tier 1')

describe('Unit: Vendor Application V6 Zod Validation & Schema Rules', () => {
  const validPayload = {
    ...INITIAL_FORM_V6,
    supplierRegistered: 'ไม่เคยลงทะเบียนทำการค้ากับไทวัสดุ' as const,
    company: 'บริษัท สยามแอร์เซอร์วิส จำกัด',
    taxId: '0105558123456',
    companyAddr: {
      line1: '99/12 ถนนบางนา-ตราด',
      subdistrict: 'บางนาใต้',
      district: 'บางนา',
      province: 'กรุงเทพมหานคร',
      zip: '10260',
      phone: '027654321',
      note: 'ใกล้แยกบางนา',
    },
    branchType: 'ศูนย์บริการเดียว' as const,
    branches: [
      {
        line1: '99/12 ถนนบางนา-ตราด',
        subdistrict: 'บางนาใต้',
        district: 'บางนา',
        province: 'กรุงเทพมหานคร',
        zip: '10260',
        phone: '027654321',
        contactName: 'นายสมชาย ผู้ดูแล',
        note: '',
      },
    ],
    primaryContact: {
      name: 'นายสมศักดิ์ บริการดี',
      pos: 'ผู้จัดการทั่วไป',
      phone: '0812345678',
      email: 'somsak@siamair.co.th',
      line: 'somsak_air',
    },
    backupContact: {
      name: 'นางสมศรี ใจเย็น',
      phone: '0898765432',
      timeStart: '08:00',
      timeEnd: '18:00',
    },
    authorizer: {
      name: 'นายประสิทธิ์ สยามแอร์',
      pos: 'กรรมการผู้มีอำนาจลงนาม',
      phone: '0819998877',
      email: 'prasit@siamair.co.th',
    },
    bank: {
      accName: 'บริษัท สยามแอร์เซอร์วิส จำกัด',
      accNo: '1234567890',
      bank: 'กสิกรไทย',
      bankBranch: 'สาขาบางนา',
      vat20: 'มี' as const,
    },
    cinProducts: ['ปั๊มน้ำ', 'เครื่องมือช่าง'],
    cinBrands: ['MAKITA', 'BOSCH'],
    cinReceiveMethod: 'รับสินค้าจาก DC',
    onsProducts: ['เครื่องปรับอากาศ', 'ปั๊มน้ำ'],
    onsBrands: ['DAIKIN', 'MITSUBISHI'],
    agreements: {
      sla: true as const,
      inspect: true as const,
      reportApp: true as const,
      training: true as const,
      pdpa: true as const,
      truth: true as const,
    },
    signName: 'นายประสิทธิ์ สยามแอร์',
    signPos: 'กรรมการผู้จัดการ',
  }

  it('V6-VAL-01: Validates complete V6 payload successfully', () => {
    const res = vendorApplicationV6Schema.safeParse(validPayload)
    expect(res.success).toBe(true)
  })

  it('V6-VAL-02: Fails when taxId is not 13 digits', () => {
    const res = vendorApplicationV6Schema.safeParse({ ...validPayload, taxId: '12345' })
    expect(res.success).toBe(false)
  })

  it('V6-VAL-03: Fails when SPCODE is missing or invalid for previously registered suppliers', () => {
    const res = vendorApplicationV6Schema.safeParse({
      ...validPayload,
      supplierRegistered: 'เคยลงทะเบียนทำการค้ากับไทวัสดุ',
      spcode: '123', // less than 6 digits
    })
    expect(res.success).toBe(false)
  })

  it('V6-VAL-04: Passes when SPCODE is exact 6 digits for registered suppliers', () => {
    const res = vendorApplicationV6Schema.safeParse({
      ...validPayload,
      supplierRegistered: 'เคยลงทะเบียนทำการค้ากับไทวัสดุ',
      spcode: '620163',
    })
    expect(res.success).toBe(true)
  })

  it('V6-VAL-05: Fails when any legal agreement is unchecked', () => {
    const res = vendorApplicationV6Schema.safeParse({
      ...validPayload,
      agreements: { ...validPayload.agreements, pdpa: false },
    })
    expect(res.success).toBe(false)
  })
})
