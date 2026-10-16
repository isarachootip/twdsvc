import {
  Channel,
  JobStage,
  JobType,
  QuoteDecision,
  Role,
  type Brand,
  type PrismaClient,
  type Site,
  type SizeCategory,
  type VendorCenter,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

/**
 * Demo/test data (test_* accounts + one sample job).
 * Only called from prisma/seed.ts when shouldSeedTestData() allows it —
 * i.e. never in production, and only with an explicit SEED_TEST_PASSWORD.
 */
export interface TestSeedContext {
  password: string
  bn: Site
  dc1: Site
  vc1: VendorCenter
  brand: Brand
  large: SizeCategory
}

export async function seedTestData(prisma: PrismaClient, ctx: TestSeedContext): Promise<void> {
  await seedTestUsers(prisma, ctx)
  await seedSampleJob(prisma, ctx)
}

async function seedTestUsers(prisma: PrismaClient, ctx: TestSeedContext): Promise<void> {
  const { bn, dc1, vc1 } = ctx
  const hash = await bcrypt.hash(ctx.password, 12)
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
  console.log('  ✓ Test users (7 accounts, password from SEED_TEST_PASSWORD)')
}

async function seedSampleJob(prisma: PrismaClient, ctx: TestSeedContext): Promise<void> {
  const { bn, vc1, brand, large } = ctx
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
      brandId: brand.id,
      sizeCategoryId: large.id,
      symptom: 'ไม่เย็น คอมเพรสเซอร์ไม่ทำงาน',
      hasWarranty: false,
      shippingMethod: 'STANDARD',
      decision: QuoteDecision.PENDING,
      createdBy: 'test_cs',
    },
  })
  await prisma.jobCharge.createMany({
    data: [{ jobId: sampleJob.id, type: 'OPERATION_FEE', amount: 300, description: 'ค่าดำเนินการ' }],
    skipDuplicates: true,
  })
  const existingEvent = await prisma.jobEvent.findFirst({ where: { jobId: sampleJob.id, type: 'JOB_OPENED' } })
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
      },
    })
  }
  console.log('  ✓ Sample job (JB-2609-00001)')
}
