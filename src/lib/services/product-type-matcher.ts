import type { VendorServiceMode } from '../validations/vendor-product-group.schema'

export interface ProductTypeGroupLite {
  id?: number
  serviceType: VendorServiceMode
  name: string
  skuKeywords?: string | null
  sortOrder: number
  active: boolean
}

export interface ProductTypeOption {
  name: string
  serviceTypes: VendorServiceMode[]
  keywords: string[]
  sortOrder: number
}

export interface CommodityMatchCandidate {
  name?: string | null
  productType?: string | null
  deptName?: string | null
  sdeptName?: string | null
  className?: string | null
  sclassName?: string | null
}

function splitKeywords(raw?: string | null): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map(k => k.trim())
    .filter(Boolean)
}

export function deduplicateActiveProductTypes(groups: ProductTypeGroupLite[]): ProductTypeOption[] {
  const byName = new Map<string, ProductTypeOption>()

  for (const g of groups) {
    if (!g.active) continue
    const cleanName = g.name.trim()
    if (!cleanName) continue

    const extraKeywords = splitKeywords(g.skuKeywords)
    const existing = byName.get(cleanName)
    if (!existing) {
      byName.set(cleanName, {
        name: cleanName,
        serviceTypes: [g.serviceType],
        keywords: Array.from(new Set([cleanName, ...extraKeywords])),
        sortOrder: g.sortOrder,
      })
    } else {
      if (!existing.serviceTypes.includes(g.serviceType)) {
        existing.serviceTypes.push(g.serviceType)
      }
      for (const kw of extraKeywords) {
        if (!existing.keywords.includes(kw)) existing.keywords.push(kw)
      }
      existing.sortOrder = Math.min(existing.sortOrder, g.sortOrder)
    }
  }

  return Array.from(byName.values()).sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'th')
  )
}

function singularizeEn(term: string): string {
  const lower = term.toLowerCase()
  if (lower.endsWith('s') && lower.length > 3) return lower.slice(0, -1)
  return lower
}

export function matchProductTypeFromCommodity(
  commodity: CommodityMatchCandidate,
  options: ProductTypeOption[]
): string | null {
  const rawFields = [
    commodity.productType,
    commodity.sclassName,
    commodity.className,
    commodity.sdeptName,
    commodity.deptName,
    commodity.name,
  ]
    .map(f => (f ?? '').trim().toLowerCase())
    .filter(Boolean)

  if (rawFields.length === 0 || options.length === 0) return null

  // 1. Exact field match against group name
  for (const field of rawFields) {
    const exact = options.find(o => o.name.toLowerCase() === field)
    if (exact) return exact.name
  }

  // 2. Best keyword substring match (longer keyword wins to distinguish e.g. ปั๊มน้ำอัตโนมัติ vs ปั๊มน้ำ)
  const haystack = rawFields.join(' | ')
  let bestMatch: { name: string; score: number } | null = null

  for (const opt of options) {
    for (const rawKw of opt.keywords) {
      const kw = rawKw.trim().toLowerCase()
      if (!kw) continue
      const singularKw = singularizeEn(kw)
      if (haystack.includes(kw) || (singularKw !== kw && haystack.includes(singularKw))) {
        const score = kw.length
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { name: opt.name, score }
        }
      }
    }
  }

  return bestMatch ? bestMatch.name : null
}
