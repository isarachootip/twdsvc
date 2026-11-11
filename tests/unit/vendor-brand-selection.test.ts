import { describe, it, expect, setTier } from '../framework/core'
import { prisma } from '../../src/lib/db'
import {
  filterBrandOptions,
  toggleBrandSelection,
  extractApplicationBrandSummary,
  resolveApprovedBrandNames,
} from '../../src/lib/vendor-brand-selection'
import { INITIAL_FORM_V6 } from '../../src/components/vendor-setup/initial-form-v6'
import { normalizeVendorFormV6 } from '../../src/components/vendor-setup/useVendorSetupV6'
import { createVendorApplicationV6 } from '../../src/lib/services/vendor-application-v6.service'
import { approveVendorApplication } from '../../src/lib/services/vendor-application.service'

setTier('Tier 1')

describe('Unit: Vendor Brand Selection ("รับซ่อมทุกแบรนด์") & Approval Sync', () => {
  it('VBS-01: Filters brand options case-insensitively and returns all when query is blank', () => {
    const sample = ['PANASONIC', 'TOSHIBA', 'MITSUBISHI', 'MAKITA']
    expect(filterBrandOptions(sample, '').length).toBe(4)
    expect(filterBrandOptions(sample, '  m  ')).toEqual(['MITSUBISHI', 'MAKITA'])
    expect(filterBrandOptions(sample, 'toshiba')).toEqual(['TOSHIBA'])
  })

  it('VBS-02: Toggles individual brand selection cleanly without duplicates', () => {
    const step1 = toggleBrandSelection(['PANASONIC'], 'TOSHIBA')
    expect(step1).toEqual(['PANASONIC', 'TOSHIBA'])
    const step2 = toggleBrandSelection(step1, 'PANASONIC')
    expect(step2).toEqual(['TOSHIBA'])
  })

  it('VBS-03: Extracts Carry-in and On-site brand summary from application appliances JSON', () => {
    const summaryAll = extractApplicationBrandSummary({
      carryIn: ['ปั๊มน้ำ'],
      carryInAllBrands: true,
      carryInBrands: [],
      onSite: ['เครื่องปรับอากาศ'],
      onSiteAllBrands: false,
      onSiteBrands: ['DAIKIN', 'MITSUBISHI'],
    })
    expect(summaryAll.hasCarryIn).toBe(true)
    expect(summaryAll.carryInAllBrands).toBe(true)
    expect(summaryAll.carryInBrands).toEqual([])
    expect(summaryAll.hasOnSite).toBe(true)
    expect(summaryAll.onSiteAllBrands).toBe(false)
    expect(summaryAll.onSiteBrands).toEqual(['DAIKIN', 'MITSUBISHI'])

    const fallback = extractApplicationBrandSummary(null)
    expect(fallback.carryInAllBrands).toBe(false)
    expect(fallback.onSiteAllBrands).toBe(false)
    expect(fallback.carryInBrands).toEqual([])
  })

  it('VBS-04: Resolves unrestricted mode vs explicit brand list for VendorBrand approval', () => {
    // Active Carry-in checked "รับซ่อมทุกแบรนด์" -> unrestricted (VendorBrand = [])
    const r1 = resolveApprovedBrandNames({
      carryIn: ['ปั๊มน้ำ'],
      carryInAllBrands: true,
      carryInBrands: ['MAKITA'],
      onSite: ['เครื่องปรับอากาศ'],
      onSiteAllBrands: false,
      onSiteBrands: ['DAIKIN'],
    })
    expect(r1.unrestricted).toBe(true)
    expect(r1.brandNames).toEqual([])

    // Specific brands only -> deduplicated uppercase names
    const r2 = resolveApprovedBrandNames({
      carryIn: ['ปั๊มน้ำ'],
      carryInAllBrands: false,
      carryInBrands: ['makita', 'BOSCH'],
      onSite: ['เครื่องปรับอากาศ'],
      onSiteAllBrands: false,
      onSiteBrands: ['BOSCH', 'DAIKIN'],
    })
    expect(r2.unrestricted).toBe(false)
    expect(r2.brandNames).toEqual(['MAKITA', 'BOSCH', 'DAIKIN'])

    // Carry-in left empty without specific brands -> unrestricted fallback
    const r3 = resolveApprovedBrandNames({
      carryIn: ['ปั๊มน้ำ'],
      carryInAllBrands: false,
      carryInBrands: [],
      onSite: [],
      onSiteAllBrands: false,
      onSiteBrands: [],
    })
    expect(r3.unrestricted).toBe(true)
    expect(r3.brandNames).toEqual([])
  })

  it('VBS-05: normalizeVendorFormV6 clears specific brands when All Brands is checked and resets On-site when disabled', () => {
    const normalizedAll = normalizeVendorFormV6({
      ...INITIAL_FORM_V6,
      cinProducts: ['ปั๊มน้ำ'],
      cinAllBrands: true,
      cinBrands: ['MAKITA', 'BOSCH'],
      onsProducts: [],
      onsAllBrands: true,
      onsBrands: ['DAIKIN'],
    })
    expect(normalizedAll.cinAllBrands).toBe(true)
    expect(normalizedAll.cinBrands).toEqual([])
    expect(normalizedAll.onsAllBrands).toBe(false)
    expect(normalizedAll.onsBrands).toEqual([])
  })

  it('VBS-06: Persists All Brands vs specific brands into VendorBrand upon application approval', async () => {
    const storeAll = '__TEST_ALL_BRANDS_VD__'
    const storeSpec = '__TEST_SPECIFIC_BRANDS_VD__'
    const taxAll = '9777766665551'
    const taxSpec = '9777766665552'

    const cleanup = async () => {
      const parents = await prisma.vendorParent.findMany({
        where: { name: { in: [storeAll, storeSpec] } },
        include: { centers: true },
      })
      const cIds = parents.flatMap(p => p.centers.map(c => c.id))
      await prisma.user.deleteMany({ where: { vendorCenterId: { in: cIds } } })
      await prisma.branchVendorRoute.deleteMany({ where: { primaryCenterId: { in: cIds } } })
      await prisma.vendorCenter.deleteMany({ where: { id: { in: cIds } } })
      await prisma.vendorParent.deleteMany({ where: { id: { in: parents.map(p => p.id) } } })
      await prisma.vendorApplication.deleteMany({ where: { taxId: { in: [taxAll, taxSpec] } } })
    }
    await cleanup()

    try {
      const baseInput = {
        ...INITIAL_FORM_V6,
        supplierRegistered: 'ไม่เคยลงทะเบียนทำการค้ากับไทวัสดุ' as const,
        branchType: 'ศูนย์บริการเดียว' as const,
        companyAddr: {
          line1: '10/1 ถนนเทพรัตน',
          subdistrict: 'บางนาเหนือ',
          district: 'บางนา',
          province: 'กรุงเทพมหานคร',
          zip: '10260',
          phone: '021234567',
          note: '',
        },
        branches: [
          {
            line1: '10/1 ถนนเทพรัตน',
            subdistrict: 'บางนาเหนือ',
            district: 'บางนา',
            province: 'กรุงเทพมหานคร',
            zip: '10260',
            phone: '021234567',
            contactName: 'นายสมศักดิ์',
            note: '',
          },
        ],
        primaryContact: {
          name: 'นายสมศักดิ์',
          pos: 'ผจก.',
          phone: '0812223333',
          email: 'brandtest@example.com',
          line: '',
        },
        bank: {
          accName: 'บจก. ทดสอบแบรนด์',
          accNo: '1112223334',
          bank: 'ไทยพาณิชย์',
          bankBranch: 'บางนา',
          vat20: 'มี' as const,
        },
        cinProducts: ['เครื่องใช้ไฟฟ้าขนาดเล็ก'],
        productGroupRates: [
          {
            groupName: 'เครื่องใช้ไฟฟ้าขนาดเล็ก',
            serviceType: 'CARRY_IN' as const,
            minInspectionFee: 200,
            gpPct: 18,
            isCustomGroup: false,
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
        signName: 'นายสมศักดิ์',
        signPos: 'กรรมการ',
      }

      // 1) All Brands checked -> VendorBrand must be empty (unrestricted)
      const appAll = await createVendorApplicationV6({
        ...baseInput,
        company: storeAll,
        taxId: taxAll,
        cinAllBrands: true,
        cinBrands: [],
      })
      const { application: approvedAll } = await approveVendorApplication(appAll.id, 'admin-brand-test')
      const parentAll = await prisma.vendorParent.findUniqueOrThrow({
        where: { id: approvedAll.approvedParentId! },
        include: { brands: true },
      })
      expect(parentAll.brands.length).toBe(0)

      // 2) Specific Brands selected -> VendorBrand must contain PANASONIC & TOSHIBA
      const appSpec = await createVendorApplicationV6({
        ...baseInput,
        company: storeSpec,
        taxId: taxSpec,
        cinAllBrands: false,
        cinBrands: ['PANASONIC', 'TOSHIBA'],
      })
      const { application: approvedSpec } = await approveVendorApplication(appSpec.id, 'admin-brand-test')
      const parentSpec = await prisma.vendorParent.findUniqueOrThrow({
        where: { id: approvedSpec.approvedParentId! },
        include: { brands: { include: { brand: true } } },
      })
      const linkedNames = parentSpec.brands.map(vb => vb.brand.name.toUpperCase()).sort()
      expect(linkedNames).toEqual(['PANASONIC', 'TOSHIBA'])
    } finally {
      await cleanup()
    }
  })
})
