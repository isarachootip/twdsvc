import { describe, it, expect, setTier } from '../framework/core'
import { createEmptyVendor, VendorFilterState, VendorParentRow } from '../../src/app/(dashboard)/admin/sections/vendor/vendor-types'
import { saveSignatureDataUrl } from '../../src/lib/services/file-storage.service'

setTier('Tier 1')

describe('Unit: Vendor Directory & Single-Vendor Management', () => {
  it('VD-ADMIN-01: createEmptyVendor provides correct initial defaults', () => {
    const v = createEmptyVendor()
    expect(v.code).toBe('')
    expect(v.name).toBe('')
    expect(v.defaultGpPct).toBe(18)
    expect(v.defaultRepairSlaDays).toBe(7)
    expect(v.repairWarrantyDays).toBe(30)
    expect(v.isBrandAuthorized).toBe(false)
    expect(v.brandIds.length).toBe(0)
    expect(v.centers.length).toBe(0)
  })

  it('VD-ADMIN-02: Vendor filter logic filters by authorized vs general status', () => {
    const sampleVendors: VendorParentRow[] = [
      {
        ...createEmptyVendor(),
        code: '600309',
        name: 'TOSHIBA THAILAND',
        isBrandAuthorized: true,
      },
      {
        ...createEmptyVendor(),
        code: '600400',
        name: 'GENERAL SERVICE CO',
        isBrandAuthorized: false,
      },
    ]

    const filterAuth: VendorFilterState = { search: '', authorized: 'AUTH' }
    const filteredAuth = sampleVendors.filter(v => {
      if (filterAuth.authorized === 'AUTH' && !v.isBrandAuthorized) return false
      if (filterAuth.authorized === 'GENERAL' && v.isBrandAuthorized) return false
      return true
    })
    expect(filteredAuth.length).toBe(1)
    expect(filteredAuth[0].code).toBe('600309')

    const filterGeneral: VendorFilterState = { search: '', authorized: 'GENERAL' }
    const filteredGen = sampleVendors.filter(v => {
      if (filterGeneral.authorized === 'AUTH' && !v.isBrandAuthorized) return false
      if (filterGeneral.authorized === 'GENERAL' && v.isBrandAuthorized) return false
      return true
    })
    expect(filteredGen.length).toBe(1)
    expect(filteredGen[0].code).toBe('600400')
  })

  it('VD-ADMIN-03: Vendor search filter matches code or company name case-insensitively', () => {
    const sampleVendors: VendorParentRow[] = [
      {
        ...createEmptyVendor(),
        code: '600309',
        name: 'TOSHIBA THAILAND',
      },
      {
        ...createEmptyVendor(),
        code: '600429',
        name: 'KOREA POWER PRODUCTS',
      },
    ]

    const searchToshiba = 'toshiba'
    const results = sampleVendors.filter(v => {
      const q = searchToshiba.toLowerCase().trim()
      return v.code.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)
    })
    expect(results.length).toBe(1)
    expect(results[0].code).toBe('600309')

    const searchCode = '6004'
    const resultsCode = sampleVendors.filter(v => {
      const q = searchCode.toLowerCase().trim()
      return v.code.toLowerCase().includes(q) || v.name.toLowerCase().includes(q)
    })
    expect(resultsCode.length).toBe(1)
    expect(resultsCode[0].code).toBe('600429')
  })

  it('VD-ADMIN-04: saveSignatureDataUrl gracefully retains pre-existing file URLs', async () => {
    const regularUrl = '/uploads/sample-signature.png'
    const preserved = await saveSignatureDataUrl(regularUrl)
    expect(preserved).toBe(regularUrl)
  })

  it('VD-ADMIN-05: saveSignatureDataUrl persists valid base64 data URLs as stored file URLs', async () => {
    // 1x1 transparent png data url
    const pngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    const savedUrl = await saveSignatureDataUrl(pngDataUrl, 'test-sig')
    expect(savedUrl.startsWith('/api/files/test-sig-')).toBe(true)
  })

  it('VD-ADMIN-06: formatStructuredAddress correctly compiles Thai address parts', () => {
    const { formatStructuredAddress } = require('../../src/app/(dashboard)/admin/sections/vendor/vendor-address-helper')
    const formatted = formatStructuredAddress({
      houseNo: '88/12 หมู่ 5 ถ.บางนา-ตราด',
      subdistrict: 'บางนา',
      district: 'บางนา',
      province: 'กรุงเทพมหานคร',
      postalCode: '10260',
    })
    expect(formatted).toBe('88/12 หมู่ 5 ถ.บางนา-ตราด ต.บางนา อ.บางนา กรุงเทพมหานคร 10260')

    const withPrefixes = formatStructuredAddress({
      houseNo: '100/1 ถ.มิตรภาพ',
      subdistrict: 'ต.ในเมือง',
      district: 'อ.เมือง',
      province: 'จ.ขอนแก่น',
      postalCode: '40000',
    })
    expect(withPrefixes).toBe('100/1 ถ.มิตรภาพ ต.ในเมือง อ.เมือง จ.ขอนแก่น 40000')
  })

  it('VD-ADMIN-07: extractPostalCode correctly extracts 5-digit code from Thai address strings', () => {
    const { extractPostalCode } = require('../../src/app/(dashboard)/admin/sections/vendor/vendor-address-helper')
    expect(extractPostalCode('88/12 หมู่ 5 ถ.บางนา บางนา กทม. 10260')).toBe('10260')
    expect(extractPostalCode('123 ถนนสุขุมวิท พระโขนง กรุงเทพฯ')).toBeNull()
    expect(extractPostalCode('')).toBeNull()
  })

  it('VD-ADMIN-08: matchSiteByPostalCode matches exact 5-digit and falls back to 2-digit provincial prefix', () => {
    const { matchSiteByPostalCode } = require('../../src/app/(dashboard)/admin/sections/vendor/vendor-address-helper')
    const sampleSites = [
      { id: 's-bangna', code: '6001', name: 'สาขาบางนา', type: 'BRANCH', postalCode: '10260' },
      { id: 's-rangsit', code: '6002', name: 'สาขารังสิต', type: 'BRANCH', postalCode: '12130' },
      { id: 's-khonkaen', code: '6003', name: 'สาขาขอนแก่น', type: 'BRANCH', postalCode: '40000' },
      { id: 's-bkk-dc', code: 'DC01', name: 'ศูนย์กระจายสินค้า วังน้อย', type: 'DC', postalCode: '13170' },
    ]

    // 1. Exact 5-digit match
    const exactMatch = matchSiteByPostalCode('10260', sampleSites)
    expect(exactMatch?.id).toBe('s-bangna')

    // 2. 2-digit fallback match (10xxx matches Bangna which starts with 10)
    const fallbackMatch = matchSiteByPostalCode('10110', sampleSites)
    expect(fallbackMatch?.id).toBe('s-bangna')

    // 3. No match returns null
    const noMatch = matchSiteByPostalCode('99999', sampleSites)
    expect(noMatch).toBeNull()

    // 4. Invalid or short zip returns null
    expect(matchSiteByPostalCode('10', sampleSites)).toBeNull()
    expect(matchSiteByPostalCode('', sampleSites)).toBeNull()
  })

  it('VD-ADMIN-09: upsertSingleVendor saves postalCode for vendor centers', async () => {
    const { upsertSingleVendor } = require('../../src/lib/services/vendor-admin.service')
    const { prisma } = require('../../src/lib/db')
    const testVendor = {
      code: 'TEST_VD_ZIP',
      name: 'TEST VENDOR ZIP MAPPING',
      defaultGpPct: 18,
      defaultRepairSlaDays: 7,
      repairWarrantyDays: 30,
      inspectionFeeCovered: 0,
      inspectionFeeNotCovered: 300,
      isBrandAuthorized: true,
      brandIds: [],
      sizeIds: [],
      centers: [
        {
          code: 'TEST_VD_ZIP-1',
          address: '88/1 ถ.บางนา ต.บางนา อ.บางนา กรุงเทพมหานคร 10260',
          postalCode: '10260',
          deliveryMethod: 'DSD',
        },
      ],
    }
    const saved = await upsertSingleVendor(testVendor)
    expect(saved).toBeDefined()
    const foundCenter = await prisma.vendorCenter.findUnique({
      where: { code: 'TEST_VD_ZIP-1' },
      select: { code: true, postalCode: true, address: true },
    })
    expect(foundCenter?.postalCode).toBe('10260')

    // Clean up
    await prisma.vendorCenter.deleteMany({ where: { vendorParentId: saved.id } })
    await prisma.vendorParent.delete({ where: { id: saved.id } })
  })
})

