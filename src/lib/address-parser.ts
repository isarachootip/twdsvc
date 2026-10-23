export interface ParsedAddress {
  zip: string
  province: string
  district: string
  subdistrict: string
  street: string
}

export function splitCustomerFullName(fullName: string | null | undefined): {
  firstName: string
  lastName: string
} {
  const clean = (fullName ?? '').trim()
  if (!clean) {
    return { firstName: '', lastName: '' }
  }
  const parts = clean.split(/\s+/)
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  }
}

export function parseFormattedAddress(
  rawAddress: string | null | undefined,
  rawZip?: string | null
): ParsedAddress {
  const cleanRaw = (rawAddress ?? '').trim()
  const cleanZipParam = (rawZip ?? '').replace(/\D/g, '').slice(0, 5)

  if (!cleanRaw && !cleanZipParam) {
    return { zip: '', province: '', district: '', subdistrict: '', street: '' }
  }

  let text = cleanRaw
  let zip = cleanZipParam

  const trailingZipMatch = text.match(/(?:^|\s)(\d{5})\s*$/)
  if (trailingZipMatch) {
    if (!zip) {
      zip = trailingZipMatch[1]
    }
    text = text.slice(0, trailingZipMatch.index).trim()
  }

  const structuredRegex =
    /^(?:(.*?)\s+)?(?:แขวง\/ตำบล\s+|ตำบล\s*|แขวง\s*|ต\.)([^\s]+)\s+(?:เขต\/อำเภอ\s+|อำเภอ\s*|เขต\s*|อ\.)([^\s]+)(?:\s+(?:จังหวัด\s*|จ\.)?(.+))?$/

  const match = text.match(structuredRegex)
  if (match) {
    return {
      street: (match[1] ?? '').trim(),
      subdistrict: (match[2] ?? '').trim(),
      district: (match[3] ?? '').trim(),
      province: (match[4] ?? '').trim(),
      zip,
    }
  }

  return {
    street: text,
    subdistrict: '',
    district: '',
    province: '',
    zip,
  }
}
