import { prisma } from '@/lib/db'
import { listVendorServiceGroups } from './vendor-product-group.service'
import {
  extractApplicationProductRates,
  type VendorServiceMode,
} from '../validations/vendor-product-group.schema'

export interface ProductTypeGroupWithStats {
  id: number
  serviceType: VendorServiceMode
  name: string
  minInspectionFee: number
  recommendedFee: number
  minGpPct: number
  defaultGpPct: number
  skuKeywords: string | null
  sortOrder: number
  active: boolean
  vendorCount: number
  jobCount: number
}

export interface PendingVendorCustomGroup {
  key: string
  serviceType: VendorServiceMode
  name: string
  suggestedFee: number
  suggestedGpPct: number
  vendorNames: string[]
  sourceCount: number
}

export interface ProductTypeMasterOverview {
  groups: ProductTypeGroupWithStats[]
  customGroups: PendingVendorCustomGroup[]
}

export async function getProductTypeMasterOverview(): Promise<ProductTypeMasterOverview> {
  const [masterGroups, productRates, jobCounts, applications] = await Promise.all([
    listVendorServiceGroups({ activeOnly: false }),
    prisma.vendorProductRate.findMany({
      include: { vendorParent: { select: { name: true, active: true } } },
    }),
    prisma.job.groupBy({
      by: ['productGroupName'],
      where: { productGroupName: { not: null }, isTest: false },
      _count: { _all: true },
    }),
    prisma.vendorApplication.findMany({
      where: { status: { in: ['PENDING_APPROVAL', 'APPROVED'] } },
      select: { storeName: true, appliances: true, agreements: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ])

  const masterKeySet = new Set(masterGroups.map(g => `${g.serviceType}::${g.name.trim()}`))

  const vendorSetByKey = new Map<string, Set<string>>()
  const customMap = new Map<string, PendingVendorCustomGroup>()

  const recordCandidate = (
    serviceType: VendorServiceMode,
    rawName: string,
    fee: number,
    gpPct: number,
    storeName: string
  ) => {
    const cleanName = rawName.trim()
    if (!cleanName) return
    const key = `${serviceType}::${cleanName}`
    if (masterKeySet.has(key)) return

    const existing = customMap.get(key)
    if (!existing) {
      customMap.set(key, {
        key,
        serviceType,
        name: cleanName,
        suggestedFee: fee,
        suggestedGpPct: gpPct,
        vendorNames: storeName ? [storeName] : [],
        sourceCount: 1,
      })
    } else {
      existing.sourceCount += 1
      if (storeName && !existing.vendorNames.includes(storeName)) {
        existing.vendorNames.push(storeName)
      }
    }
  }

  for (const r of productRates) {
    const key = `${r.serviceType}::${r.groupName.trim()}`
    if (!vendorSetByKey.has(key)) vendorSetByKey.set(key, new Set())
    vendorSetByKey.get(key)!.add(r.vendorParentId)

    recordCandidate(r.serviceType, r.groupName, r.minInspectionFee, r.gpPct, r.vendorParent.name)
  }

  for (const app of applications) {
    const extracted = extractApplicationProductRates(app.appliances, app.agreements)
    for (const rate of extracted) {
      recordCandidate(rate.serviceType, rate.groupName, rate.minInspectionFee, rate.gpPct, app.storeName)
    }
  }

  const jobCountByName = new Map<string, number>()
  for (const jc of jobCounts) {
    if (jc.productGroupName) {
      jobCountByName.set(jc.productGroupName.trim(), jc._count._all)
    }
  }

  const groups: ProductTypeGroupWithStats[] = masterGroups.map(g => {
    const key = `${g.serviceType}::${g.name.trim()}`
    return {
      id: g.id,
      serviceType: g.serviceType,
      name: g.name,
      minInspectionFee: g.minInspectionFee,
      recommendedFee: g.recommendedFee,
      minGpPct: g.minGpPct,
      defaultGpPct: g.defaultGpPct,
      skuKeywords: g.skuKeywords ?? null,
      sortOrder: g.sortOrder,
      active: g.active,
      vendorCount: vendorSetByKey.get(key)?.size ?? 0,
      jobCount: jobCountByName.get(g.name.trim()) ?? 0,
    }
  })

  return {
    groups,
    customGroups: Array.from(customMap.values()).sort(
      (a, b) => b.sourceCount - a.sourceCount || a.name.localeCompare(b.name, 'th')
    ),
  }
}
