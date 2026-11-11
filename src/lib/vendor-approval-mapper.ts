import type { Channel } from '@prisma/client'
import { isApplicationAllBrandsUnrestricted } from './vendor-brand-selection'

export interface ActiveCoverageRoute {
  respBranchIdx: number
  transport?: string
  onsite?: boolean
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function collectStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((item): item is string => typeof item === 'string')
    .map(s => s.trim())
    .filter(Boolean)
}

export function extractApplicationBrandNames(
  appliances: unknown,
  agreements: unknown
): string[] {
  if (isApplicationAllBrandsUnrestricted(appliances)) {
    return []
  }

  const appObj = asRecord(appliances)
  const agrObj = asRecord(agreements)

  const candidates: string[] = [
    ...collectStringArray(appObj.carryInBrands),
    ...collectStringArray(appObj.onSiteBrands),
    ...collectStringArray(appObj.brands),
  ]

  if (Array.isArray(agrObj.authorizedBrands)) {
    for (const item of agrObj.authorizedBrands) {
      const rec = asRecord(item)
      if (typeof rec.brand === 'string' && rec.brand.trim()) {
        candidates.push(rec.brand.trim())
      }
    }
  }

  const seenUpper = new Set<string>()
  const unique: string[] = []
  for (const name of candidates) {
    const key = name.toUpperCase()
    if (!seenUpper.has(key)) {
      seenUpper.add(key)
      unique.push(name)
    }
  }
  return unique
}

export function extractCarryInReceiveMethod(coverage: unknown): string {
  const covObj = asRecord(coverage)
  return typeof covObj.carryInReceiveMethod === 'string'
    ? covObj.carryInReceiveMethod.trim()
    : ''
}

export function resolveDeliveryMethodAndChannel(
  receiveMethod: unknown,
  legacyTransport?: unknown
): { deliveryMethod: 'DC' | 'DSD' | 'DC_DSD'; standardChannel: Channel } {
  if (typeof legacyTransport === 'string' && legacyTransport.trim()) {
    const t = legacyTransport.trim().toLowerCase()
    if (t === 'tpl') return { deliveryMethod: 'DC', standardChannel: 'TPL' }
    if (t === 'pickup') return { deliveryMethod: 'DSD', standardChannel: 'DSD' }
    return { deliveryMethod: 'DC', standardChannel: 'DC' }
  }

  const method = typeof receiveMethod === 'string' ? receiveMethod.trim() : ''
  if (method.includes('สาขา') && method.includes('3PL')) {
    return { deliveryMethod: 'DC_DSD', standardChannel: 'DSD' }
  }
  if (method.includes('สาขา')) {
    return { deliveryMethod: 'DSD', standardChannel: 'DSD' }
  }
  if (method.includes('3PL')) {
    return { deliveryMethod: 'DC', standardChannel: 'TPL' }
  }
  return { deliveryMethod: 'DC', standardChannel: 'DC' }
}

export function parseApplicationSlaDays(
  agreements: unknown,
  appliances?: unknown
): number {
  const agrObj = asRecord(agreements)
  const slaObj = asRecord(agrObj.sla)
  if (typeof slaObj.cinSlaDays === 'string') {
    const m = slaObj.cinSlaDays.match(/\d+/)
    if (m) {
      const days = Number(m[0])
      if (days >= 1 && days <= 90) return days
    }
  }

  const appObj = asRecord(appliances)
  if (typeof appObj.defaultSlaDays === 'number' && appObj.defaultSlaDays >= 1 && appObj.defaultSlaDays <= 90) {
    return Math.round(appObj.defaultSlaDays)
  }
  return 7
}

export function resolveApprovedParentCode(
  applicationNo: string,
  agreements: unknown
): string {
  const agrObj = asRecord(agreements)
  const supplierObj = asRecord(agrObj.supplier)
  const profileObj = asRecord(agrObj.companyProfile)
  const rawSpcode =
    typeof supplierObj.spcode === 'string' && supplierObj.spcode.trim()
      ? supplierObj.spcode.trim()
      : typeof profileObj.spcode === 'string'
        ? profileObj.spcode.trim()
        : ''
  if (/^\d{6}$/.test(rawSpcode)) {
    return rawSpcode
  }
  return `VD-${applicationNo.replace('VDA-', '')}`
}

const RESERVED_COVERAGE_KEYS = new Set(['radius', 'routes', 'carryInReceiveMethod'])

export function extractActiveCoverageRoutes(
  coverage: unknown
): Record<string, ActiveCoverageRoute> {
  const covObj = asRecord(coverage)
  const rawMap =
    covObj.routes && typeof covObj.routes === 'object' && !Array.isArray(covObj.routes)
      ? asRecord(covObj.routes)
      : covObj

  const active: Record<string, ActiveCoverageRoute> = {}
  for (const [siteKey, val] of Object.entries(rawMap)) {
    if (RESERVED_COVERAGE_KEYS.has(siteKey)) continue
    const rec = asRecord(val)
    const hasLegacyTransport = typeof rec.transport === 'string' && rec.transport.trim().length > 0
    const isOnsiteActive = rec.onsite === true
    if (!hasLegacyTransport && !isOnsiteActive) continue

    active[siteKey] = {
      respBranchIdx: typeof rec.respBranchIdx === 'number' ? rec.respBranchIdx : 0,
      transport: hasLegacyTransport ? (rec.transport as string) : undefined,
      onsite: isOnsiteActive,
    }
  }
  return active
}
