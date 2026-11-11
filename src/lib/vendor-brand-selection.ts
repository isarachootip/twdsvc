export interface ApplicationBrandSummary {
  hasCarryIn: boolean
  carryInAllBrands: boolean
  carryInBrands: string[]
  hasOnSite: boolean
  onSiteAllBrands: boolean
  onSiteBrands: string[]
}

function asObj(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((v): v is string => typeof v === 'string')
    .map(v => v.trim())
    .filter(Boolean)
}

export function filterBrandOptions(allBrands: readonly string[], query: string): string[] {
  const q = query.trim().toUpperCase()
  if (!q) return [...allBrands]
  return allBrands.filter(b => b.toUpperCase().includes(q))
}

export function toggleBrandSelection(selected: readonly string[], brand: string): string[] {
  const clean = brand.trim()
  if (!clean) return [...selected]
  if (selected.includes(clean)) {
    return selected.filter(b => b !== clean)
  }
  return [...selected, clean]
}

export function extractApplicationBrandSummary(appliances: unknown): ApplicationBrandSummary {
  const app = asObj(appliances)
  const carryInProducts = toStringList(app.carryIn)
  const onSiteProducts = toStringList(app.onSite)
  const carryInAllBrands = app.carryInAllBrands === true
  const onSiteAllBrands = app.onSiteAllBrands === true

  return {
    hasCarryIn: carryInProducts.length > 0 || carryInAllBrands || toStringList(app.carryInBrands).length > 0,
    carryInAllBrands,
    carryInBrands: carryInAllBrands ? [] : toStringList(app.carryInBrands),
    hasOnSite: onSiteProducts.length > 0 || onSiteAllBrands || toStringList(app.onSiteBrands).length > 0,
    onSiteAllBrands,
    onSiteBrands: onSiteAllBrands ? [] : toStringList(app.onSiteBrands),
  }
}

export function isApplicationAllBrandsUnrestricted(appliances: unknown): boolean {
  const summary = extractApplicationBrandSummary(appliances)
  if (summary.hasCarryIn && summary.carryInAllBrands) return true
  if (summary.hasOnSite && summary.onSiteAllBrands) return true
  return false
}

export function resolveApprovedBrandNames(appliances: unknown): {
  unrestricted: boolean
  brandNames: string[]
} {
  if (isApplicationAllBrandsUnrestricted(appliances)) {
    return { unrestricted: true, brandNames: [] }
  }

  const summary = extractApplicationBrandSummary(appliances)
  const combined = [...summary.carryInBrands, ...summary.onSiteBrands]
  const seen = new Set<string>()
  const brandNames: string[] = []

  for (const raw of combined) {
    const upper = raw.toUpperCase()
    if (!seen.has(upper)) {
      seen.add(upper)
      brandNames.push(upper)
    }
  }

  if (brandNames.length === 0) {
    return { unrestricted: true, brandNames: [] }
  }
  return { unrestricted: false, brandNames }
}
