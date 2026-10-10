// 3PL Shipping Label Data Model & Generator for Case A (Branch -> Vendor)

export interface LabelParty {
  name: string
  phone: string
  address: string
  postalCode?: string
  province?: string
  remark?: string
}

export interface ThreePlLabelData {
  carrierLogoText: string
  serviceType: string
  isCod: boolean
  codAmount: number
  sortCode: string
  pieces: string
  trackingNo: string
  barcodeValue: string
  recipient: Required<LabelParty>
  sender: Required<LabelParty>
  orderNo: string
  date: string
  weightKg: string
  dimensionsCm: string
  qrValue: string
}

/**
 * Format tracking number into readable spaced segments, e.g. "TH 2610 1000 4521 7A"
 */
export function formatTrackingNo(raw: string): string {
  const clean = raw.replace(/\s+/g, '').toUpperCase()
  if (clean.length <= 8) return clean
  // Chunk into 2 chars, 4 chars, 4 chars, 4 chars, 2 chars or similar
  const prefix = clean.slice(0, 2)
  const rest = clean.slice(2)
  const chunks = rest.match(/.{1,4}/g) ?? [rest]
  return [prefix, ...chunks].join(' ')
}

/**
 * Derives a courier hub sort code (e.g. "N12-LPW-03") from postal code and district
 */
export function deriveSortCode(postalCode?: string | null, codeHint?: string | null): string {
  const zip = (postalCode ?? '10310').trim()
  const zone = zip.startsWith('10') ? 'N12' : zip.startsWith('11') ? 'C05' : zip.startsWith('20') ? 'E08' : 'N01'
  const hub = (codeHint ?? 'LPW').replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase() || 'BKK'
  const route = String((Number(zip.slice(-2)) || 3)).padStart(2, '0')
  return `${zone}-${hub}-${route}`
}

/**
 * Estimates weight and dimensions from size category
 */
export function estimatePackageMetrics(sizeCategoryId?: number | string | null): { weight: string; dimensions: string } {
  const s = String(sizeCategoryId ?? '').toLowerCase()
  if (s.includes('1') || s.includes('s')) {
    return { weight: '1.25 kg', dimensions: '30×20×15' }
  }
  if (s.includes('2') || s.includes('m')) {
    return { weight: '3.50 kg', dimensions: '40×30×20' }
  }
  if (s.includes('3') || s.includes('l')) {
    return { weight: '8.00 kg', dimensions: '55×40×35' }
  }
  if (s.includes('4') || s.includes('xl')) {
    return { weight: '15.00 kg', dimensions: '70×50×45' }
  }
  return { weight: '1.25 kg', dimensions: '30×20×15' }
}

/**
 * Formats date into DD/MM/YYYY
 */
export function formatDateBkk(date?: Date | string | null): string {
  const d = date ? new Date(date) : new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export interface BuildLabelInput {
  jobNo: string
  productName: string
  symptom?: string | null
  sizeCategoryId?: number | string | null
  openedAt?: Date | string | null
  branch?: {
    name: string
    phone?: string | null
    address?: string | null
    postalCode?: string | null
    province?: string | null
  } | null
  vendor?: {
    name: string
    centerCode?: string | null
    phone?: string | null
    address?: string | null
    postalCode?: string | null
    province?: string | null
  } | null
  trackingNo?: string | null
}

/**
 * Builds 3PL Shipping Label data for Case A: Branch (ไทวัสดุ) -> Vendor Center (ศูนย์ซ่อม)
 * Non-COD only.
 */
export function buildCaseA3PlLabel(input: BuildLabelInput): ThreePlLabelData {
  const tracking = input.trackingNo || `TPL${Math.floor(100000000 + Math.random() * 900000000)}TH`
  const formattedTracking = formatTrackingNo(tracking)
  const metrics = estimatePackageMetrics(input.sizeCategoryId)

  const destZip = input.vendor?.postalCode || '10540'
  const destProvince = input.vendor?.province || 'สมุทรปราการ'
  const sortCode = deriveSortCode(destZip, input.vendor?.centerCode)

  const senderParty: Required<LabelParty> = {
    name: input.branch?.name || 'ไทวัสดุ สาขาบางนา',
    phone: input.branch?.phone || '02-xxx-5600',
    address: input.branch?.address || 'ต.บางแก้ว อ.บางพลี จ.สมุทรปราการ 10540',
    postalCode: input.branch?.postalCode || '10540',
    province: input.branch?.province || 'สมุทรปราการ',
    remark: 'หากส่งไม่สำเร็จ ตีกลับที่อยู่ผู้ส่ง',
  }

  const recipientParty: Required<LabelParty> = {
    name: input.vendor ? `${input.vendor.name} (${input.vendor.centerCode || 'ศูนย์ซ่อม'})` : 'ศูนย์บริการซ่อมแต่ง',
    phone: input.vendor?.phone || '08x-xxx-4417',
    address: input.vendor?.address || '99/12 ถนนบางนา-ตราด ต.บางเสาธง อ.บางเสาธง สมุทรปราการ',
    postalCode: destZip,
    province: destProvince,
    remark: `พัสดุส่งซ่อม: ${input.productName} — โทรก่อนส่ง / ระวังแตกหัก`,
  }

  return {
    carrierLogoText: '3PL EXPRESS',
    serviceType: 'EXPRESS',
    isCod: false,
    codAmount: 0,
    sortCode,
    pieces: '1/1',
    trackingNo: formattedTracking,
    barcodeValue: tracking,
    recipient: recipientParty,
    sender: senderParty,
    orderNo: input.jobNo,
    date: formatDateBkk(input.openedAt),
    weightKg: metrics.weight,
    dimensionsCm: metrics.dimensions,
    qrValue: tracking,
  }
}
