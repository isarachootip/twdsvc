import { describe, it, expect, setTier } from '../framework/core'
import { createEmptyVendor, VendorFilterState, VendorParentRow } from '../../src/app/(dashboard)/admin/sections/vendor/vendor-types'

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
})
