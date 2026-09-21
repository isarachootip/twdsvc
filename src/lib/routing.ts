// การเลือกศูนย์ซ่อมและช่องทาง (05_business_rules.md §3)
import type { Channel } from '@prisma/client'
import { prisma } from './db'
import { getJsonSetting } from './settings'

export interface RoutingInput {
  branchId: string
  brandId?: number | null
  sizeCategoryId?: number | null
  shippingMethod: 'STANDARD' | 'EXPRESS'
  allowNonAuth?: boolean
  jobType?: 'CUSTOMER' | 'STOCK'
}

export interface RoutingResult {
  vendorCenterId: string
  channel: Channel
  centerCode: string
  vendorCode: string
  vendorName: string
}

function compatible(method: string, channel: Channel) {
  if (channel === 'TPL') return true
  if (method === 'DC_DSD') return true
  return method === channel
}

export async function resolveRouting(input: RoutingInput): Promise<RoutingResult | null> {
  const vendorSizes = await getJsonSetting<Record<string, number[]>>('VENDOR_SIZES')
  const routes = await prisma.branchVendorRoute.findMany({
    where: { branchId: input.branchId },
    orderBy: { priority: 'asc' },
    include: {
      primaryCenter: { include: { vendorParent: { include: { brands: true } } } },
      backupCenter: { include: { vendorParent: { include: { brands: true } } } },
    },
  })

  type Center = NonNullable<(typeof routes)[number]['primaryCenter']>
  const eligible = (c: Center | null | undefined): c is Center => {
    if (!c || !c.active || !c.vendorParent.active) return false
    if (input.brandId && c.vendorParent.brands.length > 0 && !c.vendorParent.brands.some(b => b.brandId === input.brandId)) return false
    const sizes = vendorSizes[c.vendorParent.id]
    if (input.sizeCategoryId && sizes && sizes.length > 0 && !sizes.includes(input.sizeCategoryId)) return false
    if (input.jobType !== 'STOCK' && !c.vendorParent.isBrandAuthorized && !input.allowNonAuth) return false
    return true
  }
  const build = (c: Center, standard: Channel): RoutingResult | null => {
    const channel: Channel = input.shippingMethod === 'EXPRESS' ? 'TPL' : standard
    const ch: Channel = compatible(c.deliveryMethod, channel) ? channel : (c.deliveryMethod === 'DSD' ? 'DSD' : 'DC')
    return { vendorCenterId: c.id, channel: ch, centerCode: c.code, vendorCode: c.vendorParent.code, vendorName: c.vendorParent.name }
  }

  for (const r of routes) {
    if (eligible(r.primaryCenter)) return build(r.primaryCenter, r.standardChannel)
    if (eligible(r.backupCenter)) return build(r.backupCenter, r.standardChannel)
  }
  const zone = await prisma.vendorCenter.findMany({
    where: { zoneSiteId: input.branchId, active: true },
    include: { vendorParent: { include: { brands: true } } },
  })
  const z = zone.find(c => eligible(c))
  if (z) return build(z, z.deliveryMethod === 'DSD' ? 'DSD' : 'DC')
  return null
}
