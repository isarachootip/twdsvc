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
