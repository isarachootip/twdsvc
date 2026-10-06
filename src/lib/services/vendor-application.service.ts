import { prisma } from '@/lib/db'
import { VendorApplicationStatus } from '@prisma/client'
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

  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  const applicationNo = `VDA-${year}-${rand}`

  return prisma.vendorApplication.create({
    data: {
      applicationNo,
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
    },
  })
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

export async function approveVendorApplication(id: string, adminUserId: string) {
  const app = await prisma.vendorApplication.findUniqueOrThrow({ where: { id } })
  const branches = (app.branches as unknown as BranchItem[]) || []
  const coverage = (app.coverage as unknown as Record<string, RouteCoverageItem>) || {}

  // Derive vendor parent code: VD-XXXX
  const parentCode = `VD-${app.applicationNo.replace('VDA-', '')}`

  return prisma.$transaction(async tx => {
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
      data: {
        status: VendorApplicationStatus.APPROVED,
        approvedParentId: parent.id,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      },
    })
  })
}

export async function rejectVendorApplication(id: string, reason: string, adminUserId: string) {
  return prisma.vendorApplication.update({
    where: { id },
    data: {
      status: VendorApplicationStatus.REJECTED,
      adminNotes: reason,
      reviewedBy: adminUserId,
      reviewedAt: new Date(),
    },
  })
}
