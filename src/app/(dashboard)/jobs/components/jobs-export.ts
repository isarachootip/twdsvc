import { exportXlsx, todayBkk } from '@/lib/client'
import { CHANNEL_LABELS, OWNER_LABELS, fmtDateTime } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'
import { ownerOf } from './JobsTable'

export function exportJobsXlsx(jobs: JobView[]) {
  return exportXlsx([{
    name: 'งานซ่อม',
    rows: jobs.map(j => ({
      'เลขที่ใบแจ้งซ่อม': j.jobNo,
      'วัน-เวลาระบบ (เข้าสถานะ)': fmtDateTime(j.stageEnteredAt),
      'วันที่เปิด': new Date(j.openedAt).toLocaleDateString('th-TH'),
      'ลูกค้า': j.customerName ?? '',
      'เบอร์โทร': j.customerPhone ?? '',
      'ประเภทสินค้า': j.productGroupName ?? '',
      'สินค้า': j.productName,
      'แบรนด์': j.brandName,
      'สาขา': j.branch.name,
      'ช่องทาง': j.channel ? CHANNEL_LABELS[j.channel] : '',
      'สถานะ': j.stageLabel,
      'ส่วนงานที่รับผิดชอบ': OWNER_LABELS[ownerOf(j) ?? ''] ?? '',
      'ชั่วโมงใน step นี้': j.sla?.hoursInStep ?? '',
      'SLA (ชม.)': j.sla?.slaHours ?? '',
      'เกิน SLA': j.overdue ? 'ใช่' : 'ไม่',
      'ค้างชำระ': j.unpaid ? 'ใช่' : 'ไม่',
      'ศูนย์ซ่อม': j.vendor ? `${j.vendor.code} ${j.vendor.name}` : '',
    })),
  }], `service_center_jobs_${todayBkk()}.xlsx`)
}
