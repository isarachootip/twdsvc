import type { Stage } from '@/lib/constants'

export interface CustomerMilestone {
  id: number
  label: string
  shortLabel: string
  stages: Stage[]
}

export const CUSTOMER_MILESTONES: CustomerMilestone[] = [
  {
    id: 1,
    label: '1. เปิดงานแจ้งซ่อม',
    shortLabel: 'เปิดงาน',
    stages: ['PENDING_VENDOR_ASSIGNMENT', 'CS_OPENED', 'GR_RECEIVED', 'GR_PACKED'],
  },
  {
    id: 2,
    label: '2. ส่งศูนย์ซ่อม',
    shortLabel: 'ส่งซ่อม',
    stages: ['OUTBOUND_TO_DC', 'AT_DC_OUTBOUND', 'OUTBOUND_TO_VD'],
  },
  {
    id: 3,
    label: '3. เสนอราคา',
    shortLabel: 'เสนอราคา',
    stages: ['VD_INSPECTING', 'WAITING_APPROVAL'],
  },
  {
    id: 4,
    label: '4. สินค้าซ่อมเสร็จ',
    shortLabel: 'ซ่อมเสร็จ',
    stages: [
      'REPAIRING',
      'RETURN_PACKING',
      'INBOUND_TO_DC',
      'AT_DC_INBOUND',
      'INBOUND_TO_BRANCH',
      'GR_RETURN_RECEIVED',
    ],
  },
  {
    id: 5,
    label: '5. สินค้าพร้อมรับ',
    shortLabel: 'พร้อมรับ',
    stages: ['READY_FOR_PICKUP'],
  },
  {
    id: 6,
    label: '6. ส่งมอบสำเร็จ',
    shortLabel: 'ส่งมอบ',
    stages: ['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED'],
  },
]

export function getCustomerMilestoneId(stage: Stage): number {
  for (const m of CUSTOMER_MILESTONES) {
    if (m.stages.includes(stage)) {
      return m.id
    }
  }
  return 1
}
