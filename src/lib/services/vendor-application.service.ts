import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { Prisma, VendorApplicationStatus } from '@prisma/client'
import { calculateVendorScoreAndTier } from './vendor-tier.service'
import type { FullVendorApplicationInput } from '../validations/vendor-setup.schema'

export { approveVendorApplication, rejectVendorApplication } from './vendor-approval.service'

export async function createVendorApplication(input: FullVendorApplicationInput) {
  const branches = input.store.branches
  const avgRadius = branches.length
    ? Math.round(branches.reduce((acc, b) => acc + (b.radius || 30), 0) / branches.length)
    : 30

  const coverageKeys = Object.keys(input.coverage.coverage)
  const tierResult = calculateVendorScoreAndTier({
    branchesCount: branches.length,
    avgRadius,
    hasVipBranch: branches.some(b => b.vip),
    hasExpressBranch: branches.some(b => b.express),
    applianceCount: Object.values(input.expertise.appliances).filter(Boolean).length,
    coverageCount: coverageKeys.length,
    hasCompanyDoc: Boolean(input.finance.documents.company),
    hasTechLicense: Boolean(input.finance.documents.license),
    hasPortfolio: Boolean(input.finance.documents.portfolio?.length),
    isBrandAuthorized: input.expertise.isBrandAuthorized,
  })

  const data = {
    status: VendorApplicationStatus.PENDING_APPROVAL,
    storeName: input.store.name.trim(),
    businessType: input.store.type,
    taxId: input.store.taxId.trim(),
    phone: input.store.phone.trim(),
    email: input.store.email,
    lineId: input.store.lineId?.trim() || null,
    branches: input.store.branches as unknown as Prisma.InputJsonValue,
    appliances: input.expertise.appliances as unknown as Prisma.InputJsonValue,
    isBrandAuthorized: input.expertise.isBrandAuthorized,
    coverage: input.coverage.coverage as unknown as Prisma.InputJsonValue,
    documents: input.finance.documents as unknown as Prisma.InputJsonValue,
    bank: {
      bank: input.finance.bank,
      accNo: input.finance.accNo,
      accName: input.finance.accName,
    },
    agreements: input.agreements.agreements as unknown as Prisma.InputJsonValue,
    signatureUrl: input.agreements.signatureUrl,
    estimatedTier: tierResult.tier,
    estimatedCases: tierResult.estimatedCases,
    score: tierResult.score,
  }

  for (let attempt = 0; ; attempt++) {
    const applicationNo = `VDA-${new Date().getFullYear()}-${crypto.randomInt(100000, 1000000)}`
    try {
      return await prisma.vendorApplication.create({ data: { ...data, applicationNo } })
    } catch (e) {
      const isDup = e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
      if (!isDup || attempt >= 4) throw e
    }
  }
}

export async function listVendorApplications(status?: VendorApplicationStatus) {
  return prisma.vendorApplication.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getVendorApplication(id: string) {
  return prisma.vendorApplication.findUnique({
    where: { id },
  })
}
