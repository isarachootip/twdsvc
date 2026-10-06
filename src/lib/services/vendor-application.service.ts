import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { HttpError } from '@/lib/api'
import { Prisma, VendorApplicationStatus } from '@prisma/client'
import { calculateVendorScoreAndTier } from './vendor-tier.service'
import type { FullVendorApplicationInput, BranchItem, RouteCoverageItem } from '../validations/vendor-setup.schema'

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
    lineId: input.store.lineId?.trim() || null,
    branches: input.store.branches as unknown as object,
    appliances: input.expertise.appliances as unknown as object,
    isBrandAuthorized: input.expertise.isBrandAuthorized,
    coverage: input.coverage.coverage as unknown as object,
    documents: input.finance.documents as unknown as object,
    bank: {
      bank: input.finance.bank,
      accNo: input.finance.accNo,
      accName: input.finance.accName,
    },
    agreements: input.agreements.agreements as unknown as object,
    signatureUrl: input.agreements.signatureUrl,
    estimatedTier: tierResult.tier,
    estimatedCases: tierResult.estimatedCases,
    score: tierResult.score,
  }

  // applicationNo is @unique — retry on the (rare) random collision instead of failing with a 500
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

/** Atomically moves a PENDING application to `status`; throws 409 if it was already decided. */
async function claimPending(tx: Prisma.TransactionClient, id: string, status: VendorApplicationStatus, adminUserId: string) {
  const { count } = await tx.vendorApplication.updateMany({
    where: { id, status: VendorApplicationStatus.PENDING_APPROVAL },
    data: { status, reviewedBy: adminUserId, reviewedAt: new Date() },
  })
  if (count === 0) {
    const exists = await tx.vendorApplication.findUnique({ where: { id }, select: { status: true } })
    if (!exists) throw new HttpError(404, 'ไม่พบใบสมัคร')
    throw new HttpError(409, `ใบสมัครนี้ถูกพิจารณาไปแล้ว (${exists.status})`)
  }
}

export async function approveVendorApplication(id: string, adminUserId: string) {
  return prisma.$transaction(async tx => {
    await claimPending(tx, id, VendorApplicationStatus.APPROVED, adminUserId)
    const app = await tx.vendorApplication.findUniqueOrThrow({ where: { id } })
    const branches = (app.branches as unknown as BranchItem[]) || []
    const coverage = (app.coverage as unknown as Record<string, RouteCoverageItem>) || {}

    // Derive vendor parent code: VD-XXXX
    const parentCode = `VD-${app.applicationNo.replace('VDA-', '')}`
    const parent = await tx.vendorParent.upsert({
      where: { code: parentCode },
      update: {
        name: app.storeName,
        isBrandAuthorized: app.isBrandAuthorized,
        active: true,
      },
      create: {
        code: parentCode,
        name: app.storeName,
        defaultGpPct: 18.0,
        defaultRepairSlaDays: 7,
        repairWarrantyDays: 90,
        inspectionFeeCovered: 0,
        inspectionFeeNotCovered: 300,
        isBrandAuthorized: app.isBrandAuthorized,
        active: true,
      },
    })

    const createdCenters: Array<{ id: string; code: string }> = []
    for (let i = 0; i < branches.length; i++) {
      const b = branches[i]
      const centerCode = `${parentCode}-${i + 1}`
      const center = await tx.vendorCenter.upsert({
        where: { code: centerCode },
        update: {
          address: `${b.address} ${b.amphoe} ${b.province}`.trim(),
          phone: b.phone,
          active: true,
        },
        create: {
          code: centerCode,
          vendorParentId: parent.id,
          address: `${b.address} ${b.amphoe} ${b.province}`.trim(),
          phone: b.phone,
          deliveryMethod: 'DC',
          active: true,
        },
      })
      createdCenters.push(center)
    }

    // Connect routes for selected SVC sites
    const primaryCenterId = createdCenters[0]?.id
    if (primaryCenterId) {
      const siteCodes = Object.keys(coverage)
      const sites = await tx.site.findMany({
        where: {
          OR: [{ code: { in: siteCodes } }, { nickname: { in: siteCodes } }],
        },
      })

      for (const site of sites) {
        const routeConfig = coverage[site.code] || coverage[site.nickname]
        const channel = routeConfig?.transport === 'tpl' ? 'TPL' : routeConfig?.transport === 'pickup' ? 'DSD' : 'DC'
        await tx.branchVendorRoute.create({
          data: {
            branchId: site.id,
            primaryCenterId,
            standardChannel: channel,
            priority: 1,
          },
        })
      }
    }

    return tx.vendorApplication.update({
      where: { id },
      data: { approvedParentId: parent.id },
    })
  })
}

export async function rejectVendorApplication(id: string, reason: string, adminUserId: string) {
  return prisma.$transaction(async tx => {
    await claimPending(tx, id, VendorApplicationStatus.REJECTED, adminUserId)
    return tx.vendorApplication.update({ where: { id }, data: { adminNotes: reason } })
  })
}
