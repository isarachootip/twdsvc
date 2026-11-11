import { describe, it, expect, setTier } from '../framework/core'
import { prisma } from '../../src/lib/db'
import {
  extractApplicationBrandNames,
  resolveDeliveryMethodAndChannel,
  parseApplicationSlaDays,
  resolveApprovedParentCode,
  extractActiveCoverageRoutes,
} from '../../src/lib/vendor-approval-mapper'
import { createVendorApplicationV6 } from '../../src/lib/services/vendor-application-v6.service'
import {
  approveVendorApplication,
  resyncApprovedVendorApplication,
  backfillAllApprovedApplications,
} from '../../src/lib/services/vendor-approval.service'
import { INITIAL_FORM_V6 } from '../../src/components/vendor-setup/initial-form-v6'

setTier('Tier 1')

describe('Unit: Vendor Approval Full Data Linking & Legacy Backfill', () => {
  it('VAS-01: Mapper extracts deduplicated brands, deliveryMethod, SLA days, SPCODE & active routes', () => {
    const brands = extractApplicationBrandNames(
      {
        carryInBrands: ['bosch', 'MAKITA', '  '],
        onSiteBrands: ['Makita', 'DAIKIN'],
      },
      {
        authorizedBrands: [
          { brand: 'Mitsubishi Electric', productType: 'แอร์', certNo: 'C-01', expireDate: '' },
          { brand: '', productType: '', certNo: '', expireDate: '' },
        ],
      }
    )
    expect(brands).toEqual(['bosch', 'MAKITA', 'DAIKIN', 'Mitsubishi Electric'])

    expect(resolveDeliveryMethodAndChannel('รับสินค้าจากสาขา')).toEqual({
      deliveryMethod: 'DSD',
      standardChannel: 'DSD',
    })
    expect(resolveDeliveryMethodAndChannel('รับสินค้าจาก DC')).toEqual({
      deliveryMethod: 'DC',
      standardChannel: 'DC',
    })
    expect(resolveDeliveryMethodAndChannel('รับสินค้าจากสาขา และ รับสินค้าจาก 3PL')).toEqual({
      deliveryMethod: 'DC_DSD',
      standardChannel: 'DSD',
    })
    expect(resolveDeliveryMethodAndChannel('รับสินค้าจาก 3PL (คิดค่าใช้จ่ายเพิ่ม)')).toEqual({
      deliveryMethod: 'DC',
      standardChannel: 'TPL',
    })

    expect(parseApplicationSlaDays({ sla: { cinSlaDays: '5 วัน' } })).toBe(5)
    expect(parseApplicationSlaDays({ sla: { cinSlaDays: '14 วัน' } })).toBe(14)
    expect(parseApplicationSlaDays({})).toBe(7)

    expect(
      resolveApprovedParentCode('SC26111035', {
        supplier: {
          supplierRegistered: 'เคยลงทะเบียนทำการค้ากับไทวัสดุ',
          spcode: '620991',
        },
      })
    ).toBe('620991')
    expect(resolveApprovedParentCode('SC26111035', {})).toBe('VD-SC26111035')

    const activeRoutes = extractActiveCoverageRoutes({
      radius: '30 กม.',
      carryInReceiveMethod: 'รับสินค้าจากสาขา',
      routes: {
        BNA: { onsite: true, respBranchIdx: 1 },
        RGS: { onsite: false, respBranchIdx: 0 },
      },
    })
    expect(Object.keys(activeRoutes)).toEqual(['BNA'])
    expect(activeRoutes.BNA.respBranchIdx).toBe(1)
  })

  it('VAS-02: Approving V6 application links existing & new Brands, postalCode, deliveryMethod, SLA, Auth & Email', async () => {
    const testTaxId = '9777766665554'
    const storeName = '__TEST_VAS_LINK_STORE__'
    const newUniqueBrand = '__BRAND_YAM_TEST_99__'

    // Ensure a mixed-case existing brand exists to verify case-insensitive matching
    const existingHitachi = await prisma.brand.upsert({
      where: { name: 'Hitachi' },
      update: { active: true },
      create: { name: 'Hitachi', active: true },
    })
    await prisma.brand.deleteMany({ where: { name: newUniqueBrand } })

    const oldParents = await prisma.vendorParent.findMany({
      where: { name: storeName },
      include: { centers: true },
    })
    const oldCenterIds = oldParents.flatMap(p => p.centers.map(c => c.id))
    await prisma.user.deleteMany({ where: { vendorCenterId: { in: oldCenterIds } } })
    await prisma.branchVendorRoute.deleteMany({ where: { primaryCenterId: { in: oldCenterIds } } })
    await prisma.vendorCenter.deleteMany({ where: { id: { in: oldCenterIds } } })
    await prisma.vendorParent.deleteMany({ where: { id: { in: oldParents.map(p => p.id) } } })
    await prisma.vendorApplication.deleteMany({ where: { taxId: testTaxId } })

    const anyBranch = await prisma.site.findFirst({ where: { type: 'BRANCH' } })
    const branchKey = anyBranch?.code || 'BNA'

    const app = await createVendorApplicationV6({
      ...INITIAL_FORM_V6,
      supplierRegistered: 'ไม่เคยลงทะเบียนทำการค้ากับไทวัสดุ',
      company: storeName,
      taxId: testTaxId,
      authorized: 'เป็นศูนย์บริการ Authorized ของแบรนด์',
      authorizedBrands: [
        { brand: 'HITACHI', productType: 'ปั๊มน้ำ', certNo: 'AUTH-88', expireDate: '2027-12-31' },
      ],
      companyAddr: {
        line1: '55/9 ถนนเทพารักษ์',
        subdistrict: 'เทพารักษ์',
        district: 'เมืองสมุทรปราการ',
        province: 'สมุทรปราการ',
        zip: '10270',
        phone: '027778888',
        note: '',
      },
      branchType: 'มีศูนย์บริการหลายสาขา',
      branches: [
        {
          line1: '55/9 ถนนเทพารักษ์',
          subdistrict: 'เทพารักษ์',
          district: 'เมืองสมุทรปราการ',
          province: 'สมุทรปราการ',
          zip: '10270',
          phone: '027778888',
          contactName: 'ผจก. สาขา 1',
          note: '',
        },
        {
          line1: '101 ถนนสุขุมวิท',
          subdistrict: 'บางนาใต้',
          district: 'บางนา',
          province: 'กรุงเทพมหานคร',
          zip: '10260',
          phone: '026665555',
          contactName: 'ผจก. สาขา 2',
          note: '',
        },
      ],
      primaryContact: {
        name: 'คุณแยม บริการดี',
        pos: 'กรรมการ',
        phone: '0815554444',
        email: 'yam-vas@example.com',
        line: '@yamvas',
      },
      bank: {
        accName: storeName,
        accNo: '1112223334',
        bank: 'ไทยพาณิชย์',
        bankBranch: 'เทพารักษ์',
        vat20: 'มี',
      },
      cinProducts: ['ปั๊มน้ำ'],
      cinBrands: ['HITACHI', newUniqueBrand],
      cinReceiveMethod: 'รับสินค้าจากสาขา',
      onsProducts: ['ปั๊มน้ำ'],
      onsBrands: ['HITACHI'],
      productGroupRates: [
        { groupName: 'ปั๊มน้ำ', serviceType: 'CARRY_IN', minInspectionFee: 350, gpPct: 20, isCustomGroup: false },
        { groupName: 'ปั๊มน้ำ', serviceType: 'ON_SITE', minInspectionFee: 500, gpPct: 20, isCustomGroup: false },
      ],
      coverage: {
        [branchKey]: { onsite: true, respBranchIdx: 1 },
        UNUSED_SITE_CODE: { onsite: false, respBranchIdx: 0 },
      },
      cinSlaDays: '5 วัน',
      agreements: {
        sla: true,
        inspect: true,
        reportApp: true,
        training: true,
        pdpa: true,
        truth: true,
      },
      signName: 'คุณแยม บริการดี',
      signPos: 'กรรมการ',
    })

    const { application: approvedApp, credentials } = await approveVendorApplication(app.id, 'admin-vas')
    const parent = await prisma.vendorParent.findUnique({
      where: { id: approvedApp.approvedParentId! },
      include: {
        brands: { include: { brand: true } },
        centers: { orderBy: { code: 'asc' } },
      },
    })

    expect(Boolean(parent)).toBe(true)
    expect(parent!.isBrandAuthorized).toBe(true)
    expect(parent!.defaultRepairSlaDays).toBe(5)
    expect(parent!.brands.length).toBe(2)
    // Matched existing 'Hitachi' case-insensitively without creating duplicate 'HITACHI'
    expect(parent!.brands.some(vb => vb.brandId === existingHitachi.id)).toBe(true)
    expect(parent!.brands.some(vb => vb.brand.name === newUniqueBrand)).toBe(true)

    expect(parent!.centers.length).toBe(2)
    expect(parent!.centers[0].postalCode).toBe('10270')
    expect(parent!.centers[0].deliveryMethod).toBe('DSD')
    expect(parent!.centers[1].postalCode).toBe('10260')
    expect(parent!.centers[1].deliveryMethod).toBe('DSD')

    if (anyBranch && credentials) {
      const route = await prisma.branchVendorRoute.findFirst({
        where: { branchId: anyBranch.id, primaryCenterId: parent!.centers[1].id },
      })
      expect(Boolean(route)).toBe(true)
      expect(route!.standardChannel).toBe('DSD')
    }

    const vdUser = credentials
      ? await prisma.user.findUnique({ where: { username: credentials.username } })
      : null
    expect(Boolean(vdUser)).toBe(true)
    expect(vdUser!.email).toBe('yam-vas@example.com')

    // Simulate legacy broken state (0 brands, null postalCode, hardcoded DC & 7 SLA) then run backfill!
    await prisma.vendorBrand.deleteMany({ where: { vendorParentId: parent!.id } })
    await prisma.vendorCenter.updateMany({
      where: { vendorParentId: parent!.id },
      data: { postalCode: null, deliveryMethod: 'DC' },
    })
    await prisma.vendorParent.update({
      where: { id: parent!.id },
      data: { defaultRepairSlaDays: 7 },
    })

    const backfillSummary = await backfillAllApprovedApplications()
    expect(backfillSummary.syncedCount >= 1).toBe(true)

    // Re-sync single application explicitly as well (must remain idempotent!)
    await resyncApprovedVendorApplication(app.id)

    const afterResync = await prisma.vendorParent.findUnique({
      where: { id: parent!.id },
      include: { brands: true, centers: { orderBy: { code: 'asc' } } },
    })
    expect(afterResync!.brands.length).toBe(2)
    expect(afterResync!.defaultRepairSlaDays).toBe(5)
    expect(afterResync!.centers[0].postalCode).toBe('10270')
    expect(afterResync!.centers[0].deliveryMethod).toBe('DSD')

    // Cleanup
    await prisma.user.deleteMany({ where: { vendorCenterId: { in: parent!.centers.map(c => c.id) } } })
    await prisma.branchVendorRoute.deleteMany({ where: { primaryCenterId: { in: parent!.centers.map(c => c.id) } } })
    await prisma.vendorCenter.deleteMany({ where: { vendorParentId: parent!.id } })
    await prisma.vendorParent.delete({ where: { id: parent!.id } })
    await prisma.vendorApplication.delete({ where: { id: app.id } })
    await prisma.brand.deleteMany({ where: { name: newUniqueBrand } })
  })

  it('VAS-03: Uses 6-digit SPCODE as VendorParent.code and preserves existing User password on approval', async () => {
    const testSpcode = '998877'
    const testTaxId = '9666655554443'
    const storeName = '__TEST_SPCODE_STORE__'

    // Cleanup prior runs
    const staleParent = await prisma.vendorParent.findUnique({
      where: { code: testSpcode },
      include: { centers: true },
    })
    if (staleParent) {
      const cIds = staleParent.centers.map(c => c.id)
      await prisma.user.deleteMany({ where: { OR: [{ username: testSpcode }, { vendorCenterId: { in: cIds } }] } })
      await prisma.branchVendorRoute.deleteMany({ where: { primaryCenterId: { in: cIds } } })
      await prisma.vendorCenter.deleteMany({ where: { id: { in: cIds } } })
      await prisma.vendorParent.delete({ where: { id: staleParent.id } })
    }
    await prisma.user.deleteMany({ where: { username: testSpcode } })
    await prisma.vendorApplication.deleteMany({ where: { taxId: testTaxId } })

    // Pre-create an existing VD user for SPCODE '998877' to verify password is NOT overwritten
    const existingHash = '$2a$12$existinghashpreserved12345678901234567890123456789012'
    await prisma.user.create({
      data: {
        username: testSpcode,
        password: existingHash,
        fullName: 'คู่ค้าเดิม 998877',
        role: 'VD',
        mustChangePassword: false,
      },
    })

    const app = await createVendorApplicationV6({
      ...INITIAL_FORM_V6,
      supplierRegistered: 'เคยลงทะเบียนทำการค้ากับไทวัสดุ',
      spcode: testSpcode,
      company: storeName,
      taxId: testTaxId,
      companyAddr: {
        line1: '12 ถนนพหลโยธิน',
        subdistrict: 'จตุจักร',
        district: 'จตุจักร',
        province: 'กรุงเทพมหานคร',
        zip: '10900',
        phone: '021113333',
        note: '',
      },
      branchType: 'ศูนย์บริการเดียว',
      branches: [
        {
          line1: '12 ถนนพหลโยธิน',
          subdistrict: 'จตุจักร',
          district: 'จตุจักร',
          province: 'กรุงเทพมหานคร',
          zip: '10900',
          phone: '021113333',
          contactName: 'ผจก. SPCODE',
          note: '',
        },
      ],
      primaryContact: {
        name: 'ผจก. SPCODE',
        pos: 'ผจก.',
        phone: '0812223333',
        email: 'spcode998877@example.com',
        line: '',
      },
      bank: {
        accName: storeName,
        accNo: '9988776655',
        bank: 'กรุงไทย',
        bankBranch: 'จตุจักร',
        vat20: 'มี',
      },
      cinProducts: ['เครื่องมือช่าง'],
      cinBrands: ['MAKITA'],
      productGroupRates: [
        { groupName: 'เครื่องมือช่าง', serviceType: 'CARRY_IN', minInspectionFee: 300, gpPct: 18, isCustomGroup: false },
      ],
      agreements: {
        sla: true,
        inspect: true,
        reportApp: true,
        training: true,
        pdpa: true,
        truth: true,
      },
      signName: 'ผจก. SPCODE',
      signPos: 'ผจก.',
    })

    const { application: approvedApp, credentials } = await approveVendorApplication(app.id, 'admin-spcode')
    const parent = await prisma.vendorParent.findUnique({
      where: { id: approvedApp.approvedParentId! },
      include: { centers: true, brands: true },
    })
    expect(parent!.code).toBe(testSpcode)
    expect(parent!.brands.length).toBe(1)
    expect(credentials).toBe(null)

    const preservedUser = await prisma.user.findUnique({ where: { username: testSpcode } })
    expect(preservedUser!.password).toBe(existingHash)
    expect(preservedUser!.vendorCenterId).toBe(parent!.centers[0].id)

    // Cleanup
    await prisma.user.deleteMany({ where: { username: testSpcode } })
    await prisma.branchVendorRoute.deleteMany({ where: { primaryCenterId: { in: parent!.centers.map(c => c.id) } } })
    await prisma.vendorCenter.deleteMany({ where: { vendorParentId: parent!.id } })
    await prisma.vendorParent.delete({ where: { id: parent!.id } })
    await prisma.vendorApplication.delete({ where: { id: app.id } })
  })
})
