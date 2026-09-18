import { PrismaClient, Role, SiteType, Channel, JobStage, JobType, QuoteDecision, QuoteStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ─── System Settings ───────────────────────────────────────────────────────
  await prisma.systemSetting.createMany({
    data: [
      { key: 'VAT_RATE', value: '0.07' },
      { key: 'QUOTE_EXPIRY_DAYS', value: '7' },
      { key: 'TRADEIN_COUPON_VALID_DAYS', value: '30' },
      { key: 'VENDOR_SLA_THRESHOLD', value: '85' },
      { key: 'CHARGE_3PL_RETURN_FEE', value: 'false' },
    ],
    skipDuplicates: true,
  })
  console.log('  ✓ System settings')

  // ─── Sites ─────────────────────────────────────────────────────────────────
  const bn = await prisma.site.upsert({
    where: { code: 'BN' },
    update: {},
    create: { code: 'BN', name: 'สาขาบางนา', nickname: 'BN', type: SiteType.BRANCH, province: 'กรุงเทพมหานคร' },
  })
  const sk = await prisma.site.upsert({
    where: { code: 'SK' },
    update: {},
    create: { code: 'SK', name: 'สาขาสุขาภิบาล 3', nickname: 'SK', type: SiteType.BRANCH, province: 'กรุงเทพมหานคร' },
  })
  const dc1 = await prisma.site.upsert({
    where: { code: 'DC01' },
    update: {},
    create: { code: 'DC01', name: 'คลัง DC กรุงเทพ', nickname: 'DC01', type: SiteType.DC, province: 'กรุงเทพมหานคร' },
  })
  console.log('  ✓ Sites')

  // ─── Brands ────────────────────────────────────────────────────────────────
  const brands = await Promise.all([
    prisma.brand.upsert({ where: { name: 'Hitachi' }, update: {}, create: { name: 'Hitachi' } }),
    prisma.brand.upsert({ where: { name: 'Panasonic' }, update: {}, create: { name: 'Panasonic' } }),
    prisma.brand.upsert({ where: { name: 'Samsung' }, update: {}, create: { name: 'Samsung' } }),
    prisma.brand.upsert({ where: { name: 'LG' }, update: {}, create: { name: 'LG' } }),
    prisma.brand.upsert({ where: { name: 'Mitsubishi' }, update: {}, create: { name: 'Mitsubishi' } }),
  ])
  console.log('  ✓ Brands')

  // ─── Size Categories ───────────────────────────────────────────────────────
  const small = await prisma.sizeCategory.upsert({
    where: { code: 'SMALL' },
    update: {},
    create: { code: 'SMALL', name: 'ขนาดเล็ก', sortOrder: 1 },
  })
  const large = await prisma.sizeCategory.upsert({
    where: { code: 'LARGE' },
    update: {},
    create: { code: 'LARGE', name: 'ขนาดใหญ่', sortOrder: 2 },
  })
  console.log('  ✓ Size categories')

  // ─── Fee Rates ─────────────────────────────────────────────────────────────
  await prisma.feeRate.createMany({
    data: [
      { sizeCategoryId: small.id, operationFee: 150, shippingFee3pl: 80 },
      { sizeCategoryId: large.id, operationFee: 300, shippingFee3pl: 250 },
    ],
    skipDuplicates: true,
  })
  console.log('  ✓ Fee rates')

  // ─── Product Types ─────────────────────────────────────────────────────────
  await prisma.productType.createMany({
    data: [
      { code: 'AC', name: 'เครื่องปรับอากาศ' },
      { code: 'WM', name: 'เครื่องซักผ้า' },
      { code: 'RF', name: 'ตู้เย็น' },
      { code: 'TV', name: 'โทรทัศน์' },
      { code: 'WH', name: 'เครื่องทำน้ำอุ่น' },
      { code: 'OT', name: 'อื่นๆ' },
    ],
    skipDuplicates: true,
  })
  console.log('  ✓ Product types')

  // ─── Commodities (sample SKUs) ─────────────────────────────────────────────
  await prisma.commodity.createMany({
    data: [
      { sku: 'HIT-RAC-18', barcode: '8851234560001', name: 'แอร์ Hitachi 18000 BTU', brand: 'Hitachi', productType: 'AC' },
      { sku: 'PAN-WM-15', barcode: '8851234560002', name: 'เครื่องซักผ้า Panasonic 15 kg', brand: 'Panasonic', productType: 'WM' },
      { sku: 'SAM-RF-4', barcode: '8851234560003', name: 'ตู้เย็น Samsung 4 ประตู', brand: 'Samsung', productType: 'RF' },
      { sku: 'LG-TV-55', barcode: '8851234560004', name: 'ทีวี LG 55 นิ้ว', brand: 'LG', productType: 'TV' },
    ],
    skipDuplicates: true,
  })
  console.log('  ✓ Commodities')

  // ─── Vendor Parent & Centers ───────────────────────────────────────────────
  const vp1 = await prisma.vendorParent.upsert({
    where: { code: 'VD-0088' },
    update: {},
    create: {
      code: 'VD-0088',
      name: 'บ.ช่างเจริญ',
      defaultGpPct: 18.0,
      defaultRepairSlaDays: 7,
      repairWarrantyDays: 30,
      inspectionFeeCovered: 0,
      inspectionFeeNotCovered: 300,
      isBrandAuthorized: true,
    },
  })
  const vc1 = await prisma.vendorCenter.upsert({
    where: { code: 'VD-0088-1' },
    update: {},
    create: {
      code: 'VD-0088-1',
      vendorParentId: vp1.id,
      zoneSiteId: bn.id,
      address: 'กรุงเทพมหานคร',
      phone: '02-000-0001',
      deliveryMethod: 'DC_DSD',
    },
  })
  // Link brands to vendor
  await prisma.vendorBrand.createMany({
    data: [
      { vendorParentId: vp1.id, brandId: brands[0].id }, // Hitachi
      { vendorParentId: vp1.id, brandId: brands[1].id }, // Panasonic
      { vendorParentId: vp1.id, brandId: brands[2].id }, // Samsung
    ],
    skipDuplicates: true,
  })
  console.log('  ✓ Vendors')

  // ─── Branch-Vendor Routes ──────────────────────────────────────────────────
  await prisma.branchVendorRoute.createMany({
    data: [
      { branchId: bn.id, dcSiteId: dc1.id, primaryCenterId: vc1.id, standardChannel: Channel.DC, priority: 1 },
      { branchId: sk.id, dcSiteId: dc1.id, primaryCenterId: vc1.id, standardChannel: Channel.DC, priority: 1 },
    ],
    skipDuplicates: true,
  })
  console.log('  ✓ Branch-Vendor routes')

  // ─── SLA Steps (16 steps from 05_business_rules.md) ───────────────────────
  const slaSteps = [
    { seq: 1,  code: 'CS_HANDOVER',         name: 'CS เปิดใบแจ้งซ่อม → ส่งมอบ GR',   startEvent: 'JOB_OPENED',                            stopEvent: 'GR_RECEIVED',              ownerDept: 'CS',       hours: 24,  appliesTo: 'CUSTOMER,STOCK' },
    { seq: 2,  code: 'GR_PACK',             name: 'GR Pack สินค้าลงกล่อง',              startEvent: 'GR_RECEIVED',                           stopEvent: 'GR_PACKED',                ownerDept: 'GR',       hours: 4,   appliesTo: 'CUSTOMER,STOCK' },
    { seq: 3,  code: 'CARRIER_PICKUP',      name: 'DC/VD/3PL เข้ารับสินค้าที่สาขา',   startEvent: 'GR_PACKED',                             stopEvent: 'OUTBOUND_HANDED_OFF',      ownerDept: 'CARRIER',  hours: 24,  appliesTo: 'CUSTOMER,STOCK' },
    { seq: 4,  code: 'GR_HANDOFF',          name: 'GR ส่งมอบให้ DC/VD/3PL',            startEvent: 'SHIPMENT_DISPATCHED',                   stopEvent: 'OUTBOUND_HANDED_OFF',      ownerDept: 'GR',       hours: 4,   appliesTo: 'CUSTOMER,STOCK' },
    { seq: 5,  code: 'DC_RECEIVE_LOCATION', name: 'DC รับเข้า Location',                startEvent: 'OUTBOUND_HANDED_OFF',                   stopEvent: 'DC_RECEIVED_OUTBOUND',     ownerDept: 'DC',       hours: 4,   condition: 'channel=DC', appliesTo: 'CUSTOMER,STOCK' },
    { seq: 6,  code: 'VD_PICKUP_AT_DC',    name: 'VD เข้ารับสินค้าที่ DC',             startEvent: 'DC_RECEIVED_OUTBOUND',                  stopEvent: 'DC_HANDED_OFF_VD',         ownerDept: 'VD',       hours: 24,  condition: 'channel=DC', appliesTo: 'CUSTOMER,STOCK' },
    { seq: 7,  code: 'VD_RECEIVE',          name: 'สินค้าถึงศูนย์ VD',                 startEvent: 'OUTBOUND_HANDED_OFF,DC_HANDED_OFF_VD',  stopEvent: 'VD_RECEIVED',              ownerDept: 'CARRIER',  hours: 24,  appliesTo: 'CUSTOMER,STOCK' },
    { seq: 8,  code: 'VD_QUOTE',            name: 'VD ประเมิน/เสนอราคา',                startEvent: 'VD_RECEIVED',                           stopEvent: 'QUOTE_SENT,REPAIR_STARTED',ownerDept: 'VD',       hours: 48,  appliesTo: 'CUSTOMER' },
    { seq: 9,  code: 'CUSTOMER_APPROVAL',   name: 'รอลูกค้าอนุมัติ',                   startEvent: 'QUOTE_SENT,QUOTE_REVISED',              stopEvent: 'CUSTOMER_APPROVED,CUSTOMER_REJECTED', ownerDept: 'CUSTOMER', hours: 48, appliesTo: 'CUSTOMER' },
    { seq: 10, code: 'VD_REPAIR',           name: 'VD ระยะเวลาซ่อม',                   startEvent: 'CUSTOMER_APPROVED,REPAIR_STARTED',      stopEvent: 'REPAIR_FINISHED',          ownerDept: 'VD',       hours: 168, pausable: true, appliesTo: 'CUSTOMER,STOCK' },
    { seq: 11, code: 'VD_RETURN_PACK',      name: 'VD Pack ส่งคืน',                     startEvent: 'REPAIR_FINISHED,CUSTOMER_REJECTED',     stopEvent: 'RETURN_PACKED',            ownerDept: 'VD',       hours: 24,  appliesTo: 'CUSTOMER,STOCK' },
    { seq: 12, code: 'DC_RETURN_RECEIVE',   name: 'DC รับคืนจาก VD',                   startEvent: 'RETURN_PACKED',                         stopEvent: 'DC_RECEIVED_INBOUND',      ownerDept: 'DC',       hours: 24,  condition: 'channel=DC', appliesTo: 'CUSTOMER,STOCK' },
    { seq: 13, code: 'DC_DISPATCH_BRANCH',  name: 'DC ส่งคืนกลับสาขา',                 startEvent: 'DC_RECEIVED_INBOUND',                   stopEvent: 'DC_DISPATCHED_TO_BRANCH',  ownerDept: 'DC',       hours: 24,  condition: 'channel=DC', appliesTo: 'CUSTOMER,STOCK' },
    { seq: 14, code: 'GR_RETURN_RECEIVE',   name: 'สินค้าคืนถึงสาขา (GR รับคืน)',    startEvent: 'RETURN_PACKED,DC_DISPATCHED_TO_BRANCH', stopEvent: 'GR_RETURN_RECEIVED',       ownerDept: 'CARRIER',  hours: 24,  appliesTo: 'CUSTOMER,STOCK' },
    { seq: 15, code: 'GR_DELIVER_CS',       name: 'GR ส่งมอบ CS',                       startEvent: 'GR_RETURN_RECEIVED',                    stopEvent: 'DELIVERED_TO_CS',          ownerDept: 'GR',       hours: 4,   appliesTo: 'CUSTOMER,STOCK' },
    { seq: 16, code: 'CUSTOMER_PICKUP',     name: 'ลูกค้าเข้ารับสินค้า / ปิดงาน',    startEvent: 'DELIVERED_TO_CS',                       stopEvent: 'JOB_CLOSED',               ownerDept: 'CS',       hours: 168, appliesTo: 'CUSTOMER' },
  ]
  for (const step of slaSteps) {
    await prisma.slaStep.upsert({
      where: { seq: step.seq },
      update: { hours: step.hours, name: step.name },
      create: step,
    })
  }
  console.log('  ✓ SLA Steps (16)')

  // ─── Role Menu Permissions ─────────────────────────────────────────────────
  // From 08_rbac.md
  const menuMatrix: Array<{ menuKey: string; role: Role; canAccess: boolean; canWrite: boolean }> = [
    // exec
    { menuKey: 'exec', role: Role.ADMIN, canAccess: true, canWrite: true },
    { menuKey: 'exec', role: Role.EXECUTIVE, canAccess: true, canWrite: false },
    // analytics
    { menuKey: 'analytics', role: Role.ADMIN, canAccess: true, canWrite: true },
    { menuKey: 'analytics', role: Role.EXECUTIVE, canAccess: true, canWrite: false },
    // jobs
    { menuKey: 'jobs', role: Role.ADMIN, canAccess: true, canWrite: true },
    { menuKey: 'jobs', role: Role.EXECUTIVE, canAccess: true, canWrite: false },
    { menuKey: 'jobs', role: Role.CS, canAccess: true, canWrite: true },
    { menuKey: 'jobs', role: Role.GR, canAccess: true, canWrite: true },
    { menuKey: 'jobs', role: Role.DC, canAccess: true, canWrite: true },
    { menuKey: 'jobs', role: Role.VD, canAccess: true, canWrite: true },
    { menuKey: 'jobs', role: Role.S2, canAccess: true, canWrite: true },
    // cs
    { menuKey: 'cs', role: Role.ADMIN, canAccess: true, canWrite: false },
    { menuKey: 'cs', role: Role.CS, canAccess: true, canWrite: true },
    // gr
    { menuKey: 'gr', role: Role.ADMIN, canAccess: true, canWrite: false },
    { menuKey: 'gr', role: Role.GR, canAccess: true, canWrite: true },
    // dc
    { menuKey: 'dc', role: Role.ADMIN, canAccess: true, canWrite: false },
    { menuKey: 'dc', role: Role.DC, canAccess: true, canWrite: true },
    // vd
    { menuKey: 'vd', role: Role.ADMIN, canAccess: true, canWrite: false },
    { menuKey: 'vd', role: Role.VD, canAccess: true, canWrite: true },
    // tradein
    { menuKey: 'tradein', role: Role.ADMIN, canAccess: true, canWrite: false },
    { menuKey: 'tradein', role: Role.CS, canAccess: true, canWrite: true },
    // s2
    { menuKey: 's2', role: Role.ADMIN, canAccess: true, canWrite: false },
    { menuKey: 's2', role: Role.S2, canAccess: true, canWrite: true },
    // vd_payment
    { menuKey: 'vd_payment', role: Role.ADMIN, canAccess: true, canWrite: true },
    { menuKey: 'vd_payment', role: Role.EXECUTIVE, canAccess: true, canWrite: false },
    // admin
    { menuKey: 'admin', role: Role.ADMIN, canAccess: true, canWrite: true },
  ]
  for (const perm of menuMatrix) {
    await prisma.roleMenuPermission.upsert({
      where: { menuKey_role: { menuKey: perm.menuKey, role: perm.role } },
      update: { canAccess: perm.canAccess, canWrite: perm.canWrite },
      create: perm,
    })
  }
  console.log('  ✓ Role menu permissions')

  // ─── Payout Cycle Config ───────────────────────────────────────────────────
  await prisma.payoutCycleConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { cycleType: 'BIMONTHLY', dayOfMonth1: 5, dayOfMonth2: 20 },
  })
  console.log('  ✓ Payout cycle config')

  // ─── Promotion Configs ─────────────────────────────────────────────────────
  const startDate = new Date('2026-01-01')
  const endDate = new Date('2026-12-31')
  await prisma.promotionConfig.createMany({
    data: [
      { name: 'โปรทั่วไป', tradeInType: 'TYPE1', sizeCategoryId: small.id, discountPct: 10, startDate, endDate },
      { name: 'โปรทั่วไปใหญ่', tradeInType: 'TYPE1', sizeCategoryId: large.id, discountPct: 8, startDate, endDate },
      { name: 'โปรลูกค้าเก่า', tradeInType: 'TYPE2', sizeCategoryId: large.id, discountPct: 15, startDate, endDate },
      { name: 'โปรปีใหม่', tradeInType: 'TYPE2', sizeCategoryId: large.id, discountPct: 15, startDate: new Date('2026-01-01'), endDate: new Date('2026-01-31') },
    ],
    skipDuplicates: true,
  })
  console.log('  ✓ Promotion configs')

  // ─── Users ─────────────────────────────────────────────────────────────────
  const hash = await bcrypt.hash('password123', 12)
  const users = [
    { username: 'test_cs',   fullName: 'สมชาย CS',      role: Role.CS,        siteId: bn.id },
    { username: 'test_gr',   fullName: 'สมหญิง GR',     role: Role.GR,        siteId: bn.id },
    { username: 'test_dc',   fullName: 'สมศักดิ์ DC',   role: Role.DC,        siteId: dc1.id },
    { username: 'test_vd',   fullName: 'ช่างมานะ VD',   role: Role.VD,        siteId: null, vendorCenterId: vc1.id },
    { username: 'test_s2',   fullName: 'สายสวรรค์ S2',  role: Role.S2,        siteId: bn.id },
    { username: 'test_exec', fullName: 'ผู้บริหาร',      role: Role.EXECUTIVE, siteId: null },
    { username: 'test_am',   fullName: 'ผู้ดูแลระบบ',    role: Role.ADMIN,     siteId: null },
  ]
  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { username: u.username, password: hash, fullName: u.fullName, role: u.role, siteId: u.siteId, vendorCenterId: u.vendorCenterId ?? null },
    })
  }
  console.log('  ✓ Users (7)')

  // ─── Sample Job ────────────────────────────────────────────────────────────
  const sampleJob = await prisma.job.upsert({
    where: { jobNo: 'JB-2609-00001' },
    update: {},
    create: {
      jobNo: 'JB-2609-00001',
      type: JobType.CUSTOMER,
      stage: JobStage.CS_OPENED,
      channel: Channel.DC,
      branchId: bn.id,
      vendorCenterId: vc1.id,
      customerName: 'นายทดสอบ ระบบ',
      customerPhone: '0812345678',
      customerAddress: '123 ถนนสุขุมวิท กรุงเทพ',
      customerZip: '10110',
      sku: 'HIT-RAC-18',
      productName: 'แอร์ Hitachi 18000 BTU',
      brandName: 'Hitachi',
      brandId: brands[0].id,
      sizeCategoryId: large.id,
      symptom: 'ไม่เย็น คอมเพรสเซอร์ไม่ทำงาน',
      hasWarranty: false,
      shippingMethod: 'STANDARD',
      decision: QuoteDecision.PENDING,
      createdBy: 'test_cs',
    },
  })
  await prisma.jobCharge.createMany({
    data: [
      { jobId: sampleJob.id, type: 'OPERATION_FEE', amount: 300, description: 'ค่าดำเนินการ' },
    ],
    skipDuplicates: true,
  })
  const existingEvent = await prisma.jobEvent.findFirst({
    where: { jobId: sampleJob.id, type: 'JOB_OPENED' }
  })
  if (!existingEvent) {
    await prisma.jobEvent.create({
      data: {
        jobId: sampleJob.id,
        type: 'JOB_OPENED',
        fromStage: null,
        toStage: JobStage.CS_OPENED,
        actorUserId: 'test_cs',
        actorRole: 'CS',
        payload: { note: 'sample job' },
      }
    })
  }
  console.log('  ✓ Sample job (JB-2609-00001)')

  console.log('\n✅ Seed completed successfully!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
