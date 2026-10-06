import { prisma } from './db'

// SystemSetting keys (key → default value as string)
export const SETTING_DEFAULTS: Record<string, string> = {
  VAT_RATE: '0.07',
  QUOTE_EXPIRY_DAYS: '7',
  TRADEIN_COUPON_VALID_DAYS: '30',
  VENDOR_SLA_THRESHOLD: '85',
  CHARGE_3PL_RETURN_FEE: 'false',
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
