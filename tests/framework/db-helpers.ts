import { PrismaClient, JobStage, Channel } from '@prisma/client'
import { executeAction, ActionType, ActionInput, Actor, ActionResult } from '../../src/lib/state-machine'
import { prisma } from '../../src/lib/db'

export async function createTestJobInDb(
  p: PrismaClient = prisma,
  overrides: {
    jobNo?: string
    branchCode?: string
    brandName?: string
    productName?: string
    stage?: JobStage
    type?: 'CUSTOMER' | 'STOCK'
    channel?: Channel
    customerName?: string
    customerPhone?: string
    hasWarranty?: boolean
    shippingMethod?: 'STANDARD' | 'EXPRESS'
  } = {}
) {
  const branch = await p.site.findFirstOrThrow({ where: { active: true } })
  const brand = await p.brand.findFirstOrThrow()
  const size = await p.sizeCategory.findFirstOrThrow()
  const vendorCenter = await p.vendorCenter.findFirst({ where: { active: true } })

  const uniqueJobNo = overrides.jobNo ?? `TST-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 10000)}`

  return p.job.create({
    data: {
      jobNo: uniqueJobNo,
      type: overrides.type ?? 'CUSTOMER',
      stage: overrides.stage ?? 'CS_OPENED',
      channel: overrides.channel ?? 'DC',
      branchId: branch.id,
      vendorCenterId: vendorCenter?.id,
      customerName: overrides.customerName ?? 'ลูกค้าทดสอบ DB จริง',
      customerPhone: overrides.customerPhone ?? '0811112222',
      productName: overrides.productName ?? 'สว่านไร้สาย DB Test',
      brandId: brand.id,
      brandName: brand.name,
      sizeCategoryId: size.id,
      symptom: 'ทดสอบฐานข้อมูล PostgreSQL ตรง',
      hasWarranty: overrides.hasWarranty ?? true,
      shippingMethod: overrides.shippingMethod ?? 'STANDARD',
      createdBy: 'test-runner',
    },
    include: {
      charges: true,
      payments: true,
      shipments: true,
      quotes: { include: { lines: true } },
    },
  })
}

export async function executeDbAction(
  jobId: string,
  action: ActionType,
  input: ActionInput = {},
  actor: Actor
): Promise<ActionResult> {
  return executeAction(jobId, action, input, actor)
}

export async function cleanupTestJobs(p: PrismaClient = prisma, prefix = 'TST-') {
  const jobs = await p.job.findMany({
    where: { jobNo: { startsWith: prefix } },
    select: { id: true },
  })
  if (jobs.length > 0) {
    const ids = jobs.map((j) => j.id)
    await p.job.deleteMany({ where: { id: { in: ids } } })
  }
}
