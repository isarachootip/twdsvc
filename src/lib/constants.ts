// Shared constants — stage labels, badges, pipeline groups (04_workflow_state_machine.md §1)
// ใช้ได้ทั้งฝั่ง server และ client (ห้าม import prisma ในไฟล์นี้)

export type Stage =
  | 'PENDING_VENDOR_ASSIGNMENT' | 'CS_OPENED' | 'GR_RECEIVED' | 'GR_PACKED'
  | 'OUTBOUND_TO_DC' | 'AT_DC_OUTBOUND' | 'OUTBOUND_TO_VD' | 'VD_INSPECTING'
  | 'WAITING_APPROVAL' | 'REPAIRING' | 'RETURN_PACKING' | 'INBOUND_TO_DC'
  | 'AT_DC_INBOUND' | 'INBOUND_TO_BRANCH' | 'GR_RETURN_RECEIVED' | 'READY_FOR_PICKUP'
  | 'CLOSED_REPAIRED' | 'CLOSED_NOT_REPAIRED' | 'CANCELLED'

export const STAGE_ORDER: Stage[] = [
  'PENDING_VENDOR_ASSIGNMENT', 'CS_OPENED', 'GR_RECEIVED', 'GR_PACKED', 'OUTBOUND_TO_DC', 'AT_DC_OUTBOUND',
  'OUTBOUND_TO_VD', 'VD_INSPECTING', 'WAITING_APPROVAL', 'REPAIRING', 'RETURN_PACKING', 'INBOUND_TO_DC',
  'AT_DC_INBOUND', 'INBOUND_TO_BRANCH', 'GR_RETURN_RECEIVED', 'READY_FOR_PICKUP', 'CLOSED_REPAIRED',
  'CLOSED_NOT_REPAIRED', 'CANCELLED',
]

export const STAGE_LABELS: Record<Stage, string> = {
  PENDING_VENDOR_ASSIGNMENT: 'รอกำหนดศูนย์ซ่อม',
  CS_OPENED: 'รอส่งมอบ GR',
  GR_RECEIVED: 'GR กำลัง Pack',
  GR_PACKED: 'รอขนส่งเข้ารับ',
  OUTBOUND_TO_DC: 'ระหว่างขนส่งไป DC',
  AT_DC_OUTBOUND: 'อยู่ที่ DC รอ VD รับ',
  OUTBOUND_TO_VD: 'ระหว่างขนส่งไป VD',
  VD_INSPECTING: 'VD ตรวจสอบ',
  WAITING_APPROVAL: 'รอลูกค้าอนุมัติ',
  REPAIRING: 'กำลังซ่อม',
  RETURN_PACKING: 'รอ Pack ส่งคืน',
  INBOUND_TO_DC: 'ระหว่างส่งคืน (ไป DC)',
  AT_DC_INBOUND: 'อยู่ที่ DC รอส่งสาขา',
  INBOUND_TO_BRANCH: 'ระหว่างขนส่งคืน',
  GR_RETURN_RECEIVED: 'รอส่งมอบ CS',
  READY_FOR_PICKUP: 'พร้อมรับที่สาขา',
  CLOSED_REPAIRED: 'ปิดงาน (ซ่อมสำเร็จ)',
  CLOSED_NOT_REPAIRED: 'ปิดงาน (ไม่ซ่อม)',
  CANCELLED: 'ยกเลิก',
}

export const STAGE_BADGE: Record<Stage, string> = {
  PENDING_VENDOR_ASSIGNMENT: 'b-amber',
  CS_OPENED: 'b-gray',
  GR_RECEIVED: 'b-gray',
  GR_PACKED: 'b-gray',
  OUTBOUND_TO_DC: 'b-blue',
  AT_DC_OUTBOUND: 'b-blue',
  OUTBOUND_TO_VD: 'b-blue',
  VD_INSPECTING: 'b-blue',
  WAITING_APPROVAL: 'b-amber',
  REPAIRING: 'b-blue',
  RETURN_PACKING: 'b-blue',
  INBOUND_TO_DC: 'b-blue',
  AT_DC_INBOUND: 'b-blue',
  INBOUND_TO_BRANCH: 'b-blue',
  GR_RETURN_RECEIVED: 'b-amber',
  READY_FOR_PICKUP: 'b-amber',
  CLOSED_REPAIRED: 'b-green',
  CLOSED_NOT_REPAIRED: 'b-coral',
  CANCELLED: 'b-gray',
}

export type PipelineGroup = 'INTAKE' | 'WAITING_APPROVAL' | 'REPAIR_IN_PROGRESS' | 'QA_LOGISTICS' | 'READY_FOR_PICKUP' | 'CLOSED'

export const STAGE_PIPELINE: Record<Stage, PipelineGroup> = {
  PENDING_VENDOR_ASSIGNMENT: 'INTAKE',
  CS_OPENED: 'INTAKE',
  GR_RECEIVED: 'INTAKE',
  GR_PACKED: 'INTAKE',
  OUTBOUND_TO_DC: 'INTAKE',
  AT_DC_OUTBOUND: 'INTAKE',
  OUTBOUND_TO_VD: 'INTAKE',
  VD_INSPECTING: 'INTAKE',
  WAITING_APPROVAL: 'WAITING_APPROVAL',
  REPAIRING: 'REPAIR_IN_PROGRESS',
  RETURN_PACKING: 'QA_LOGISTICS',
  INBOUND_TO_DC: 'QA_LOGISTICS',
  AT_DC_INBOUND: 'QA_LOGISTICS',
  INBOUND_TO_BRANCH: 'QA_LOGISTICS',
  GR_RETURN_RECEIVED: 'QA_LOGISTICS',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  CLOSED_REPAIRED: 'CLOSED',
  CLOSED_NOT_REPAIRED: 'CLOSED',
  CANCELLED: 'CLOSED',
}

export const CLOSED_STAGES: Stage[] = ['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED', 'CANCELLED']

export const CHANNEL_LABELS: Record<string, string> = { DC: 'DC', DSD: 'DSD', TPL: '3PL' }

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', EXECUTIVE: 'Executive', CS: 'CS', GR: 'GR', DC: 'DC', VD: 'VD (ช่าง)', S2: 'S2',
}

export const ROLE_HOME: Record<string, string> = {
  ADMIN: '/exec', EXECUTIVE: '/exec', CS: '/cs', GR: '/gr', DC: '/dc', VD: '/vd', S2: '/s2',
}

export const MENU_DEFS: Array<{ key: string; label: string; href: string }> = [
  { key: 'exec', label: 'Executive Dashboard', href: '/exec' },
  { key: 'analytics', label: 'Dashboard Overview', href: '/analytics' },
  { key: 'jobs', label: 'งานซ่อมทั้งหมด', href: '/jobs' },
  { key: 'cs', label: 'เปิดใบแจ้งซ่อม / คิว CS', href: '/cs' },
  { key: 'gr', label: 'GR', href: '/gr' },
  { key: 'dc', label: 'DC', href: '/dc' },
  { key: 'vd', label: 'ช่าง (VD)', href: '/vd' },
  { key: 'tradein', label: 'Trade-in / คูปอง', href: '/tradein' },
  { key: 's2', label: 'สต็อกสาขา (S2)', href: '/s2' },
  { key: 'vd_payment', label: 'รายงานจ่ายเงิน VD', href: '/reports/vd-payment' },
  { key: 'admin', label: 'ตั้งค่าระบบหลังบ้าน', href: '/admin' },
]

// Default menu matrix (08_rbac.md §2) — ใช้เมื่อ DB ยังไม่มีข้อมูล
export const DEFAULT_MENU_MATRIX: Record<string, string[]> = {
  ADMIN: ['exec', 'analytics', 'jobs', 'cs', 'gr', 'dc', 'vd', 'tradein', 's2', 'vd_payment', 'admin'],
  EXECUTIVE: ['exec', 'analytics', 'jobs', 'vd_payment'],
  CS: ['jobs', 'cs', 'tradein'],
  GR: ['jobs', 'gr'],
  DC: ['jobs', 'dc'],
  VD: ['jobs', 'vd'],
  S2: ['jobs', 's2'],
}

export const OWNER_LABELS: Record<string, string> = {
  CS: 'CS', GR: 'GR', DC: 'DC', VD: 'VD', TPL: '3PL', CUSTOMER: 'ลูกค้า', CARRIER: 'ขนส่ง',
}

export function fmtBaht(n: number | null | undefined): string {
  const v = Math.round(Number(n ?? 0))
  return (v < 0 ? '-฿' : '฿') + Math.abs(v).toLocaleString('th-TH')
}

export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '-'
  const x = new Date(d)
  return x.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', timeZone: 'Asia/Bangkok' })
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return '-'
  const x = new Date(d)
  return x.toLocaleString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })
}

/** yyyy-mm-dd in Asia/Bangkok */
export function isoDateBkk(d: Date = new Date()): string {
  return new Date(d.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10)
}

export function fmtPhone(p: string | null | undefined): string {
  if (!p) return '-'
  const d = p.replace(/\D/g, '')
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
  if (d.length === 9) return `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}`
  return p
}

export function fmtOverage(hours: number): string {
  const h = Math.max(0, Math.round(hours))
  const d = Math.floor(h / 24)
  const r = h % 24
  if (d === 0) return `${h} ชม.`
  return r > 0 ? `${d} วัน ${r} ชม.` : `${d} วัน`
}
