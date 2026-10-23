import type { Stage } from '@/lib/constants'

export interface CustomerMilestone {
  id: number
  label: string
  stages: Stage[]
}

export const CUSTOMER_MILESTONES: CustomerMilestone[] = [
  {
    id: 1,
    label: 'รับเรื่องแจ้งซ่อม (Intake)',
    stages: ['PENDING_VENDOR_ASSIGNMENT', 'CS_OPENED', 'GR_RECEIVED', 'GR_PACKED'],
  },
  {
    id: 2,
    label: 'ส่งซ่อม (Logistics to VD)',
    stages: ['OUTBOUND_TO_DC', 'AT_DC_OUTBOUND', 'OUTBOUND_TO_VD'],
  },
  {
    id: 3,
    label: 'ประเมินราคา (Quote & Approval)',
    stages: ['VD_INSPECTING', 'WAITING_APPROVAL'],
  },
  {
    id: 4,
    label: 'กำลังซ่อม (Repair & QA)',
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
    label: 'พร้อมรับสินค้า (Ready for collection)',
    stages: ['READY_FOR_PICKUP', 'CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED'],
  },
]

export function getCustomerMilestoneId(stage: Stage): number {
  if (stage === 'CLOSED_REPAIRED' || stage === 'CLOSED_NOT_REPAIRED') {
    return 5
  }
  for (const m of CUSTOMER_MILESTONES) {
    if (m.stages.includes(stage)) {
      return m.id
    }
  }
  return 1
}
