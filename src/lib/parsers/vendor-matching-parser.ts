import {
  RawVdDataRow,
  RawVendorBrandRow,
  RawSkuPartRow,
  ParsedVendor,
  ParsedBrandMapping,
  ParsedSkuPart,
  VendorParticipationType,
} from './vendor-matching-types'

export const BKK_VICINITY_PROVINCES = new Set([
  'กรุงเทพมหานคร',
  'กรุงเทพฯ',
  'นนทบุรี',
  'ปทุมธานี',
  'สมุทรปราการ',
  'สมุทรสาคร',
  'นครปฐม',
])

export const BKK_ZIP_PREFIXES = ['10', '11', '12', '73', '74']

export function isBkkVicinity(province?: string | null, postalCode?: string | null): boolean {
  if (province && BKK_VICINITY_PROVINCES.has(province.trim())) return true
  if (postalCode) {
    const cleaned = postalCode.trim()
    return BKK_ZIP_PREFIXES.some(prefix => cleaned.startsWith(prefix))
  }
  return false
}

export function resolveBranchChannel(
  dropPoint: string,
  province?: string | null,
  postalCode?: string | null
): 'DC' | 'DSD' | 'TPL' {
  const norm = dropPoint.trim()
  if (norm.includes('กทม.ส่งสาขา') || norm.includes('กทม. ส่งสาขา')) {
    if (isBkkVicinity(province, postalCode)) return 'DSD'
    if (norm.includes('3PL')) return 'TPL'
    return 'DC'
  }
  if (norm === 'Store' || norm === 'ส่งซ่อมที่ศูนย์บริการแบรนด์') return 'DSD'
  if (norm.includes('3PL') && !norm.includes('DC')) return 'TPL'
  return 'DC'
}

export function extractPostalCode(address?: string | null): string | null {
  if (!address) return null
  const m = address.match(/\b(1\d{4}|2\d{4}|3\d{4}|4\d{4}|5\d{4}|6\d{4}|7\d{4}|8\d{4}|9\d{4})\b/)
  return m ? m[1] : null
}

export function cleanBrandNames(rawText?: string | null): string[] {
  if (!rawText) return []
  const brands = new Set<string>()

  const tokens: string[] = []
  let current = ''
  let depth = 0
  for (let i = 0; i < rawText.length; i++) {
    const char = rawText[i]
    if (char === '(') depth++
    else if (char === ')') depth = Math.max(0, depth - 1)

    if (char === ',' && depth === 0) {
      if (current.trim()) tokens.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) tokens.push(current.trim())

  for (const item of tokens) {
    const parenMatch = item.match(/^([^(]+)(?:\(([^)]+)\))?$/)
    if (parenMatch) {
      const main = parenMatch[1].trim()
      if (main && main !== '-') brands.add(main)
      if (parenMatch[2]) {
        parenMatch[2]
          .split(',')
          .map(s => s.trim())
          .filter(s => s && s !== '-')
          .forEach(b => brands.add(b))
      }
    } else {
      const clean = item.trim()
      if (clean && clean !== '-') brands.add(clean)
    }
  }
  return Array.from(brands)
}

function parseSlaDays(val?: number | string | null, fallback = 7): number {
  if (val == null || val === '' || val === '-') return fallback
  const num = typeof val === 'number' ? val : parseFloat(String(val).trim())
  return Number.isNaN(num) || num <= 0 ? fallback : Math.round(num)
}

export function parseVendorDataRows(rows: RawVdDataRow[]): ParsedVendor[] {
  const result: ParsedVendor[] = []

  for (const r of rows) {
    const rawId = r['Vendor ID']
    if (rawId == null || rawId === '' || rawId === '-') continue
    const vendorId = String(rawId).trim()
    const name = String(r['vendor name'] || '').trim()
    if (!vendorId || !name) continue

    const typeStr = String(r.Type || '')
    let participationType: VendorParticipationType = 'NON_PARTICIPATING'
    if (typeStr.includes('เข้าร่วมและเคย')) participationType = 'PARTICIPATING_WITH_HISTORY'
    else if (typeStr.includes('เข้าร่วมแต่ไม่เคย')) participationType = 'PARTICIPATING_NO_HISTORY'

    const active = participationType !== 'NON_PARTICIPATING'
    const isBrandAuthorized = active
    const dropPoint = String(r['จุดรับสินค้า'] || '-').trim()
    const rawAddr = String(r.Address || '').trim()
    const address = rawAddr === '-' || !rawAddr ? null : rawAddr
    const postalCode = extractPostalCode(address)
    const slaDays = parseSlaDays(r['ON AVG (วัน)'], 7)
    const leadTimesRaw = String(r['ระยะเวลาโดยรวม (รับ/ประเมิน/ซ่อม/ส่งกลับ)\r\nณ จุดรับสินค้า (วัน) / ประเมินราคาซ่อม / ระยะเวลาดำเนินการซ่อม / ระยะเวลาส่งสินค้ากลับ'] || '').trim() || null
    const brands = cleanBrandNames(String(r['Brand ในสังกัด'] || ''))

    let deliveryMethod = 'DC'
    if (dropPoint.includes('กทม.ส่งสาขา') || dropPoint.includes('กทม. ส่งสาขา') || dropPoint.includes('DC / ส่ง 3PL')) {
      deliveryMethod = 'DC_DSD'
    } else if (dropPoint.includes('Store') || dropPoint.includes('ศูนย์บริการแบรนด์')) {
      deliveryMethod = 'DSD'
    } else if (dropPoint.includes('3PL')) {
      deliveryMethod = 'TPL'
    }

    result.push({
      vendorId,
      name,
      participationType,
      active,
      isBrandAuthorized,
      dropPoint,
      address,
      postalCode,
      deliveryMethod,
      slaDays,
      leadTimesRaw,
      brands,
    })
  }

  return result
}

export function parseVendorBrandRows(rows: RawVendorBrandRow[]): ParsedBrandMapping[] {
  const result: ParsedBrandMapping[] = []

  for (const r of rows) {
    const rawId = r['รหัส VD']
    if (rawId == null || rawId === '' || rawId === '-') continue
    const vendorId = String(rawId).trim()
    const vendorName = String(r['ชื่อ Vendor'] || '').trim()
    const rawBrands = String(r['รายชื่อ Brand ที่รับผิดชอบ'] || '')
    const brandNames = cleanBrandNames(rawBrands)

    if (vendorId && brandNames.length > 0) {
      result.push({ vendorId, vendorName, brandNames })
    }
  }

  return result
}

export function parseSkuPartRows(rows: RawSkuPartRow[]): ParsedSkuPart[] {
  const result: ParsedSkuPart[] = []

  for (const r of rows) {
    const rawSku = r.SKU_Number
    const rawVd = r['รหัส VD']
    if (rawSku == null || rawVd == null) continue

    const sku = String(rawSku).trim()
    const vendorNo = String(rawVd).trim()
    if (!sku || !vendorNo) continue

    result.push({
      sku,
      productName: String(r['ชื่อสินค้า'] || '').trim(),
      brand: String(r.Brand || '').trim(),
      vendorNo,
      vendorName: String(r['ชื่อ VD'] || '').trim(),
      className: r.ClassName ? String(r.ClassName).trim() : undefined,
      sclassName: r.SClassname ? String(r.SClassname).trim() : undefined,
    })
  }

  return result
}
