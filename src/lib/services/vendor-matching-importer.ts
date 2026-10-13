import type { PrismaClient } from '@prisma/client'
import type { ParsedVendor, ParsedBrandMapping, ParsedSkuPart } from '../parsers/vendor-matching-types'
import { resolveBranchChannel } from '../parsers/vendor-matching-parser'

export interface ImportSummary {
  vendorsCreated: number
  vendorsUpdated: number
  centersCreated: number
  centersUpdated: number
  brandsCreated: number
  vendorBrandsLinked: number
  routesCreated: number
  routesUpdated: number
  skusUpdated: number
}

export async function upsertVendorsAndCenters(
  prisma: PrismaClient,
  vendors: ParsedVendor[],
  summary: ImportSummary
): Promise<Map<string, { parentId: string; centerId: string }>> {
  const map = new Map<string, { parentId: string; centerId: string }>()

  for (const v of vendors) {
    const existingParent = await prisma.vendorParent.findUnique({ where: { code: v.vendorId } })
    const parent = await prisma.vendorParent.upsert({
      where: { code: v.vendorId },
      update: {
        name: v.name,
        defaultRepairSlaDays: v.slaDays,
        active: v.active,
        isBrandAuthorized: v.isBrandAuthorized,
      },
      create: {
        code: v.vendorId,
        name: v.name,
        defaultRepairSlaDays: v.slaDays,
        active: v.active,
        isBrandAuthorized: v.isBrandAuthorized,
      },
    })
    if (existingParent) summary.vendorsUpdated++
    else summary.vendorsCreated++

    const centerCode = `${v.vendorId}-1`
    const existingCenter = await prisma.vendorCenter.findUnique({ where: { code: centerCode } })
    const center = await prisma.vendorCenter.upsert({
      where: { code: centerCode },
      update: {
        address: v.address,
        deliveryMethod: v.deliveryMethod,
        active: v.active,
      },
      create: {
        code: centerCode,
        vendorParentId: parent.id,
        address: v.address,
        deliveryMethod: v.deliveryMethod,
        active: v.active,
      },
    })
    if (existingCenter) summary.centersUpdated++
    else summary.centersCreated++

    map.set(v.vendorId, { parentId: parent.id, centerId: center.id })
  }

  return map
}

export async function upsertBrandsAndLinks(
  prisma: PrismaClient,
  brandMappings: ParsedBrandMapping[],
  vendors: ParsedVendor[],
  vendorMap: Map<string, { parentId: string; centerId: string }>,
  summary: ImportSummary
): Promise<void> {
  const linkBrand = async (parentId: string, bName: string) => {
    const existingBrand = await prisma.brand.findUnique({ where: { name: bName } })
    const brand = await prisma.brand.upsert({
      where: { name: bName },
      update: { active: true },
      create: { name: bName, active: true },
    })
    if (!existingBrand) summary.brandsCreated++

    const existingLink = await prisma.vendorBrand.findUnique({
      where: { vendorParentId_brandId: { vendorParentId: parentId, brandId: brand.id } },
    })
    if (!existingLink) {
      await prisma.vendorBrand.create({
        data: { vendorParentId: parentId, brandId: brand.id },
      })
      summary.vendorBrandsLinked++
    }
  }

  for (const m of brandMappings) {
    const parentInfo = vendorMap.get(m.vendorId) || vendorMap.get(`${m.vendorId}-1`)
    if (!parentInfo) continue
    for (const bName of m.brandNames) {
      await linkBrand(parentInfo.parentId, bName)
    }
    // Also if 640532, link to 640532-2
    const child2 = vendorMap.get(`${m.vendorId}-2`)
    if (child2) {
      for (const bName of m.brandNames) {
        await linkBrand(child2.parentId, bName)
      }
    }
  }

  for (const v of vendors) {
    const parentInfo = vendorMap.get(v.vendorId)
    if (!parentInfo || !v.brands.length) continue
    for (const bName of v.brands) {
      await linkBrand(parentInfo.parentId, bName)
    }
  }
}

export async function syncBranchRoutes(
  prisma: PrismaClient,
  activeVendors: ParsedVendor[],
  vendorMap: Map<string, { parentId: string; centerId: string }>,
  summary: ImportSummary
): Promise<void> {
  const branches = await prisma.site.findMany({ where: { type: 'BRANCH', active: true } })
  const dcSite = await prisma.site.findFirst({ where: { type: 'DC', active: true } })
  const existingRoutes = await prisma.branchVendorRoute.findMany({
    select: { id: true, branchId: true, primaryCenterId: true, standardChannel: true },
  })

  const routeMap = new Map<string, { id: string; standardChannel: string }>()
  for (const r of existingRoutes) {
    if (r.primaryCenterId) {
      routeMap.set(`${r.branchId}_${r.primaryCenterId}`, { id: r.id, standardChannel: r.standardChannel })
    }
  }

  const toCreate: Array<{
    branchId: string
    primaryCenterId: string
    dcSiteId?: string | null
    standardChannel: 'DC' | 'DSD' | 'TPL'
    priority: number
  }> = []

  for (const v of activeVendors) {
    const info = vendorMap.get(v.vendorId)
    if (!info) continue

    for (const b of branches) {
      const channel = resolveBranchChannel(v.dropPoint, b.province, b.postalCode)
      const key = `${b.id}_${info.centerId}`
      const existing = routeMap.get(key)

      if (existing) {
        if (existing.standardChannel !== channel) {
          await prisma.branchVendorRoute.update({
            where: { id: existing.id },
            data: { standardChannel: channel, dcSiteId: dcSite?.id },
          })
          summary.routesUpdated++
        }
      } else {
        toCreate.push({
          branchId: b.id,
          primaryCenterId: info.centerId,
          dcSiteId: dcSite?.id,
          standardChannel: channel,
          priority: 1,
        })
      }
    }
  }

  if (toCreate.length > 0) {
    const res = await prisma.branchVendorRoute.createMany({
      data: toCreate,
    })
    summary.routesCreated += res.count
  }
}

export async function batchUpdateCommodityVendors(
  prisma: PrismaClient,
  skuParts: ParsedSkuPart[],
  batchSize = 2500
): Promise<number> {
  let updatedTotal = 0
  const sql = `UPDATE commodities SET "vendorNo" = data.vno, "vendorName" = data.vname
    FROM (SELECT unnest($1::text[]) AS sku, unnest($2::text[]) AS vno, unnest($3::text[]) AS vname) AS data
    WHERE commodities.sku = data.sku`

  for (let i = 0; i < skuParts.length; i += batchSize) {
    const chunk = skuParts.slice(i, i + batchSize)
    const skus = chunk.map(c => c.sku)
    const vnos = chunk.map(c => c.vendorNo)
    const vnames = chunk.map(c => c.vendorName)

    const res = await prisma.$executeRawUnsafe(sql, skus, vnos, vnames)
    updatedTotal += Number(res)
  }

  return updatedTotal
}
