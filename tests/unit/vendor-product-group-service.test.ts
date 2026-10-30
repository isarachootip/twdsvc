import { describe, it, expect, setTier } from '../framework/core'
import { prisma } from '../../src/lib/db'
import {
  listVendorServiceGroups,
  upsertVendorServiceGroup,
  promoteCustomGroupToMaster,
} from '../../src/lib/services/vendor-product-group.service'
import { createVendorApplicationV6 } from '../../src/lib/services/vendor-application-v6.service'
import { approveVendorApplication } from '../../src/lib/services/vendor-application.service'
import { INITIAL_FORM_V6 } from '../../src/components/vendor-setup/initial-form-v6'

setTier('Tier 1')

describe('Unit: Vendor Product Group Master & V6 Approval Rate Persistence', () => {
  it('VPG-SVC-01: Auto-seeds default Carry-in and On-site product groups', async () => {
    const groups = await listVendorServiceGroups({ activeOnly: true })
    const carryIn = groups.filter(g => g.serviceType === 'CARRY_IN')
    const onSite = groups.filter(g => g.serviceType === 'ON_SITE')
    expect(carryIn.length >= 7).toBe(true)
    expect(onSite.length >= 8).toBe(true)
    expect(carryIn.some(g => g.name === 'เครื่องใช้ไฟฟ้าขนาดเล็ก')).toBe(true)
    expect(onSite.some(g => g.name === 'เครื่องปรับอากาศ')).toBe(true)
  })

  it('VPG-SVC-02: Upserts master group and promotes vendor custom group idempotently', async () => {
    const testGroupName = '__TEST_CUSTOM_SOLAR_PUMP__'
    await prisma.vendorServiceGroup.deleteMany({ where: { name: testGroupName } })

    const promoted = await promoteCustomGroupToMaster({
      serviceType: 'ON_SITE',
      name: testGroupName,
      recommendedFee: 650,
      defaultGpPct: 20,
    })
    expect(promoted.name).toBe(testGroupName)
    expect(promoted.recommendedFee).toBe(650)

    const updated = await upsertVendorServiceGroup({
      id: promoted.id,
      serviceType: 'ON_SITE',
      name: testGroupName,
      minInspectionFee: 200,
      recommendedFee: 700,
      minGpPct: 12,
      defaultGpPct: 22,
      sortOrder: 99,
      active: true,
    })
    expect(updated.minInspectionFee).toBe(200)
    expect(updated.defaultGpPct).toBe(22)

    await prisma.vendorServiceGroup.delete({ where: { id: promoted.id } })
  })

  it('VPG-SVC-03: Persists VendorProductRate rows and derives VendorParent defaults upon V6 approval', async () => {
    const testTaxId = '9888877776665'
    const storeName = '__TEST_V6_RATE_STORE__'

    // Cleanup prior test runs
    const oldParents = await prisma.vendorParent.findMany({ where: { name: storeName }, include: { centers: true } })
    const oldCenterIds = oldParents.flatMap(p => p.centers.map(c => c.id))
    await prisma.user.deleteMany({ where: { vendorCenterId: { in: oldCenterIds } } })
    await prisma.branchVendorRoute.deleteMany({ where: { primaryCenterId: { in: oldCenterIds } } })
    await prisma.vendorCenter.deleteMany({ where: { id: { in: oldCenterIds } } })
    await prisma.vendorParent.deleteMany({ where: { id: { in: oldParents.map(p => p.id) } } })
    await prisma.vendorApplication.deleteMany({ where: { taxId: testTaxId } })

    const app = await createVendorApplicationV6({
      ...INITIAL_FORM_V6,
      supplierRegistered: 'ไม่เคยลงทะเบียนทำการค้ากับไทวัสดุ',
      company: storeName,
      taxId: testTaxId,
      companyAddr: {
        line1: '88/1 ถนนพระราม 2',
        subdistrict: 'แสมดำ',
        district: 'บางขุนเทียน',
        province: 'กรุงเทพมหานคร',
        zip: '10150',
        phone: '028889999',
        note: '',
      },
      branchType: 'ศูนย์บริการเดียว',
      branches: [
        {
          line1: '88/1 ถนนพระราม 2',
          subdistrict: 'แสมดำ',
          district: 'บางขุนเทียน',
          province: 'กรุงเทพมหานคร',
          zip: '10150',
          phone: '028889999',
          contactName: 'นายทดสอบ ระบบเรต',
          note: '',
        },
      ],
      primaryContact: {
        name: 'นายทดสอบ ระบบเรต',
        pos: 'ผจก.',
        phone: '0891112222',
        email: 'ratetest@example.com',
        line: '',
      },
      bank: {
        accName: storeName,
        accNo: '5556667778',
        bank: 'กรุงเทพ',
        bankBranch: 'พระราม 2',
        vat20: 'มี',
      },
      cinProducts: ['เครื่องใช้ไฟฟ้าขนาดเล็ก', 'เครื่องขัดพื้นอุตสาหกรรม'],
      cinBrands: ['BOSCH'],
      cinReceiveMethod: 'รับสินค้าจาก DC',
      onsProducts: ['เครื่องปรับอากาศ'],
      onsBrands: ['DAIKIN'],
      productGroupRates: [
        {
          groupName: 'เครื่องใช้ไฟฟ้าขนาดเล็ก',
          serviceType: 'CARRY_IN',
          minInspectionFee: 250,
          gpPct: 16.5,
          isCustomGroup: false,
        },
        {
          groupName: 'เครื่องขัดพื้นอุตสาหกรรม',
          serviceType: 'CARRY_IN',
          minInspectionFee: 450,
          gpPct: 22,
          isCustomGroup: true,
        },
        {
          groupName: 'เครื่องปรับอากาศ',
          serviceType: 'ON_SITE',
          minInspectionFee: 600,
          gpPct: 19,
          isCustomGroup: false,
          tasks: { repair: true, replacePart: true, install: true },
        },
      ],
      agreements: {
        sla: true,
        inspect: true,
        reportApp: true,
        training: true,
        pdpa: true,
        truth: true,
      },
      signName: 'นายทดสอบ ระบบเรต',
      signPos: 'กรรมการ',
    })

    const { application: approvedApp } = await approveVendorApplication(app.id, 'admin-rate-tester')
    expect(Boolean(approvedApp.approvedParentId)).toBe(true)

    const parent = await prisma.vendorParent.findUnique({
      where: { id: approvedApp.approvedParentId! },
      include: { productRates: true, centers: true },
    })
    expect(Boolean(parent)).toBe(true)
    expect(parent!.productRates.length).toBe(3)
    expect(parent!.inspectionFeeNotCovered).toBe(250)
    expect(parent!.defaultGpPct).toBe(16.5)

    const customRate = parent!.productRates.find(r => r.groupName === 'เครื่องขัดพื้นอุตสาหกรรม')
    expect(Boolean(customRate)).toBe(true)
    expect(customRate!.isCustomGroup).toBe(true)
    expect(customRate!.minInspectionFee).toBe(450)
    expect(customRate!.gpPct).toBe(22)

    const onsiteRate = parent!.productRates.find(r => r.serviceType === 'ON_SITE' && r.groupName === 'เครื่องปรับอากาศ')
    expect(Boolean(onsiteRate)).toBe(true)
    expect(onsiteRate!.canInstall).toBe(true)

    // Cleanup
    await prisma.user.deleteMany({ where: { vendorCenterId: { in: parent!.centers.map(c => c.id) } } })
    await prisma.branchVendorRoute.deleteMany({ where: { primaryCenterId: { in: parent!.centers.map(c => c.id) } } })
    await prisma.vendorCenter.deleteMany({ where: { vendorParentId: parent!.id } })
    await prisma.vendorParent.delete({ where: { id: parent!.id } })
    await prisma.vendorApplication.delete({ where: { id: app.id } })
  })
})
