// ค่าคงที่ของหน้า GR (แท็บ, ตัวเรียง, กลุ่มช่องทางส่งมอบ)
import type { JobView } from '@/lib/job-view'

export const TABS = [
  { key: 'receive', label: 'รับจาก CS', kpi: 'รอรับจาก CS' },
  { key: 'pack', label: 'Pack สินค้า', kpi: 'รอ Pack' },
  { key: 'handoff', label: 'ส่งมอบขนส่ง', kpi: 'รอส่งมอบขนส่ง' },
  { key: 'return', label: 'รับคืนจาก VD/DC/3PL', kpi: 'รอรับคืนจาก VD/DC/3PL' },
  { key: 'deliverCS', label: 'รอส่งมอบ CS', kpi: 'รอส่งมอบ CS' },
]

export const TAB_KEYS = TABS.map(t => t.key)

export const SORT = {
  id: (j: JobView) => j.jobNo, customer: (j: JobView) => j.customerName ?? '', product: (j: JobView) => j.productName,
  branch: (j: JobView) => j.branch.name, hours: (j: JobView) => j.sla?.hoursInStep ?? 0, channel: (j: JobView) => j.channel ?? '',
}

export const HANDOFF_GROUPS = [
  { ch: 'DC', cls: 'dc', title: 'DC (ฝากส่ง)', badge: 'b-blue' },
  { ch: 'DSD', cls: 'vd', title: 'DSD (VD เข้ารับที่สาขา)', badge: 'b-teal' },
  { ch: 'TPL', cls: 'tpl', title: '3PL (ขนส่งภายนอก)', badge: 'b-coral' },
] as const

export type HandoffGroup = (typeof HANDOFF_GROUPS)[number]

export const isValidGrLoc = (loc: string) => loc.trim().length > 0

export const customerLabel = (j: JobView) => j.customerName ?? (j.type === 'STOCK' ? 'สต็อกสาขา' : '-')
