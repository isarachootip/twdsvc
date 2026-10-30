import { prisma } from '@/lib/db'
import { HttpError } from '@/lib/api'
import { Channel, Prisma, VendorApplicationStatus } from '@prisma/client'
import { createVendorUser } from './vendor-account.service'
import { extractApplicationProductRates } from '../validations/vendor-product-group.schema'

interface StoredBranchRecord {
  line1?: string
  subdistrict?: string
  district?: string
  province?: string
  zip?: string
  address?: string
  amphoe?: string
  phone?: string
}

interface StoredRouteConfig {
  transport?: string
  respBranchIdx?: number
  onsite?: boolean
}

/** Atomically moves a PENDING application to `status`; throws 409 if it was already decided. */
async function claimPending(
  tx: Prisma.TransactionClient,
  id: string,
  status: VendorApplicationStatus,
  adminUserId: string
) {
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
    const branches = (Array.isArray(app.branches) ? app.branches : []) as StoredBranchRecord[]

    const extractedRates = extractApplicationProductRates(app.appliances, app.agreements)
    const primaryRate =
      extractedRates.find(r => r.serviceType === 'CARRY_IN') ?? extractedRates[0] ?? null
    const derivedGpPct = primaryRate ? primaryRate.gpPct : 18.0
    const derivedInspectionFee = primaryRate ? primaryRate.minInspectionFee : 300

    const parentCode = `VD-${app.applicationNo.replace('VDA-', '')}`
    const parent = await tx.vendorParent.upsert({
      where: { code: parentCode },
      update: {
        name: app.storeName,
        defaultGpPct: derivedGpPct,
        inspectionFeeNotCovered: derivedInspectionFee,
        isBrandAuthorized: app.isBrandAuthorized,
        active: true,
      },
      create: {
        code: parentCode,
        name: app.storeName,
        defaultGpPct: derivedGpPct,
        defaultRepairSlaDays: 7,
        repairWarrantyDays: 90,
        inspectionFeeCovered: 0,
        inspectionFeeNotCovered: derivedInspectionFee,
        isBrandAuthorized: app.isBrandAuthorized,
        active: true,
      },
    })

    for (const rate of extractedRates) {
      await tx.vendorProductRate.upsert({
        where: {
          vendorParentId_serviceType_groupName: {
            vendorParentId: parent.id,
            serviceType: rate.serviceType,
            groupName: rate.groupName,
          },
        },
        update: {
          minInspectionFee: rate.minInspectionFee,
          gpPct: rate.gpPct,
          isCustomGroup: Boolean(rate.isCustomGroup),
          canRepair: rate.tasks ? rate.tasks.repair : true,
          canReplacePart: rate.tasks ? rate.tasks.replacePart : true,
          canInstall: rate.tasks ? rate.tasks.install : false,
        },
        create: {
          vendorParentId: parent.id,
          serviceType: rate.serviceType,
          groupName: rate.groupName,
          minInspectionFee: rate.minInspectionFee,
          gpPct: rate.gpPct,
          isCustomGroup: Boolean(rate.isCustomGroup),
          canRepair: rate.tasks ? rate.tasks.repair : true,
          canReplacePart: rate.tasks ? rate.tasks.replacePart : true,
          canInstall: rate.tasks ? rate.tasks.install : false,
        },
      })
    }

    const createdCenters: Array<{ id: string; code: string }> = []
    for (let i = 0; i < branches.length; i++) {
      const b = branches[i] || {}
      const centerCode = `${parentCode}-${i + 1}`
      const fullAddress = b.line1
        ? `${b.line1} ${b.subdistrict || ''} ${b.district || ''} ${b.province || ''} ${b.zip || ''}`.trim()
        : `${b.address || ''} ${b.amphoe || ''} ${b.province || ''}`.trim()

      const center = await tx.vendorCenter.upsert({
        where: { code: centerCode },
        update: { address: fullAddress, phone: b.phone ?? null, active: true },
        create: {
          code: centerCode,
          vendorParentId: parent.id,
          address: fullAddress,
          phone: b.phone ?? null,
          deliveryMethod: 'DC',
          active: true,
        },
      })
      createdCenters.push(center)
    }

    const primaryCenterId = createdCenters[0]?.id
    if (primaryCenterId) {
      const rawCov = (app.coverage && typeof app.coverage === 'object' ? app.coverage : {}) as Record<string, unknown>
      const covMap = (rawCov.routes && typeof rawCov.routes === 'object'
        ? rawCov.routes
        : rawCov) as Record<string, StoredRouteConfig>
      const siteCodes = Object.keys(covMap)
      const sites = await tx.site.findMany({
        where: { OR: [{ code: { in: siteCodes } }, { nickname: { in: siteCodes } }] },
      })

      for (const site of sites) {
        const routeConfig = covMap[site.code] || covMap[site.nickname]
        const channel: Channel =
          routeConfig?.transport === 'tpl' ? 'TPL' : routeConfig?.transport === 'pickup' ? 'DSD' : 'DC'
        const centerIdx = typeof routeConfig?.respBranchIdx === 'number' ? routeConfig.respBranchIdx : 0
        const assignedCenterId = createdCenters[centerIdx]?.id || primaryCenterId

        const { _max } = await tx.branchVendorRoute.aggregate({
          where: { branchId: site.id },
          _max: { priority: true },
        })
        await tx.branchVendorRoute.create({
          data: {
            branchId: site.id,
            primaryCenterId: assignedCenterId,
            standardChannel: channel,
            priority: (_max.priority ?? 0) + 1,
          },
        })
      }
    }

    const credentials = await createVendorUser(tx, {
      parentCode,
      storeName: app.storeName,
      centerId: primaryCenterId ?? null,
    })
    const application = await tx.vendorApplication.update({
      where: { id },
      data: { approvedParentId: parent.id },
    })
    return { application, credentials }
  })
}

export async function rejectVendorApplication(id: string, reason: string, adminUserId: string) {
  return prisma.$transaction(async tx => {
    await claimPending(tx, id, VendorApplicationStatus.REJECTED, adminUserId)
    return tx.vendorApplication.update({ where: { id }, data: { adminNotes: reason } })
  })
}
