import { Prisma, type VendorApplication } from '@prisma/client'
import { extractApplicationProductRates } from '../validations/vendor-product-group.schema'
import { isApplicationAllBrandsUnrestricted } from '../vendor-brand-selection'
import {
  extractActiveCoverageRoutes,
  extractApplicationBrandNames,
  extractCarryInReceiveMethod,
  parseApplicationSlaDays,
  resolveApprovedParentCode,
  resolveDeliveryMethodAndChannel,
} from '../vendor-approval-mapper'
import { syncVendorApplicationBrands } from './vendor-brand-linker'

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

export interface SyncedVendorResult {
  parentId: string
  parentCode: string
  primaryCenterId: string | null
  linkedBrandCount: number
  isExistingSpcode: boolean
}

export async function syncApplicationToVendorEntities(
  tx: Prisma.TransactionClient,
  app: VendorApplication,
  options: { isResync?: boolean } = {}
): Promise<SyncedVendorResult> {
  const branches = (Array.isArray(app.branches) ? app.branches : []) as StoredBranchRecord[]
  const extractedRates = extractApplicationProductRates(app.appliances, app.agreements)
  const primaryRate =
    extractedRates.find(r => r.serviceType === 'CARRY_IN') ?? extractedRates[0] ?? null
  const derivedGpPct = primaryRate ? primaryRate.gpPct : 18.0
  const derivedInspectionFee = primaryRate ? primaryRate.minInspectionFee : 300
  const derivedSlaDays = parseApplicationSlaDays(app.agreements, app.appliances)

  let parentCode = resolveApprovedParentCode(app.applicationNo, app.agreements)
  if (options.isResync && app.approvedParentId) {
    const existingParent = await tx.vendorParent.findUnique({
      where: { id: app.approvedParentId },
      select: { code: true },
    })
    if (existingParent?.code) parentCode = existingParent.code
  }
  const isExistingSpcode = /^\d{6}$/.test(parentCode)

  const parent = await tx.vendorParent.upsert({
    where: { code: parentCode },
    update: {
      name: app.storeName,
      defaultGpPct: derivedGpPct,
      defaultRepairSlaDays: derivedSlaDays,
      inspectionFeeNotCovered: derivedInspectionFee,
      isBrandAuthorized: app.isBrandAuthorized,
      active: true,
    },
    create: {
      code: parentCode,
      name: app.storeName,
      defaultGpPct: derivedGpPct,
      defaultRepairSlaDays: derivedSlaDays,
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

  let linkedBrandCount = 0
  if (isApplicationAllBrandsUnrestricted(app.appliances)) {
    await tx.vendorBrand.deleteMany({ where: { vendorParentId: parent.id } })
  } else {
    const brandNames = extractApplicationBrandNames(app.appliances, app.agreements)
    const linkedIds = await syncVendorApplicationBrands(tx, parent.id, brandNames)
    linkedBrandCount = linkedIds.length
  }

  const activeRoutes = extractActiveCoverageRoutes(app.coverage)
  const carryInReceiveMethod = extractCarryInReceiveMethod(app.coverage)
  const firstLegacyTransport = Object.values(activeRoutes).find(r => r.transport)?.transport
  const { deliveryMethod } = resolveDeliveryMethodAndChannel(carryInReceiveMethod, firstLegacyTransport)

  const createdCenters: Array<{ id: string; code: string }> = []
  for (let i = 0; i < branches.length; i++) {
    const b = branches[i] || {}
    const centerCode = `${parentCode}-${i + 1}`
    const fullAddress = b.line1
      ? `${b.line1} ${b.subdistrict || ''} ${b.district || ''} ${b.province || ''} ${b.zip || ''}`.trim()
      : `${b.address || ''} ${b.amphoe || ''} ${b.province || ''}`.trim()
    const postalCode = b.zip?.trim() || null
    const phone = b.phone?.trim() || app.phone?.trim() || null

    const center = await tx.vendorCenter.upsert({
      where: { code: centerCode },
      update: { address: fullAddress, postalCode, phone, deliveryMethod, active: true },
      create: {
        code: centerCode,
        vendorParentId: parent.id,
        address: fullAddress,
        postalCode,
        phone,
        deliveryMethod,
        active: true,
      },
    })
    createdCenters.push(center)
  }

  const primaryCenterId = createdCenters[0]?.id ?? null
  const siteCodes = Object.keys(activeRoutes)
  if (primaryCenterId && siteCodes.length > 0) {
    const sites = await tx.site.findMany({
      where: { OR: [{ code: { in: siteCodes } }, { nickname: { in: siteCodes } }] },
    })
    for (const site of sites) {
      const routeCfg = activeRoutes[site.code] || activeRoutes[site.nickname]
      const { standardChannel } = resolveDeliveryMethodAndChannel(carryInReceiveMethod, routeCfg?.transport)
      const assignedCenterId = createdCenters[routeCfg?.respBranchIdx ?? 0]?.id || primaryCenterId

      const existingRoute = await tx.branchVendorRoute.findFirst({
        where: { branchId: site.id, primaryCenterId: assignedCenterId },
      })
      if (existingRoute) {
        await tx.branchVendorRoute.update({
          where: { id: existingRoute.id },
          data: { standardChannel },
        })
      } else {
        const { _max } = await tx.branchVendorRoute.aggregate({
          where: { branchId: site.id },
          _max: { priority: true },
        })
        await tx.branchVendorRoute.create({
          data: {
            branchId: site.id,
            primaryCenterId: assignedCenterId,
            standardChannel,
            priority: (_max.priority ?? 0) + 1,
          },
        })
      }
    }
  }

  return { parentId: parent.id, parentCode, primaryCenterId, linkedBrandCount, isExistingSpcode }
}
