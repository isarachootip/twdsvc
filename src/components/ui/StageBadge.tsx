import { JobStage } from '@prisma/client'

const STAGE_LABELS: Record<JobStage, string> = {
  PENDING_VENDOR_ASSIGNMENT: 'รอกำหนดศูนย์ซ่อม',
  CS_OPENED:                 'รอส่งมอบ GR',
  GR_RECEIVED:               'GR กำลัง Pack',
  GR_PACKED:                 'รอขนส่งเข้ารับ',
  OUTBOUND_TO_DC:            'ระหว่างขนส่งไป DC',
  AT_DC_OUTBOUND:            'อยู่ที่ DC รอ VD รับ',
  OUTBOUND_TO_VD:            'ระหว่างขนส่งไป VD',
  VD_INSPECTING:             'VD ตรวจสอบ',
  WAITING_APPROVAL:          'รอลูกค้าอนุมัติ',
  REPAIRING:                 'กำลังซ่อม',
  RETURN_PACKING:            'รอ Pack ส่งคืน',
  INBOUND_TO_DC:             'ระหว่างส่งคืน (ไป DC)',
  AT_DC_INBOUND:             'อยู่ที่ DC รอส่งสาขา',
  INBOUND_TO_BRANCH:         'ระหว่างขนส่งคืน',
  GR_RETURN_RECEIVED:        'รอส่งมอบ CS',
  READY_FOR_PICKUP:          'พร้อมรับที่สาขา',
  CLOSED_REPAIRED:           'ปิดงาน (ซ่อมสำเร็จ)',
  CLOSED_NOT_REPAIRED:       'ปิดงาน (ไม่ซ่อม)',
  CANCELLED:                 'ยกเลิก',
}

interface Props {
  stage: JobStage
  size?: 'sm' | 'md'
}

export default function StageBadge({ stage, size = 'md' }: Props) {
  const label = STAGE_LABELS[stage] ?? stage
  const px = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${px} stage-${stage}`}>
      {label}
    </span>
  )
}
