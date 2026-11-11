import { prisma } from '@/lib/db'
import { HttpError } from '@/lib/api'
import { Prisma, VendorApplicationStatus } from '@prisma/client'
import { createVendorUser } from './vendor-account.service'
import { syncApplicationToVendorEntities } from './vendor-approval-sync'
import { extractApplicationBrandNames } from '../vendor-approval-mapper'

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
    const synced = await syncApplicationToVendorEntities(tx, app, { isResync: false })

    const credentials = await createVendorUser(tx, {
      parentCode: synced.parentCode,
      storeName: app.storeName,
      centerId: synced.primaryCenterId,
      email: app.email,
      preserveExisting: synced.isExistingSpcode,
    })

    const application = await tx.vendorApplication.update({
      where: { id },
      data: { approvedParentId: synced.parentId },
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

export async function resyncApprovedVendorApplication(id: string) {
  return prisma.$transaction(async tx => {
    const app = await tx.vendorApplication.findUnique({ where: { id } })
    if (!app) throw new HttpError(404, 'ไม่พบใบสมัคร')
    if (app.status !== VendorApplicationStatus.APPROVED) {
      throw new HttpError(400, 'สามารถซิงก์ข้อมูลได้เฉพาะใบสมัครที่อนุมัติแล้วเท่านั้น')
    }

    const synced = await syncApplicationToVendorEntities(tx, app, { isResync: true })
    await createVendorUser(tx, {
      parentCode: synced.parentCode,
      storeName: app.storeName,
      centerId: synced.primaryCenterId,
      email: app.email,
      preserveExisting: true,
    })

    const application =
      app.approvedParentId !== synced.parentId
        ? await tx.vendorApplication.update({
            where: { id: app.id },
            data: { approvedParentId: synced.parentId },
          })
        : app

    return { application, synced }
  })
}

export async function backfillAllApprovedApplications(options: { onlyMissingData?: boolean } = {}) {
  const approvedApps = await prisma.vendorApplication.findMany({
    where: { status: VendorApplicationStatus.APPROVED },
    orderBy: { createdAt: 'asc' },
  })
  if (approvedApps.length === 0) return { syncedCount: 0 }

  let candidates = approvedApps
  if (options.onlyMissingData) {
    const parentIds = approvedApps.map(a => a.approvedParentId).filter((v): v is string => Boolean(v))
    const parents = await prisma.vendorParent.findMany({
      where: { id: { in: parentIds } },
      include: { brands: { select: { brandId: true } }, centers: { select: { postalCode: true } } },
    })
    const parentMap = new Map(parents.map(p => [p.id, p]))

    candidates = approvedApps.filter(app => {
      if (!app.approvedParentId) return true
      const p = parentMap.get(app.approvedParentId)
      if (!p) return true
      const expectedBrands = extractApplicationBrandNames(app.appliances, app.agreements)
      if (expectedBrands.length > 0 && p.brands.length === 0) return true
      const rawBranches = Array.isArray(app.branches) ? (app.branches as Array<{ zip?: string }>) : []
      const hasZipInApp = rawBranches.some(b => Boolean(b?.zip?.trim()))
      if (hasZipInApp && p.centers.some(c => !c.postalCode)) return true
      return false
    })
  }

  let syncedCount = 0
  for (const app of candidates) {
    await resyncApprovedVendorApplication(app.id)
    syncedCount++
  }
  return { syncedCount }
}
