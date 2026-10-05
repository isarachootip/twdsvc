export interface ParsedThaiAddress {
  province: string
  district: string | null
  subdistrict: string | null
  postalCode: string | null
}

export interface StoreInputRecord {
  code: string
  stCode: string | null
  name: string
  nameEn: string | null
  nickname: string
  legalName: string | null
  type: 'BRANCH' | 'DC'
  province: string
  district: string | null
  subdistrict: string | null
  postalCode: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  googleMapsUrl: string | null
  phone: string | null
  openingHours: string | null
  rcvOpeningHours: string | null
  storeGroup: string | null
  rom: string | null
  districtManager: string | null
  groupEmail: string | null
  active: boolean
}

export function parseThaiAddress(rawAddress?: string | null): ParsedThaiAddress {
  if (!rawAddress) {
    return { province: 'กรุงเทพมหานคร', district: null, subdistrict: null, postalCode: null }
  }

  const addr = rawAddress.trim()

  // Postal Code (5 digits)
  const postalMatch = addr.match(/\b(\d{5})\b/)
  const postalCode = postalMatch ? postalMatch[1] : null

  // Province
  let province = 'กรุงเทพมหานคร'
  if (/กรุงเทพ|กทม/i.test(addr)) {
    province = 'กรุงเทพมหานคร'
  } else {
    const provMatch = addr.match(/(?:จังหวัด|จ\.)\s*([^\s,]+)/)
    if (provMatch) {
      province = provMatch[1].trim()
    }
  }

  // District / Khet
  const distMatch = addr.match(/(?:อำเภอ|อ\.|เขต)\s*([^\s,]+)/)
  const district = distMatch ? distMatch[1].trim() : null

  // Subdistrict / Khwaeng
  const subMatch = addr.match(/(?:ตำบล|ต\.|แขวง)\s*([^\s,]+)/)
  const subdistrict = subMatch ? subMatch[1].trim() : null

  return { province, district, subdistrict, postalCode }
}

export function formatBranchName(rawName?: string | null): string {
  if (!rawName) return ''
  const trimmed = rawName.trim()
  return trimmed.startsWith('สาขา') ? trimmed : `สาขา${trimmed}`
}

function parseCoordinate(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const num = typeof val === 'number' ? val : parseFloat(String(val))
  return isNaN(num) ? null : num
}

function formatHours(open?: unknown, close?: unknown): string | null {
  const o = open ? String(open).trim() : ''
  const c = close ? String(close).trim() : ''
  if (!o && !c) return null
  if (o && c) return `${o} - ${c}`
  return o || c
}

export function parseStoreRecord(row1: Record<string, unknown>, row2?: Record<string, unknown>): StoreInputRecord {
  const code = String(row1.STORE ?? row1.code ?? '').trim()
  const stCode = row1.STCODE ? String(row1.STCODE).trim() : null
  const sname1 = row1.Sname_1 ? String(row1.Sname_1).trim() : null
  const nickname = sname1 || (row1.nickname ? String(row1.nickname).trim() : code)

  const rawNameTH = row1.SnameTH ? String(row1.SnameTH) : String(row1.name ?? '')
  const name = formatBranchName(rawNameTH)
  const nameEn = row1.SName ? String(row1.SName).trim() : null
  const legalName = row1.STTNAME ? String(row1.STTNAME).trim() : null

  const address = row1.THADDRESS ? String(row1.THADDRESS).trim() : (row1.address ? String(row1.address).trim() : null)
  const parsedAddr = parseThaiAddress(address)

  const lat = parseCoordinate(row1.Lat ?? row1.latitude)
  const lng = parseCoordinate(row1.lng ?? row1.longitude)
  const googleMapsUrl = lat !== null && lng !== null ? `https://maps.google.com/?q=${lat},${lng}` : null

  const phone = row1.STTEL ? String(row1.STTEL).trim() : (row1.phone ? String(row1.phone).trim() : '1308')
  const openingHours = formatHours(row1.Opentime, row1.CloseTime)

  const rcvOpen = row2?.RCVOpentime ?? row1.RCVOpentime
  const rcvClose = row2?.RCVCloseTime ?? row1.RCVCloseTime
  const rcvOpeningHours = formatHours(rcvOpen, rcvClose)

  const storeGroup = row1.STOREGROUP ? String(row1.STOREGROUP).trim() : null
  const rom = row1.ROM ? String(row1.ROM).trim() : null
  const districtManager = row1.District ? String(row1.District).trim() : null
  const groupEmail = row1.Group_Email ? String(row1.Group_Email).trim() : null

  return {
    code,
    stCode,
    name,
    nameEn,
    nickname,
    legalName,
    type: code.startsWith('DC') ? 'DC' : 'BRANCH',
    province: parsedAddr.province,
    district: parsedAddr.district,
    subdistrict: parsedAddr.subdistrict,
    postalCode: parsedAddr.postalCode,
    address,
    latitude: lat,
    longitude: lng,
    googleMapsUrl,
    phone,
    openingHours,
    rcvOpeningHours,
    storeGroup,
    rom,
    districtManager,
    groupEmail,
    active: true,
  }
}

export function mergeStoreSheets(
  sheet1Rows: Record<string, unknown>[],
  sheet2Rows: Record<string, unknown>[]
): StoreInputRecord[] {
  const sheet2Map = new Map<string, Record<string, unknown>>()
  for (const r of sheet2Rows) {
    const code = String(r.STORE ?? '').trim()
    if (code) sheet2Map.set(code, r)
  }

  return sheet1Rows
    .filter(r => r.STORE && String(r.STORE).trim() !== '')
    .map(r1 => {
      const code = String(r1.STORE).trim()
      const r2 = sheet2Map.get(code)
      return parseStoreRecord(r1, r2)
    })
}
