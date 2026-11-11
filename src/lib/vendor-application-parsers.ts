import {
  STANDARD_VENDOR_DOC_FIELDS,
  type NormalizedAddress,
  type NormalizedBranchItem,
  type NormalizedAuthorizedBrand,
  type NormalizedCoverageRoute,
  type NormalizedDocumentItem,
  type ResolvedSiteMeta,
} from './vendor-application-types'

export function asObj(val: unknown): Record<string, unknown> {
  return val && typeof val === 'object' && !Array.isArray(val) ? (val as Record<string, unknown>) : {}
}

export function asStr(val: unknown, fallback = '-'): string {
  if (typeof val !== 'string') return fallback
  const trimmed = val.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

export function asNumOrNull(val: unknown): number | null {
  return typeof val === 'number' && Number.isFinite(val) ? val : null
}

export function asStrArr(val: unknown): string[] {
  if (!Array.isArray(val)) return []
  return val.filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
}

export function parseAddress(raw: unknown): NormalizedAddress {
  const o = asObj(raw)
  return {
    line1: asStr(o.line1 ?? o.address),
    subdistrict: asStr(o.subdistrict),
    district: asStr(o.district ?? o.amphoe),
    province: asStr(o.province),
    zip: asStr(o.zip),
    phone: asStr(o.phone),
    note: asStr(o.note),
  }
}

export function parseBranches(raw: unknown): NormalizedBranchItem[] {
  if (!Array.isArray(raw)) return []
  return raw.map(item => {
    const o = asObj(item)
    return { ...parseAddress(o), contactName: asStr(o.contactName ?? o.name) }
  })
}

export function parseAuthorizedBrands(raw: unknown): NormalizedAuthorizedBrand[] {
  if (!Array.isArray(raw)) return []
  return raw.map(item => {
    const o = asObj(item)
    return {
      brand: asStr(o.brand),
      productType: asStr(o.productType),
      certNo: asStr(o.certNo),
      expireDate: asStr(o.expireDate),
    }
  })
}

export function parseDocuments(raw: unknown): NormalizedDocumentItem[] {
  const docObj = asObj(raw)
  const items: NormalizedDocumentItem[] = STANDARD_VENDOR_DOC_FIELDS.map(f => ({
    key: f.key,
    label: f.label,
    fileUrl: typeof docObj[f.key] === 'string' && docObj[f.key] ? String(docObj[f.key]) : null,
  }))
  const legacyMap: Array<{ k: string; label: string }> = [
    { k: 'company', label: 'เอกสารนิติบุคคล (ระบบเดิม)' },
    { k: 'license', label: 'ใบอนุญาต / วุฒิบัตรช่าง (ระบบเดิม)' },
  ]
  for (const leg of legacyMap) {
    if (typeof docObj[leg.k] === 'string' && docObj[leg.k]) {
      items.push({ key: leg.k, label: leg.label, fileUrl: String(docObj[leg.k]) })
    }
  }
  return items
}

export function parseActiveCoverageRoutes(
  covObj: Record<string, unknown>,
  branches: NormalizedBranchItem[],
  resolvedSites?: Record<string, ResolvedSiteMeta>
): NormalizedCoverageRoute[] {
  const routesSource = covObj.routes && typeof covObj.routes === 'object' ? asObj(covObj.routes) : covObj
  const activeRoutes: NormalizedCoverageRoute[] = []
  for (const [siteKey, val] of Object.entries(routesSource)) {
    if (siteKey === 'radius' || siteKey === 'carryInReceiveMethod') continue
    const rObj = asObj(val)
    const isOnsite = typeof rObj.onsite === 'boolean' ? rObj.onsite : Boolean(rObj.transport)
    if (!isOnsite) continue
    const respIdx = typeof rObj.respBranchIdx === 'number' ? rObj.respBranchIdx : 0
    const respBranch = branches[respIdx]
    const respLabel = respBranch && respBranch.line1 !== '-'
      ? `สาขาที่ ${respIdx + 1}: ${respBranch.line1}`
      : `สาขาที่ ${respIdx + 1}`
    const siteMeta = resolvedSites?.[siteKey]
    activeRoutes.push({
      siteKey,
      siteDisplayName: siteMeta?.nickname || siteKey,
      siteFullName: siteMeta?.name || siteKey,
      province: siteMeta?.province || '-',
      onsite: true,
      respBranchIdx: respIdx,
      respBranchLabel: respLabel,
    })
  }
  return activeRoutes
}
