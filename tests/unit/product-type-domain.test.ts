import { describe, it, expect, setTier } from '../framework/core'
import {
  deduplicateActiveProductTypes,
  matchProductTypeFromCommodity,
  type ProductTypeGroupLite,
} from '../../src/lib/services/product-type-matcher'
import {
  resolveVendorGroupRate,
  isVendorEligibleForProductGroup,
} from '../../src/lib/services/vendor-rate-resolver'

setTier('Tier 1')

describe('Unit: Product Type Domain (Matcher, Rate Resolver & Routing Eligibility)', () => {
  const sampleGroups: ProductTypeGroupLite[] = [
    {
      serviceType: 'CARRY_IN',
      name: 'เครื่องมือช่าง',
      skuKeywords: 'สว่าน, หินเจียร, เลื่อย, power tool',
      sortOrder: 70,
      active: true,
    },
    {
      serviceType: 'CARRY_IN',
      name: 'ปั๊มน้ำ',
      skuKeywords: 'ปั๊มน้ำ,ปั๊มแช่,water pump',
      sortOrder: 50,
      active: true,
    },
    {
      serviceType: 'ON_SITE',
      name: 'ปั๊มน้ำ',
      skuKeywords: 'ปั๊มบาดาล',
      sortOrder: 10,
      active: true,
    },
    {
      serviceType: 'CARRY_IN',
      name: 'ปั๊มน้ำอัตโนมัติ',
      skuKeywords: 'ปั๊มน้ำอัตโนมัติ,ปั๊มอัตโนมัติ,auto pump',
      sortOrder: 60,
      active: true,
    },
    {
      serviceType: 'ON_SITE',
      name: 'เครื่องปรับอากาศ',
      skuKeywords: 'แอร์,เครื่องปรับอากาศ,air conditioner',
      sortOrder: 20,
      active: true,
    },
    {
      serviceType: 'CARRY_IN',
      name: 'กลุ่มปิดใช้งาน',
      skuKeywords: 'เตารีดไอน้ำเก่า',
      sortOrder: 90,
      active: false,
    },
  ]

  it('PTD-01: deduplicateActiveProductTypes merges CARRY_IN and ON_SITE by name and excludes inactive groups', () => {
    const options = deduplicateActiveProductTypes(sampleGroups)
    expect(options.some(o => o.name === 'กลุ่มปิดใช้งาน')).toBe(false)
    expect(options.filter(o => o.name === 'ปั๊มน้ำ').length).toBe(1)

    const pump = options.find(o => o.name === 'ปั๊มน้ำ')!
    expect(pump.serviceTypes.includes('CARRY_IN')).toBe(true)
    expect(pump.serviceTypes.includes('ON_SITE')).toBe(true)
    expect(pump.keywords.includes('ปั๊มแช่')).toBe(true)
    expect(pump.keywords.includes('ปั๊มบาดาล')).toBe(true)
  })

  it('PTD-02: matchProductTypeFromCommodity matches SKU keywords across name/deptName/className', () => {
    const options = deduplicateActiveProductTypes(sampleGroups)

    const drillMatch = matchProductTypeFromCommodity(
      { name: 'BOSCH GSB 13 RE ชุดสว่านกระแทก', deptName: 'HARDWARE', className: 'POWER TOOLS' },
      options
    )
    expect(drillMatch).toBe('เครื่องมือช่าง')

    const acMatch = matchProductTypeFromCommodity(
      { name: 'DAIKIN INVERTER 12000 BTU', className: 'Air Conditioner Wall Type' },
      options
    )
    expect(acMatch).toBe('เครื่องปรับอากาศ')
  })

  it('PTD-03: matchProductTypeFromCommodity prefers more specific keyword ("ปั๊มน้ำอัตโนมัติ" over "ปั๊มน้ำ")', () => {
    const options = deduplicateActiveProductTypes(sampleGroups)

    const autoPump = matchProductTypeFromCommodity(
      { name: 'MITSUBISHI WP-255R ปั๊มน้ำอัตโนมัติ 250W' },
      options
    )
    expect(autoPump).toBe('ปั๊มน้ำอัตโนมัติ')

    const unmatched = matchProductTypeFromCommodity(
      { name: 'สีทาบ้านภายใน 5 แกลลอน', deptName: 'PAINT' },
      options
    )
    expect(unmatched).toBe(null)
  })

  it('PTD-04: resolveVendorGroupRate prioritizes CARRY_IN rate, falls back to ON_SITE then VendorParent defaults', () => {
    const vendorParent = {
      defaultGpPct: 18,
      inspectionFeeCovered: 0,
      inspectionFeeNotCovered: 300,
      productRates: [
        { serviceType: 'ON_SITE' as const, groupName: 'ปั๊มน้ำ', minInspectionFee: 550, gpPct: 20 },
        { serviceType: 'CARRY_IN' as const, groupName: 'ปั๊มน้ำ', minInspectionFee: 250, gpPct: 15 },
        { serviceType: 'ON_SITE' as const, groupName: 'เครื่องปรับอากาศ', minInspectionFee: 600, gpPct: 22 },
      ],
    }

    // 1. Both CARRY_IN & ON_SITE exist -> CARRY_IN wins
    const pumpRate = resolveVendorGroupRate({
      vendorParent,
      gpPctOverride: null,
      hasWarranty: false,
      productGroupName: 'ปั๊มน้ำ',
    })
    expect(pumpRate.inspectionFee).toBe(250)
    expect(pumpRate.gpPct).toBe(15)

    // 2. Only ON_SITE exists -> ON_SITE wins
    const acRate = resolveVendorGroupRate({
      vendorParent,
      gpPctOverride: null,
      hasWarranty: false,
      productGroupName: 'เครื่องปรับอากาศ',
    })
    expect(acRate.inspectionFee).toBe(600)
    expect(acRate.gpPct).toBe(22)

    // 3. Center gpPctOverride overrides group gpPct, and warranty uses inspectionFeeCovered
    const overrideWarrantyRate = resolveVendorGroupRate({
      vendorParent,
      gpPctOverride: 12.5,
      hasWarranty: true,
      productGroupName: 'ปั๊มน้ำ',
    })
    expect(overrideWarrantyRate.inspectionFee).toBe(0)
    expect(overrideWarrantyRate.gpPct).toBe(12.5)

    // 4. Unmatched group falls back to vendorParent defaults
    const fallbackRate = resolveVendorGroupRate({
      vendorParent,
      gpPctOverride: null,
      hasWarranty: false,
      productGroupName: 'เครื่องมือช่าง',
    })
    expect(fallbackRate.inspectionFee).toBe(300)
    expect(fallbackRate.gpPct).toBe(18)
  })

  it('PTD-05: isVendorEligibleForProductGroup supports backward-compatible legacy vendors and filters configured vendors', () => {
    // Legacy vendor with 0 productRates -> accepts all
    expect(isVendorEligibleForProductGroup([], 'เครื่องมือช่าง')).toBe(true)

    const configuredRates = [
      { groupName: 'เครื่องมือช่าง' },
      { groupName: 'ปั๊มน้ำ' },
    ]
    expect(isVendorEligibleForProductGroup(configuredRates, 'เครื่องมือช่าง')).toBe(true)
    expect(isVendorEligibleForProductGroup(configuredRates, 'เครื่องปรับอากาศ')).toBe(false)
    expect(isVendorEligibleForProductGroup(configuredRates, null)).toBe(true)
  })
})
