import {
  PrismaClient,
  Role,
  SiteType,
  VendorCenterMethod,
  Channel,
  OwnerDept,
  JobType,
  ChargeType,
  PayoutCycleType,
  TradeInType,
  PromotionStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Master Data...');

  // 1. District Managers
  const dmBangkokEast = await prisma.districtManager.upsert({
    where: { id: 'dm_bkk_east' },
    update: { name: 'คุณวิชัย', areaLabel: 'กทม.ตะวันออก' },
    create: { id: 'dm_bkk_east', name: 'คุณวิชัย', areaLabel: 'กทม.ตะวันออก' },
  });

  const dmPathum = await prisma.districtManager.upsert({
    where: { id: 'dm_pathum' },
    update: { name: 'คุณสมหญิง', areaLabel: 'ปทุมธานี' },
    create: { id: 'dm_pathum', name: 'คุณสมหญิง', areaLabel: 'ปทุมธานี' },
  });

  const dmBangkokWest = await prisma.districtManager.upsert({
    where: { id: 'dm_bkk_west' },
    update: { name: 'คุณอนุชา', areaLabel: 'กทม.ตะวันตก' },
    create: { id: 'dm_bkk_west', name: 'คุณอนุชา', areaLabel: 'กทม.ตะวันตก' },
  });

  const dmNorth = await prisma.districtManager.upsert({
    where: { id: 'dm_north' },
    update: { name: 'คุณปิยะ', areaLabel: 'ภาคเหนือ' },
    create: { id: 'dm_north', name: 'คุณปิยะ', areaLabel: 'ภาคเหนือ' },
  });

  console.log('✓ District Managers seeded');

  // 2. Sites (Branches & DCs)
  const siteBangna = await prisma.site.upsert({
    where: { code: '00001' },
    update: { name: 'สาขาบางนา', type: SiteType.BRANCH, address: 'บางนา-ตราด กม.10', districtManagerId: dmBangkokEast.id },
    create: { code: '00001', name: 'สาขาบางนา', type: SiteType.BRANCH, address: 'บางนา-ตราด กม.10', districtManagerId: dmBangkokEast.id },
  });

  const siteRangsit = await prisma.site.upsert({
    where: { code: '00002' },
    update: { name: 'สาขารังสิต', type: SiteType.BRANCH, address: 'พหลโยธิน คลองหลวง', districtManagerId: dmPathum.id },
    create: { code: '00002', name: 'สาขารังสิต', type: SiteType.BRANCH, address: 'พหลโยธิน คลองหลวง', districtManagerId: dmPathum.id },
  });

  const siteChaeng = await prisma.site.upsert({
    where: { code: '00003' },
    update: { name: 'สาขาแจ้งวัฒนะ', type: SiteType.BRANCH, address: 'แจ้งวัฒนะ ปากเกร็ด', districtManagerId: dmBangkokEast.id },
    create: { code: '00003', name: 'สาขาแจ้งวัฒนะ', type: SiteType.BRANCH, address: 'แจ้งวัฒนะ ปากเกร็ด', districtManagerId: dmBangkokEast.id },
  });

  const siteRama2 = await prisma.site.upsert({
    where: { code: '00004' },
    update: { name: 'สาขาพระราม 2', type: SiteType.BRANCH, address: 'พระราม 2 บางขุนเทียน', districtManagerId: dmBangkokWest.id },
    create: { code: '00004', name: 'สาขาพระราม 2', type: SiteType.BRANCH, address: 'พระราม 2 บางขุนเทียน', districtManagerId: dmBangkokWest.id },
  });

  const siteChiangmai = await prisma.site.upsert({
    where: { code: '00005' },
    update: { name: 'สาขาเชียงใหม่', type: SiteType.BRANCH, address: 'ซุปเปอร์ไฮเวย์ เมืองเชียงใหม่', districtManagerId: dmNorth.id },
    create: { code: '00005', name: 'สาขาเชียงใหม่', type: SiteType.BRANCH, address: 'ซุปเปอร์ไฮเวย์ เมืองเชียงใหม่', districtManagerId: dmNorth.id },
  });

  const siteDcBkk = await prisma.site.upsert({
    where: { code: 'DC-01' },
    update: { name: 'คลัง DC กรุงเทพ', type: SiteType.DC, address: 'วังน้อย พระนครศรีอยุธยา', districtManagerId: null },
    create: { code: 'DC-01', name: 'คลัง DC กรุงเทพ', type: SiteType.DC, address: 'วังน้อย พระนครศรีอยุธยา', districtManagerId: null },
  });

  const siteDcChon = await prisma.site.upsert({
    where: { code: 'DC-02' },
    update: { name: 'คลัง DC ชลบุรี', type: SiteType.DC, address: 'แหลมฉบัง ชลบุรี', districtManagerId: null },
    create: { code: 'DC-02', name: 'คลัง DC ชลบุรี', type: SiteType.DC, address: 'แหลมฉบัง ชลบุรี', districtManagerId: null },
  });

  console.log('✓ Sites (7 sites) seeded');

  // 3. Brands
  const brandNames = ['Bosch', 'Makita', 'Xiaomi', 'Philips', 'Panasonic'];
  const brands: Record<string, any> = {};
  for (const name of brandNames) {
    brands[name] = await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✓ Brands (5 brands) seeded');

  // 4. Size Categories & Fee Rates
  const sizeSmall = await prisma.sizeCategory.upsert({
    where: { code: 'SMALL' },
    update: { name: 'สินค้าขนาดเล็ก' },
    create: { code: 'SMALL', name: 'สินค้าขนาดเล็ก' },
  });

  const sizeLarge = await prisma.sizeCategory.upsert({
    where: { code: 'LARGE' },
    update: { name: 'สินค้าขนาดใหญ่' },
    create: { code: 'LARGE', name: 'สินค้าขนาดใหญ่' },
  });

  await prisma.feeRate.deleteMany({
    where: { sizeCategoryId: { in: [sizeSmall.id, sizeLarge.id] } },
  });

  await prisma.feeRate.create({
    data: {
      sizeCategoryId: sizeSmall.id,
      operationFeeSatang: 15000,
      shippingFee3plSatang: 8000,
      effectiveFrom: new Date('2026-01-01'),
    },
  });

  await prisma.feeRate.create({
    data: {
      sizeCategoryId: sizeLarge.id,
      operationFeeSatang: 30000,
      shippingFee3plSatang: 25000,
      effectiveFrom: new Date('2026-01-01'),
    },
  });
  console.log('✓ Size Categories & Fee Rates seeded');

  // 5. Vendors & Vendor Centers
  // VD-0088 บ.ช่างเจริญ
  const vd0088 = await prisma.vendor.upsert({
    where: { code: 'VD-0088' },
    update: {
      name: 'บ.ช่างเจริญ',
      defaultGpPct: 18.0,
      defaultRepairSlaDays: 7,
      inspectionFeeCoveredSatang: 0,
      inspectionFeeNotCoveredSatang: 30000,
      repairWarrantyDays: 30,
      isBrandAuthorized: true,
      brands: { set: [{ id: brands['Bosch'].id }, { id: brands['Makita'].id }] },
      sizes: { set: [{ id: sizeLarge.id }] },
    },
    create: {
      code: 'VD-0088',
      name: 'บ.ช่างเจริญ',
      defaultGpPct: 18.0,
      defaultRepairSlaDays: 7,
      inspectionFeeCoveredSatang: 0,
      inspectionFeeNotCoveredSatang: 30000,
      repairWarrantyDays: 30,
      isBrandAuthorized: true,
      brands: { connect: [{ id: brands['Bosch'].id }, { id: brands['Makita'].id }] },
      sizes: { connect: [{ id: sizeLarge.id }] },
    },
  });

  const vd0088Center1 = await prisma.vendorCenter.upsert({
    where: { code: 'VD-0088-1' },
    update: {
      vendorId: vd0088.id,
      zoneSiteId: siteBangna.id,
      address: 'บางนา กทม.',
      phone: '02-111-8888',
      method: VendorCenterMethod.DC_DSD,
    },
    create: {
      code: 'VD-0088-1',
      vendorId: vd0088.id,
      zoneSiteId: siteBangna.id,
      address: 'บางนา กทม.',
      phone: '02-111-8888',
      method: VendorCenterMethod.DC_DSD,
    },
  });

  // VD-0091 ศูนย์ซ่อมไฟฟ้ารุ่งเรือง
  const vd0091 = await prisma.vendor.upsert({
    where: { code: 'VD-0091' },
    update: {
      name: 'ศูนย์ซ่อมไฟฟ้ารุ่งเรือง',
      defaultGpPct: 15.0,
      defaultRepairSlaDays: 5,
      inspectionFeeCoveredSatang: 0,
      inspectionFeeNotCoveredSatang: 15000,
      repairWarrantyDays: 30,
      isBrandAuthorized: true,
      brands: { set: [{ id: brands['Xiaomi'].id }, { id: brands['Philips'].id }] },
      sizes: { set: [{ id: sizeSmall.id }] },
    },
    create: {
      code: 'VD-0091',
      name: 'ศูนย์ซ่อมไฟฟ้ารุ่งเรือง',
      defaultGpPct: 15.0,
      defaultRepairSlaDays: 5,
      inspectionFeeCoveredSatang: 0,
      inspectionFeeNotCoveredSatang: 15000,
      repairWarrantyDays: 30,
      isBrandAuthorized: true,
      brands: { connect: [{ id: brands['Xiaomi'].id }, { id: brands['Philips'].id }] },
      sizes: { connect: [{ id: sizeSmall.id }] },
    },
  });

  const vd0091Center1 = await prisma.vendorCenter.upsert({
    where: { code: 'VD-0091-1' },
    update: {
      vendorId: vd0091.id,
      zoneSiteId: siteRangsit.id,
      address: 'รังสิต ปทุมธานี',
      phone: '02-222-9191',
      method: VendorCenterMethod.DSD,
    },
    create: {
      code: 'VD-0091-1',
      vendorId: vd0091.id,
      zoneSiteId: siteRangsit.id,
      address: 'รังสิต ปทุมธานี',
      phone: '02-222-9191',
      method: VendorCenterMethod.DSD,
    },
  });

  // VD-0102 ช่างเทค เซอร์วิส
  const vd0102 = await prisma.vendor.upsert({
    where: { code: 'VD-0102' },
    update: {
      name: 'ช่างเทค เซอร์วิส',
      defaultGpPct: 20.0,
      defaultRepairSlaDays: 7,
      inspectionFeeCoveredSatang: 0,
      inspectionFeeNotCoveredSatang: 20000,
      repairWarrantyDays: 30,
      isBrandAuthorized: true,
      brands: { set: [{ id: brands['Panasonic'].id }] },
      sizes: { set: [{ id: sizeSmall.id }, { id: sizeLarge.id }] },
    },
    create: {
      code: 'VD-0102',
      name: 'ช่างเทค เซอร์วิส',
      defaultGpPct: 20.0,
      defaultRepairSlaDays: 7,
      inspectionFeeCoveredSatang: 0,
      inspectionFeeNotCoveredSatang: 20000,
      repairWarrantyDays: 30,
      isBrandAuthorized: true,
      brands: { connect: [{ id: brands['Panasonic'].id }] },
      sizes: { connect: [{ id: sizeSmall.id }, { id: sizeLarge.id }] },
    },
  });

  const vd0102Center1 = await prisma.vendorCenter.upsert({
    where: { code: 'VD-0102-1' },
    update: {
      vendorId: vd0102.id,
      zoneSiteId: siteChaeng.id,
      address: 'แจ้งวัฒนะ นนทบุรี',
      phone: '02-333-1020',
      method: VendorCenterMethod.DC,
    },
    create: {
      code: 'VD-0102-1',
      vendorId: vd0102.id,
      zoneSiteId: siteChaeng.id,
      address: 'แจ้งวัฒนะ นนทบุรี',
      phone: '02-333-1020',
      method: VendorCenterMethod.DC,
    },
  });

  // VD-0075 บ.อีเลคโทรฟิกซ์
  const vd0075 = await prisma.vendor.upsert({
    where: { code: 'VD-0075' },
    update: {
      name: 'บ.อีเลคโทรฟิกซ์',
      defaultGpPct: 16.0,
      defaultRepairSlaDays: 7,
      inspectionFeeCoveredSatang: 0,
      inspectionFeeNotCoveredSatang: 25000,
      repairWarrantyDays: 30,
      isBrandAuthorized: true,
      brands: { set: [{ id: brands['Bosch'].id }, { id: brands['Philips'].id }] },
      sizes: { set: [{ id: sizeSmall.id }, { id: sizeLarge.id }] },
    },
    create: {
      code: 'VD-0075',
      name: 'บ.อีเลคโทรฟิกซ์',
      defaultGpPct: 16.0,
      defaultRepairSlaDays: 7,
      inspectionFeeCoveredSatang: 0,
      inspectionFeeNotCoveredSatang: 25000,
      repairWarrantyDays: 30,
      isBrandAuthorized: true,
      brands: { connect: [{ id: brands['Bosch'].id }, { id: brands['Philips'].id }] },
      sizes: { connect: [{ id: sizeSmall.id }, { id: sizeLarge.id }] },
    },
  });

  const vd0075Center1 = await prisma.vendorCenter.upsert({
    where: { code: 'VD-0075-1' },
    update: {
      vendorId: vd0075.id,
      zoneSiteId: siteRama2.id,
      address: 'พระราม 2 กทม.',
      phone: '02-444-7575',
      method: VendorCenterMethod.DC_DSD,
    },
    create: {
      code: 'VD-0075-1',
      vendorId: vd0075.id,
      zoneSiteId: siteRama2.id,
      address: 'พระราม 2 กทม.',
      phone: '02-444-7575',
      method: VendorCenterMethod.DC_DSD,
    },
  });

  console.log('✓ Vendors & VendorCenters (4 vendors, 4 centers) seeded');

  // 6. BranchVendorRoute
  const routesData = [
    { branchId: siteBangna.id, primaryCenterId: vd0088Center1.id, backupCenterId: vd0091Center1.id, standardChannel: Channel.DC },
    { branchId: siteRangsit.id, primaryCenterId: vd0091Center1.id, backupCenterId: vd0088Center1.id, standardChannel: Channel.DSD },
    { branchId: siteChaeng.id, primaryCenterId: vd0102Center1.id, backupCenterId: vd0088Center1.id, standardChannel: Channel.DC },
    { branchId: siteRama2.id, primaryCenterId: vd0075Center1.id, backupCenterId: vd0088Center1.id, standardChannel: Channel.DC },
    { branchId: siteChiangmai.id, primaryCenterId: vd0088Center1.id, backupCenterId: null, standardChannel: Channel.DC },
  ];

  for (const r of routesData) {
    await prisma.branchVendorRoute.upsert({
      where: {
        branchId_primaryCenterId: {
          branchId: r.branchId,
          primaryCenterId: r.primaryCenterId,
        },
      },
      update: { backupCenterId: r.backupCenterId, standardChannel: r.standardChannel },
      create: r,
    });
  }
  console.log('✓ BranchVendorRoute (5 routes) seeded');

  // 7. SlaSteps (16 steps)
  const slaSteps = [
    { seq: 1, code: 'CS_HANDOVER', name: 'CS เปิดใบแจ้งซ่อม → ส่งมอบ GR', startEvent: 'JOB_OPENED', stopEvent: 'GR_RECEIVED', condition: null, hours: 24, ownerDept: OwnerDept.CS, pausable: false },
    { seq: 2, code: 'GR_PACK', name: 'GR Pack สินค้าลงกล่อง', startEvent: 'GR_RECEIVED', stopEvent: 'GR_PACKED', condition: null, hours: 4, ownerDept: OwnerDept.GR, pausable: false },
    { seq: 3, code: 'CARRIER_PICKUP_BRANCH', name: 'DC/VD/3PL เข้ารับสินค้าที่สาขา', startEvent: 'GR_PACKED', stopEvent: 'OUTBOUND_HANDED_OFF', condition: null, hours: 24, ownerDept: OwnerDept.CARRIER, pausable: false },
    { seq: 4, code: 'GR_HANDOFF', name: 'GR ส่งมอบให้ DC/VD/3PL', startEvent: 'SHIPMENT_DISPATCHED', stopEvent: 'OUTBOUND_HANDED_OFF', condition: null, hours: 4, ownerDept: OwnerDept.GR, pausable: false },
    { seq: 5, code: 'DC_RECEIVE_LOCATION', name: 'DC รับเข้า Location', startEvent: 'OUTBOUND_HANDED_OFF', stopEvent: 'DC_RECEIVED_OUTBOUND', condition: 'channel=DC', hours: 4, ownerDept: OwnerDept.DC, pausable: false },
    { seq: 6, code: 'VD_PICKUP_AT_DC', name: 'VD เข้ารับสินค้าที่ DC', startEvent: 'DC_RECEIVED_OUTBOUND', stopEvent: 'DC_HANDED_OFF_VD', condition: 'channel=DC', hours: 24, ownerDept: OwnerDept.VD, pausable: false },
    { seq: 7, code: 'VD_RECEIVE', name: 'สินค้าถึงศูนย์ VD', startEvent: 'OUTBOUND_HANDED_OFF|DC_HANDED_OFF_VD', stopEvent: 'VD_RECEIVED', condition: null, hours: 24, ownerDept: OwnerDept.CARRIER, pausable: false },
    { seq: 8, code: 'VD_QUOTE', name: 'VD ประเมิน/เสนอราคา', startEvent: 'VD_RECEIVED', stopEvent: 'QUOTE_SENT|REPAIR_STARTED', condition: null, hours: 48, ownerDept: OwnerDept.VD, pausable: false },
    { seq: 9, code: 'CUSTOMER_APPROVAL', name: 'รอลูกค้าอนุมัติ', startEvent: 'QUOTE_SENT|QUOTE_REVISED', stopEvent: 'CUSTOMER_APPROVED|CUSTOMER_REJECTED', condition: 'type=CUSTOMER', hours: 48, ownerDept: OwnerDept.CUSTOMER, pausable: false },
    { seq: 10, code: 'VD_REPAIR', name: 'VD ระยะเวลาซ่อม (ไม่รวมรออะไหล่)', startEvent: 'CUSTOMER_APPROVED|REPAIR_STARTED', stopEvent: 'REPAIR_FINISHED', condition: null, hours: 168, ownerDept: OwnerDept.VD, pausable: true },
    { seq: 11, code: 'VD_RETURN_PACK', name: 'VD Pack ส่งคืน 3PL/DC/สาขา', startEvent: 'REPAIR_FINISHED|CUSTOMER_REJECTED', stopEvent: 'RETURN_PACKED', condition: null, hours: 24, ownerDept: OwnerDept.VD, pausable: false },
    { seq: 12, code: 'DC_RETURN_RECEIVE', name: 'DC รับคืนจาก VD', startEvent: 'RETURN_PACKED', stopEvent: 'DC_RECEIVED_INBOUND', condition: 'channel=DC', hours: 24, ownerDept: OwnerDept.DC, pausable: false },
    { seq: 13, code: 'DC_DISPATCH_BRANCH', name: 'DC ส่งคืนกลับสาขา', startEvent: 'DC_RECEIVED_INBOUND', stopEvent: 'DC_DISPATCHED_TO_BRANCH', condition: 'channel=DC', hours: 24, ownerDept: OwnerDept.DC, pausable: false },
    { seq: 14, code: 'GR_RETURN_RECEIVE', name: 'สินค้าคืนถึงสาขา (GR รับคืน)', startEvent: 'RETURN_PACKED|DC_DISPATCHED_TO_BRANCH', stopEvent: 'GR_RETURN_RECEIVED', condition: null, hours: 24, ownerDept: OwnerDept.CARRIER, pausable: false },
    { seq: 15, code: 'GR_DELIVER_CS', name: 'GR ส่งมอบ CS', startEvent: 'GR_RETURN_RECEIVED', stopEvent: 'DELIVERED_TO_CS', condition: null, hours: 4, ownerDept: OwnerDept.GR, pausable: false },
    { seq: 16, code: 'CUSTOMER_PICKUP', name: 'ลูกค้าเข้ารับสินค้า / ปิดงาน', startEvent: 'DELIVERED_TO_CS', stopEvent: 'JOB_CLOSED', condition: null, hours: 168, ownerDept: OwnerDept.CS, pausable: false },
  ];

  for (const step of slaSteps) {
    await prisma.slaStep.upsert({
      where: { code: step.code },
      update: step,
      create: step,
    });
  }
  console.log('✓ SlaSteps (16 steps) seeded');

  // 8. RepairSku
  const repairSkus = [
    { code: 'SVC-REPAIR-001', description: 'ค่าซ่อมสินค้า', chargeType: ChargeType.REPAIR },
    { code: 'SVC-OPENFEE-001', description: 'ค่าเปิดเครื่องตรวจเช็ค', chargeType: ChargeType.REPAIR },
    { code: 'SVC-OPFEE-001', description: 'ค่าดำเนินการ', chargeType: ChargeType.OPERATION_FEE },
    { code: 'SVC-SHIP-001', description: 'ค่าขนส่ง 3PL', chargeType: ChargeType.SHIPPING_FEE },
  ];

  for (const sku of repairSkus) {
    await prisma.repairSku.upsert({
      where: { code: sku.code },
      update: sku,
      create: sku,
    });
  }
  console.log('✓ RepairSku (4 SKUs) seeded');

  // 9. PayoutCycleConfig
  await prisma.payoutCycleConfig.deleteMany();
  await prisma.payoutCycleConfig.create({
    data: {
      cycleType: PayoutCycleType.DAYS_OF_MONTH,
      daysOfMonth: [5, 20],
      nextCycleDate: new Date('2026-10-05T00:00:00.000Z'),
    },
  });
  console.log('✓ PayoutCycleConfig (days 5, 20) seeded');

  // 10. Promotions (4 items)
  const promoData = [
    {
      id: 'promo-01',
      name: 'โปรทั่วไป',
      tradeInType: TradeInType.TYPE1_WALK_IN,
      sizeCategoryId: sizeSmall.id,
      percent: 10.0,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-31'),
      status: PromotionStatus.ACTIVE,
      createdAt: new Date('2026-09-01T08:00:00.000Z'),
    },
    {
      id: 'promo-02',
      name: 'โปรทั่วไปใหญ่',
      tradeInType: TradeInType.TYPE1_WALK_IN,
      sizeCategoryId: sizeLarge.id,
      percent: 8.0,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-31'),
      status: PromotionStatus.ACTIVE,
      createdAt: new Date('2026-09-01T08:00:00.000Z'),
    },
    {
      id: 'promo-03',
      name: 'โปรปีใหม่',
      tradeInType: TradeInType.TYPE2_BACKOFFICE,
      sizeCategoryId: sizeLarge.id,
      percent: 15.0,
      startDate: new Date('2026-08-15'),
      endDate: new Date('2027-01-15'),
      status: PromotionStatus.ACTIVE,
      createdAt: new Date('2026-08-20T10:00:00.000Z'),
    },
    {
      id: 'promo-04',
      name: 'โปรลูกค้าเก่า',
      tradeInType: TradeInType.TYPE2_BACKOFFICE,
      sizeCategoryId: sizeLarge.id,
      percent: 15.0,
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-10-31'),
      status: PromotionStatus.ACTIVE,
      createdAt: new Date('2026-09-05T14:30:00.000Z'),
    },
  ];

  for (const promo of promoData) {
    await prisma.promotion.upsert({
      where: { id: promo.id },
      update: promo,
      create: promo,
    });
  }
  console.log('✓ Promotions (4 promotions) seeded');

  // 11. RoleMenuPermission
  const menuKeys = [
    'exec',
    'analytics',
    'jobs',
    'cs',
    'gr',
    'dc',
    'vd',
    'tradein',
    's2',
    'vd_payment',
    'admin',
  ];

  const permissionsMatrix: Record<Role, string[]> = {
    ADMIN: ['exec', 'analytics', 'jobs', 'cs', 'gr', 'dc', 'vd', 'tradein', 's2', 'vd_payment', 'admin'],
    EXECUTIVE: ['exec', 'analytics', 'jobs', 'vd_payment'],
    CS: ['jobs', 'cs', 'tradein'],
    GR: ['jobs', 'gr'],
    DC: ['jobs', 'dc'],
    VD: ['jobs', 'vd'],
    S2: ['jobs', 's2'],
  };

  for (const role of Object.values(Role)) {
    const allowedMenus = permissionsMatrix[role] || [];
    for (const menuKey of menuKeys) {
      const allowed = allowedMenus.includes(menuKey);
      await prisma.roleMenuPermission.upsert({
        where: { role_menuKey: { role, menuKey } },
        update: { allowed },
        create: { role, menuKey, allowed },
      });
    }
  }
  console.log('✓ RoleMenuPermissions matrix seeded');

  // 12. RoleDataPermission
  for (const role of Object.values(Role)) {
    const canViewCost = role === Role.ADMIN || role === Role.EXECUTIVE;
    await prisma.roleDataPermission.upsert({
      where: { role },
      update: { canViewCost },
      create: { role, canViewCost },
    });
  }
  console.log('✓ RoleDataPermissions seeded');

  // 13. SystemSettings
  const systemSettings = [
    { key: 'vatRate', value: 0.07 },
    { key: 'quoteExpiryDays', value: 7 },
    { key: 'charge3plReturnFee', value: false },
    { key: 'tradeInCouponValidDays', value: 30 },
    { key: 'vendorSlaThreshold', value: 85 },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: { key: setting.key, value: setting.value },
    });
  }
  console.log('✓ SystemSettings seeded');

  // 14. Users (7 test users)
  const passwordHash = await bcrypt.hash('Passw0rd!', 10);

  const usersData = [
    { username: 'admin', displayName: 'ผู้ดูแลระบบสูงสุด', role: Role.ADMIN, siteId: null, vendorCenterId: null },
    { username: 'exec', displayName: 'ผู้บริหารระดับสูง', role: Role.EXECUTIVE, siteId: null, vendorCenterId: null },
    { username: 'cs.bangna', displayName: 'CS สาขาบางนา', role: Role.CS, siteId: siteBangna.id, vendorCenterId: null },
    { username: 'gr.bangna', displayName: 'GR สาขาบางนา', role: Role.GR, siteId: siteBangna.id, vendorCenterId: null },
    { username: 'dc.bkk', displayName: 'DC คลังกรุงเทพ', role: Role.DC, siteId: siteDcBkk.id, vendorCenterId: null },
    { username: 'dc.wangnoi', displayName: 'DC วังน้อย (อยุธยา)', role: Role.DC, siteId: siteDcBkk.id, vendorCenterId: null },
    { username: 'vd.0088', displayName: 'บ.ช่างเจริญ (ศูนย์บางนา)', role: Role.VD, siteId: null, vendorCenterId: vd0088Center1.id },
    { username: 'vd.bosch', displayName: 'ศูนย์ซ่อม Bosch (บ.ช่างเจริญ)', role: Role.VD, siteId: null, vendorCenterId: vd0088Center1.id },
    { username: 'vd.makita', displayName: 'ศูนย์ซ่อม Makita (บ.ช่างเจริญ)', role: Role.VD, siteId: null, vendorCenterId: vd0088Center1.id },
    { username: 's2.bangna', displayName: 'S2 สินค้าสต็อกบางนา', role: Role.S2, siteId: siteBangna.id, vendorCenterId: null },
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: {
        displayName: u.displayName,
        role: u.role,
        siteId: u.siteId,
        vendorCenterId: u.vendorCenterId,
        passwordHash,
        active: true,
      },
      create: {
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        siteId: u.siteId,
        vendorCenterId: u.vendorCenterId,
        passwordHash,
        active: true,
      },
    });
  }
  console.log('✓ Users (7 users) seeded');

  // 15. Thai Address Dataset
  const thaiAddresses = [
    { zipcode: '10260', province: 'กรุงเทพมหานคร', district: 'เขตบางนา', subdistrict: 'แขวงบางนา' },
    { zipcode: '10110', province: 'กรุงเทพมหานคร', district: 'เขตคลองเตย', subdistrict: 'แขวงคลองเตย' },
    { zipcode: '12130', province: 'ปทุมธานี', district: 'อำเภอธัญบุรี', subdistrict: 'ตำบลประชาธิปัตย์' },
    { zipcode: '20000', province: 'ชลบุรี', district: 'อำเภอเมืองชลบุรี', subdistrict: 'ตำบลบางปลาสร้อย' },
    { zipcode: '50000', province: 'เชียงใหม่', district: 'อำเภอเมืองเชียงใหม่', subdistrict: 'ตำบลศรีภูมิ' },
    { zipcode: '11120', province: 'นนทบุรี', district: 'อำเภอปากเกร็ด', subdistrict: 'ตำบลปากเกร็ด' },
    { zipcode: '10150', province: 'กรุงเทพมหานคร', district: 'เขตบางขุนเทียน', subdistrict: 'แขวงแสมดำ' },
  ];

  for (const addr of thaiAddresses) {
    const existing = await prisma.thaiAddress.findFirst({
      where: { zipcode: addr.zipcode, subdistrict: addr.subdistrict },
    });
    if (!existing) {
      await prisma.thaiAddress.create({ data: addr });
    }
  }
  console.log('✓ ThaiAddress dataset seeded');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
