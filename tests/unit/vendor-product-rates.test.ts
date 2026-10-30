import { describe, it, expect, setTier } from '../framework/core'
import {
  productGroupRateSchema,
  vendorServiceGroupInputSchema,
  extractApplicationProductRates,
} from '../../src/lib/validations/vendor-product-group.schema'
import { vendorApplicationV6Schema } from '../../src/lib/validations/vendor-application-v6.schema'
import { INITIAL_FORM_V6 } from '../../src/components/vendor-setup/initial-form-v6'
import { normalizeVendorFormV6 } from '../../src/components/vendor-setup/useVendorSetupV6'

setTier('Tier 1')

describe('Unit: Vendor Per-Product-Group Inspection Fee & GP% Rules', () => {
  it('VPR-01: Validates Carry-in and On-site product group rate items', () => {
    const carryIn = productGroupRateSchema.safeParse({
      groupName: 'เครื่องใช้ไฟฟ้าขนาดเล็ก',
      serviceType: 'CARRY_IN',
      minInspectionFee: 250,
      gpPct: 18,
      isCustomGroup: false,
    })
    expect(carryIn.success).toBe(true)

    const onSite = productGroupRateSchema.safeParse({
      groupName: 'เครื่องฉีดน้ำแรงดันสูงอุตสาหกรรม',
      serviceType: 'ON_SITE',
      minInspectionFee: 600,
      gpPct: 20,
      isCustomGroup: true,
      tasks: { repair: true, replacePart: true, install: true },
    })
    expect(onSite.success).toBe(true)
  })

  it('VPR-02: Rejects negative inspection fee, invalid GP%, or blank group name', () => {
    expect(
      productGroupRateSchema.safeParse({
        groupName: 'ปั๊มน้ำ',
        serviceType: 'CARRY_IN',
        minInspectionFee: -50,
        gpPct: 18,
      }).success
    ).toBe(false)

    expect(
      productGroupRateSchema.safeParse({
        groupName: 'ปั๊มน้ำ',
        serviceType: 'CARRY_IN',
        minInspectionFee: 300,
        gpPct: 120,
      }).success
    ).toBe(false)

    expect(
      productGroupRateSchema.safeParse({
        groupName: '   ',
        serviceType: 'CARRY_IN',
        minInspectionFee: 300,
        gpPct: 18,
      }).success
    ).toBe(false)
  })

  it('VPR-03: Validates Admin Master Product Group schema and enforces min <= recommended bounds', () => {
    const valid = vendorServiceGroupInputSchema.safeParse({
      serviceType: 'CARRY_IN',
      name: 'เครื่องมือช่างไร้สาย',
      minInspectionFee: 100,
      recommendedFee: 300,
      minGpPct: 10,
      defaultGpPct: 18,
      sortOrder: 10,
      active: true,
    })
    expect(valid.success).toBe(true)

    const invalidBounds = vendorServiceGroupInputSchema.safeParse({
      serviceType: 'CARRY_IN',
      name: 'เครื่องมือช่างไร้สาย',
      minInspectionFee: 500,
      recommendedFee: 200,
      minGpPct: 10,
      defaultGpPct: 18,
    })
    expect(invalidBounds.success).toBe(false)
  })

  it('VPR-04: Normalizes V6 form by stripping ON_SITE productGroupRates when onsProducts is empty', () => {
    const formWithMixedRates = {
      ...INITIAL_FORM_V6,
      supplierRegistered: 'ไม่เคยลงทะเบียนทำการค้ากับไทวัสดุ' as const,
      company: 'บริษัท ไทยเซอร์วิสโปร จำกัด',
      taxId: '0105559998887',
      companyAddr: {
        line1: '10/2 ถนนศรีนครินทร์',
        subdistrict: 'หนองบอน',
        district: 'ประเวศ',
        province: 'กรุงเทพมหานคร',
        zip: '10250',
        phone: '023456789',
        note: '',
      },
      branches: [
        {
          line1: '10/2 ถนนศรีนครินทร์',
          subdistrict: 'หนองบอน',
          district: 'ประเวศ',
          province: 'กรุงเทพมหานคร',
          zip: '10250',
          phone: '023456789',
          contactName: 'คุณวิชัย',
          note: '',
        },
      ],
      primaryContact: {
        name: 'คุณวิชัย ช่างเอก',
        pos: 'ผจก.',
        phone: '0812223333',
        email: 'wichai@servicepro.co.th',
        line: '',
      },
      bank: {
        accName: 'บริษัท ไทยเซอร์วิสโปร จำกัด',
        accNo: '1112223334',
        bank: 'ไทยพาณิชย์',
        bankBranch: 'ศรีนครินทร์',
        vat20: 'มี' as const,
      },
      cinProducts: ['เครื่องใช้ไฟฟ้าขนาดเล็ก', 'เครื่องเชื่อมไฟฟ้า'],
      onsProducts: [],
      productGroupRates: [
        {
          groupName: 'เครื่องใช้ไฟฟ้าขนาดเล็ก',
          serviceType: 'CARRY_IN' as const,
          minInspectionFee: 200,
          gpPct: 18,
          isCustomGroup: false,
        },
        {
          groupName: 'เครื่องเชื่อมไฟฟ้า',
          serviceType: 'CARRY_IN' as const,
          minInspectionFee: 350,
          gpPct: 20,
          isCustomGroup: true,
        },
        {
          groupName: 'เครื่องปรับอากาศ',
          serviceType: 'ON_SITE' as const,
          minInspectionFee: 500,
          gpPct: 15,
          isCustomGroup: false,
          tasks: { repair: true, replacePart: true, install: false },
        },
      ],
      agreements: {
        sla: true as const,
        inspect: true as const,
        reportApp: true as const,
        training: true as const,
        pdpa: true as const,
        truth: true as const,
      },
      signName: 'คุณวิชัย ช่างเอก',
      signPos: 'กรรมการ',
    }

    const normalized = normalizeVendorFormV6(formWithMixedRates)
    expect(normalized.productGroupRates.length).toBe(2)
    expect(normalized.productGroupRates.every(r => r.serviceType === 'CARRY_IN')).toBe(true)

    const parsed = vendorApplicationV6Schema.safeParse(normalized)
    expect(parsed.success).toBe(true)
  })

  it('VPR-05: Extracts rates cleanly from both structured V6 productGroupRates and legacy V6 applications', () => {
    const structured = extractApplicationProductRates(
      {
        productGroupRates: [
          { groupName: 'ปั๊มน้ำ', serviceType: 'CARRY_IN', minInspectionFee: 250, gpPct: 17, isCustomGroup: false },
          {
            groupName: 'ปั๊มน้ำ',
            serviceType: 'ON_SITE',
            minInspectionFee: 550,
            gpPct: 22,
            isCustomGroup: false,
            tasks: { repair: true, replacePart: false, install: true },
          },
        ],
      },
      {}
    )
    expect(structured.length).toBe(2)
    expect(structured[0].minInspectionFee).toBe(250)
    expect(structured[1].minInspectionFee).toBe(550)
    expect(structured[1].tasks?.install).toBe(true)

    const legacy = extractApplicationProductRates(
      {
        carryIn: ['เครื่องมือช่าง'],
        onSite: ['ตู้เย็น'],
        productDetails: { ตู้เย็น: { repair: true, replacePart: true, install: false } },
      },
      {
        pricing: { cinFee: '300', onsFee: '600' },
        commercial: { gpPct: '20%' },
      }
    )
    expect(legacy.length).toBe(2)
    expect(legacy[0].groupName).toBe('เครื่องมือช่าง')
    expect(legacy[0].minInspectionFee).toBe(300)
    expect(legacy[0].gpPct).toBe(20)
    expect(legacy[1].groupName).toBe('ตู้เย็น')
    expect(legacy[1].minInspectionFee).toBe(600)
  })
})
