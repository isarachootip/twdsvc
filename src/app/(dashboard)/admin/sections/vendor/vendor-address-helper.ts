export interface StructuredAddressParts {
  houseNo?: string
  subdistrict?: string
  district?: string
  province?: string
  postalCode?: string
}

export function formatStructuredAddress(parts: StructuredAddressParts): string {
  const h = (parts.houseNo || '').trim()
  const sd = (parts.subdistrict || '').trim()
  const d = (parts.district || '').trim()
  const p = (parts.province || '').trim()
  const zip = (parts.postalCode || '').trim()

  const items = [
    h,
    sd ? (sd.startsWith('ต.') || sd.startsWith('แขวง') ? sd : `ต.${sd}`) : '',
    d ? (d.startsWith('อ.') || d.startsWith('เขต') ? d : `อ.${d}`) : '',
    p ? (p.startsWith('จ.') || p.includes('กรุงเทพ') ? p : `จ.${p}`) : '',
    zip,
  ].filter(Boolean)

  return items.join(' ')
}

export function extractPostalCode(address: string): string | null {
  if (!address) return null
  const match = address.match(/\b(\d{5})\b/)
  return match ? match[1] : null
}

export function matchSiteByPostalCode<T extends { postalCode?: string }>(
  postalCode: string,
  sites: T[]
): T | null {
  const cleanZip = (postalCode || '').trim()
  if (cleanZip.length !== 5) return null

  // 1. Exact 5-digit match
  const exact = sites.find(s => s.postalCode && s.postalCode.trim() === cleanZip)
  if (exact) return exact

  // 2. Provincial 2-digit prefix match (e.g. 10xxx matches 10260)
  const prefix = cleanZip.slice(0, 2)
  const fallback = sites.find(
    s => s.postalCode && s.postalCode.trim().slice(0, 2) === prefix
  )
  return fallback || null
}
