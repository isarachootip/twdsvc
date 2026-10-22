import rawData from '../data/thai-address-data.json'

export interface ThaiAddressItem {
  subdistrict: string
  district: string
  province: string
  postalCode: string
}

interface NormalizedRow extends ThaiAddressItem {
  id: number
  kt: string // folded subdistrict
  ka: string // folded district
  kp: string // folded province
}

const BKK = 'กรุงเทพมหานคร'
const ALIASES: Record<string, string> = {
  กทม: BKK, 'กทม.': BKK, bangkok: BKK, bkk: BKK, กรุงเทพ: BKK,
  โคราช: 'นครราชสีมา', korat: 'นครราชสีมา',
  อยุธยา: 'พระนครศรีอยุธยา', ปากน้ำ: 'สมุทรปราการ',
}
const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙'

function clean(s: string): string {
  return String(s ?? '')
    .normalize('NFC')
    .replace(/[​-‍﻿]/g, '')
    .replace(/[๐-๙]/g, c => String(THAI_DIGITS.indexOf(c)))
    .replace(/\s+/g, ' ')
    .trim()
}

function fold(s: string): string {
  return clean(s).toLowerCase().replace(/ฯ/g, '').replace(/ฏ/g, 'ฎ')
}

function stripPrefix(name: string): string {
  return clean(name).replace(/^(จังหวัด|จ\.|ตำบล|แขวง|ต\.|อำเภอ|เขต|อ\.)\s*/, '')
}

let cachedRows: NormalizedRow[] | null = null

function getRows(): NormalizedRow[] {
  if (cachedRows) return cachedRows
  const { p: P, d: D, r: R } = rawData as unknown as {
    p: string[]
    d: [string, number][]
    r: [string, number, string][]
  }
  const rows: NormalizedRow[] = []

  for (let i = 0; i < R.length; i++) {
    const item = R[i]
    const dItem = D[item[1]]
    if (!dItem) continue
    const prov = stripPrefix(P[dItem[1]] || '')
    const dist = stripPrefix(dItem[0] || '')
    const sub = stripPrefix(item[0] || '')
    const zip = clean(item[2])
    if (!prov || !dist || !sub || !zip) continue

    rows.push({
      id: i,
      subdistrict: sub,
      district: dist,
      province: prov,
      postalCode: zip,
      kt: fold(sub),
      ka: fold(dist),
      kp: fold(prov),
    })
  }

  cachedRows = rows
  return rows
}

/** Search Thai address by query (subdistrict, district, province, or postal code) */
export function searchThaiAddress(query: string, maxResults = 25): ThaiAddressItem[] {
  const q = clean(query)
  if (!q || q.length < 2) return []

  const rows = getRows()
  const isZip = /^\d+$/.test(q)
  const qFold = fold(ALIASES[q.toLowerCase()] || q)

  const matched: Array<{ item: ThaiAddressItem; score: number; id: number }> = []

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    let score = 0

    if (isZip) {
      if (r.postalCode.startsWith(q)) {
        score = r.postalCode === q ? 100 : 70
      }
    } else {
      if (r.kt === qFold) score += 90
      else if (r.kt.startsWith(qFold)) score += 60
      else if (r.kt.includes(qFold)) score += 30

      if (r.ka === qFold) score += 70
      else if (r.ka.startsWith(qFold)) score += 40
      else if (r.ka.includes(qFold)) score += 20

      if (r.kp === qFold) score += 50
      else if (r.kp.startsWith(qFold)) score += 30
      else if (r.kp.includes(qFold)) score += 10
    }

    if (score > 0) {
      matched.push({
        item: {
          subdistrict: r.subdistrict,
          district: r.district,
          province: r.province,
          postalCode: r.postalCode,
        },
        score,
        id: r.id,
      })
    }
  }

  matched.sort((a, b) => b.score - a.score || a.id - b.id)
  return matched.slice(0, maxResults).map(m => m.item)
}
