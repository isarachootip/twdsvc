import { prisma } from './db'

// SystemSetting keys (key → default value as string)
export const SETTING_DEFAULTS: Record<string, string> = {
  VAT_RATE: '0.07',
  QUOTE_EXPIRY_DAYS: '7',
  TRADEIN_COUPON_VALID_DAYS: '30',
  VENDOR_SLA_THRESHOLD: '85',
  CHARGE_3PL_RETURN_FEE: 'false',
  CS_CANCEL_POLICY: 'BEFORE_GR', // BEFORE_GR (เฉพาะ CS_OPENED/PENDING_VENDOR_ASSIGNMENT) หรือ BEFORE_CARRIER (รวม GR_RECEIVED/GR_PACKED)
  SLA_TIER_MULTIPLIERS: JSON.stringify({ enabled: false, NORMAL: 1.0, EXPRESS: 0.5, VIP: 0.3 }),
  DEMO_MODE: 'true', // แสดงปุ่มจำลอง (3PL webhook / ลูกค้ากด LON / ชำระเงิน) เมื่อยังไม่เชื่อม integration จริง
  REQUIRE_PHOTOS: 'true',
  PUBLIC_BASE_URL: '',
  // JSON settings
  REPAIR_SKUS: JSON.stringify([
    { sku: 'SVC-REPAIR-001', description: 'ค่าซ่อมสินค้า (รวม VAT)', chargeType: 'REPAIR' },
    { sku: 'SVC-OPENFEE-001', description: 'ค่าเปิดเครื่องตรวจเช็ค', chargeType: 'INSPECTION_FEE' },
    { sku: 'SVC-OPFEE-001', description: 'ค่าดำเนินการ', chargeType: 'OPERATION_FEE' },
    { sku: 'SVC-SHIP-001', description: 'ค่าขนส่ง 3PL', chargeType: 'SHIPPING_FEE' },
  ]),
  DASHBOARD_WIDGETS: JSON.stringify([
    { key: 'open_jobs', label: 'จำนวนงานเปิดอยู่', enabled: true },
    { key: 'sla_overdue', label: 'งานเกิน SLA', enabled: true },
    { key: 'approval_rate', label: 'อัตราลูกค้าอนุมัติซ่อม', enabled: true },
    { key: 'tat', label: 'รอบเวลาเฉลี่ยต่องาน', enabled: true },
    { key: 'revenue', label: 'รายได้เดือนนี้', enabled: true },
    { key: 'vendor_payable', label: 'ยอดค้างจ่าย Vendor', enabled: true },
    { key: 'trend', label: 'กราฟเทียบวัน/เดือน/ปี', enabled: true },
  ]),
  COST_VIEW_ROLES: JSON.stringify(['ADMIN', 'EXECUTIVE']),
  DISTRICT_MANAGERS: JSON.stringify({}), // siteId → ชื่อผู้จัดการเขต
  VENDOR_SIZES: JSON.stringify({}), // vendorParentId → sizeCategoryId[]
  VENDOR_DEDUCTIONS: JSON.stringify([]), // [{id, vendorParentId, jobNo?, amount, reason, createdAt, usedInBatch?}]
  // Branding & Document Configuration
  COMPANY_LOGO_URL: '/images/thaiwatsadu-logo.png',
  COMPANY_NAME: 'บริษัท ซีอาร์ซี ไทวัสดุ จำกัด',
  COMPANY_TAX_ID: '0105555021215',
  DOCUMENT_FOOTER_NOTE: JSON.stringify([
    'โปรดเก็บเอกสารเพื่อเป็นหลักฐานในการตรวจสอบรายละเอียดการซ่อมสินค้า',
    'บริษัทขอสงวนสิทธิ์ เรียกเก็บค่าใช้จ่ายที่เกิดขึ้นตามจริง หากสินค้าไม่ได้อยู่ในการรับประกัน',
    'บริษัทขอสงวนสิทธิ์ในการรับฝากสินค้าซ่อมไม่เกิน 14 วันนับจากวันที่สินค้าซ่อมเสร็จ',
    'กำหนดระยะเวลาส่งซ่อมโดยประมาณ ไม่เกิน 30 วัน',
    'บริษัทฯ รับประกันหลังการซ่อม ภายใน 30 วัน (เงื่อนไขเป็นไปตามข้อกำหนดของ Supplier)',
  ]),
}

export async function getSettings(keys?: string[]): Promise<Record<string, string>> {
  const rows = (await prisma.systemSetting.findMany(keys ? { where: { key: { in: keys } } } : undefined)).filter(
    r => !r.key.startsWith('INTEGRATION_')
  )
  const out: Record<string, string> = {}
  for (const k of keys ?? Object.keys(SETTING_DEFAULTS)) out[k] = SETTING_DEFAULTS[k] ?? ''
  for (const r of rows) out[r.key] = r.value
  return out
}

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.systemSetting.findUnique({ where: { key } })
  return row?.value ?? SETTING_DEFAULTS[key] ?? ''
}

export async function getJsonSetting<T>(key: string): Promise<T> {
  const v = await getSetting(key)
  try {
    return JSON.parse(v) as T
  } catch {
    return JSON.parse(SETTING_DEFAULTS[key] ?? 'null') as T
  }
}

export async function setSetting(key: string, value: string) {
  await prisma.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value } })
}

export async function getNumberSetting(key: string): Promise<number> {
  const n = Number(await getSetting(key))
  return Number.isFinite(n) ? n : Number(SETTING_DEFAULTS[key] ?? 0)
}

export async function canViewCost(role: string): Promise<boolean> {
  const roles = await getJsonSetting<string[]>('COST_VIEW_ROLES')
  return roles.includes(role)
}

export function publicBaseUrl(req?: Request): string {
  const env = process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL
  if (env) return env.replace(/\/$/, '')
  if (req) {
    const h = req.headers
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'http'
    if (host) return `${proto}://${host}`
  }
  return ''
}

export interface BrandingSettings {
  logoUrl: string
  companyName: string
  taxId: string
  footerNotes: string[]
}

export async function getBrandingSettings(): Promise<BrandingSettings> {
  const rows = await getSettings([
    'COMPANY_LOGO_URL',
    'COMPANY_NAME',
    'COMPANY_TAX_ID',
    'DOCUMENT_FOOTER_NOTE',
  ])
  let footerNotes: string[] = []
  try {
    const raw = rows.DOCUMENT_FOOTER_NOTE || SETTING_DEFAULTS.DOCUMENT_FOOTER_NOTE
    footerNotes = JSON.parse(raw)
    if (!Array.isArray(footerNotes)) footerNotes = []
  } catch {
    footerNotes = []
  }
  return {
    logoUrl: rows.COMPANY_LOGO_URL || SETTING_DEFAULTS.COMPANY_LOGO_URL,
    companyName: rows.COMPANY_NAME || SETTING_DEFAULTS.COMPANY_NAME,
    taxId: rows.COMPANY_TAX_ID || SETTING_DEFAULTS.COMPANY_TAX_ID,
    footerNotes,
  }
}

