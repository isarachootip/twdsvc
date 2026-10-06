export const ADMIN_SECTION_IDS = [
  'vendor',
  'fee',
  'branch',
  'zone',
  'sla',
  'role',
  'sku',
  'payout',
  'tradein',
  'dashboard',
  'general',
  'pending',
  'products',
  'integrations',
] as const

export interface AdminNavItem {
  id: string
  name: string
  title: string
  sub: string
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { id: 'vendor', name: 'Vendor Portal', title: 'Vendor Portal', sub: 'VD หลัก, ศูนย์บริการย่อย, แบรนด์/ขนาดที่รับผิดชอบ, โซน' },
  { id: 'fee', name: 'ค่าดำเนินการ / ค่าขนส่ง', title: 'ตั้งค่าค่าดำเนินการและค่าขนส่ง 3PL', sub: 'กำหนดค่าธรรมเนียมแยกตามประเภทสินค้า' },
  { id: 'branch', name: 'สาขาไทวัสดุ', title: 'Maintain รายชื่อสาขา', sub: 'ผูกชื่อสาขากับผู้จัดการเขต (District Manager)' },
  { id: 'zone', name: 'จับคู่สาขา - VD', title: 'จับคู่สาขากับศูนย์บริการ VD', sub: 'ใช้กำหนดว่า Book 3PL / ส่งซ่อมให้ไปศูนย์ VD ใด' },
  { id: 'sla', name: 'SLA', title: 'ตั้งค่า SLA การทำงาน', sub: 'กำหนดระยะเวลามาตรฐานของแต่ละขั้นตอน ตั้งแต่เปิดงานถึงปิดงาน' },
  { id: 'role', name: 'สิทธิ์ผู้ใช้งาน', title: 'กำหนดสิทธิ์ผู้ใช้งาน (Role)', sub: 'Admin, Executive, CS, GR, DC, VD, S2' },
  { id: 'sku', name: 'SKU ค่าซ่อม', title: 'ตั้งค่า SKU ค่าซ่อม', sub: 'SKU กลางที่ใช้ร่วมกันทุก VD' },
  { id: 'payout', name: 'รอบจ่ายเงิน Vendor', title: 'ตั้งค่ารอบจ่ายเงิน Vendor', sub: 'กำหนดรอบบิลและเงื่อนไขหักเงิน' },
  { id: 'tradein', name: 'Trade-in / คูปอง', title: 'ตั้งค่า Trade-in และโปรโมชั่นคูปอง', sub: 'กำหนด % ส่วนลด แยกประเภทและช่วงเวลาโปรโมชั่น' },
  { id: 'dashboard', name: 'Dashboard', title: 'ตั้งค่าการแสดงผล Dashboard', sub: 'เลือกรายการสรุปที่แสดง และสิทธิ์เห็นข้อมูลต้นทุน' },
  { id: 'general', name: 'ตั้งค่าทั่วไป', title: 'ตั้งค่าทั่วไป', sub: 'VAT, อายุลิงก์ใบเสนอราคา, ค่า 3PL ขากลับ, อายุคูปอง, เกณฑ์ SLA VD' },
  { id: 'pending', name: 'รอกำหนดศูนย์ซ่อม', title: 'รอกำหนดศูนย์ซ่อม', sub: 'คิวงานที่ระบบหาศูนย์ซ่อมไม่ได้ (PENDING_VENDOR_ASSIGNMENT)' },
  { id: 'products', name: 'Product Master', title: 'Product Master (ข้อมูลสินค้า 302,475 SKU)', sub: 'ค้นหาและจัดการสินค้า Brand, Category, Barcode, ราคา และดูข้อมูลครบ 32 Fields' },
  { id: 'integrations', name: 'เชื่อมต่อระบบ (LINE / อีเมล)', title: 'เชื่อมต่อระบบ (Integrations)', sub: 'ตั้งค่า LINE Official Account, SMTP และ Base URL พร้อมปุ่มทดสอบการเชื่อมต่อ' },
]

/** Admin sidebar links that open standalone pages (not tabs rendered by AdminClient). */
export interface AdminExtraLink {
  href: string
  name: string
}

export const ADMIN_EXTRA_LINKS: AdminExtraLink[] = [
  { href: '/admin/vendors/applications', name: 'ตรวจรับใบสมัครคู่ค้า' },
]

export const SECTION_ALIAS: Record<string, string> = {
  '1': 'vendor',
  '2': 'fee',
  '3': 'branch',
  '4': 'zone',
  '5': 'sla',
  '6': 'role',
  '7': 'sku',
  '8': 'payout',
  '9': 'tradein',
  '10': 'dashboard',
  '11': 'general',
  '12': 'pending',
  '13': 'products',
  'product': 'products',
  'products': 'products',
  'commodities': 'products',
  'commodity': 'products',
  'Product': 'products',
  'Products': 'products',
  // Named and slug aliases
  'vendors': 'vendor',
  'Vendors': 'vendor',
  'feerates': 'fee',
  'FeeRates': 'fee',
  'fee-rates': 'fee',
  'fees': 'fee',
  'branches': 'branch',
  'Branches': 'branch',
  'routing': 'zone',
  'Routing': 'zone',
  'routes': 'zone',
  'SLA': 'sla',
  'permissions': 'role',
  'Permissions': 'role',
  'roles': 'role',
  'repairsku': 'sku',
  'RepairSKU': 'sku',
  'repair-sku': 'sku',
  'skus': 'sku',
  'payoutcycles': 'payout',
  'PayoutCycles': 'payout',
  'payout-cycles': 'payout',
  'promotions': 'tradein',
  'Promotions': 'tradein',
  'dashboardwidgets': 'dashboard',
  'DashboardWidgets': 'dashboard',
  'dashboard-widgets': 'dashboard',
  'generalsettings': 'general',
  'GeneralSettings': 'general',
  'general-settings': 'general',
  'pendingvendorqueue': 'pending',
  'PendingVendorQueue': 'pending',
  'pending-vendor-queue': 'pending',
  'pending-vendor': 'pending',
}

export const VALID_SECTIONS = new Set<string>([
  ...ADMIN_SECTION_IDS,
  ...Object.keys(SECTION_ALIAS),
])
