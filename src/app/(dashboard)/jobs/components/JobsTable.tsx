'use client'

import StageBadge from '@/components/ui/StageBadge'
import { Th, type SortDir } from '@/components/ui/Sortable'
import { CHANNEL_LABELS, OWNER_LABELS, fmtDateTime, fmtPhone } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'

export function ownerOf(j: JobView) {
  return j.overdue ? j.overdueOwner : j.sla?.owner ?? null
}

export function flags(j: JobView) {
  const out: string[] = []
  if (j.overdue) out.push(`เกิน SLA (${OWNER_LABELS[j.overdueOwner ?? ''] ?? j.overdueOwner})`)
  if (j.unpaid) out.push('ค้างชำระ')
  if (j.intakeUnpaid && ['CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT'].includes(j.stage)) out.push('รอชำระค่าดำเนินการ')
  if (j.stage === 'PENDING_VENDOR_ASSIGNMENT') out.push('รอกำหนดศูนย์ซ่อม')
  return out
}

interface JobsTableProps {
  jobs: JobView[]
  sort: { key: string | null; dir: SortDir }
  toggle: (key: string) => void
  loading: boolean
  onOpenJob: (id: string) => void
}

export default function JobsTable({ jobs, sort, toggle, loading, onOpenJob }: JobsTableProps) {
  return (
    <div className="tcard">
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <Th k="id" label="เลขที่ใบแจ้งซ่อม" sort={sort} toggle={toggle} />
              <Th k="systemTime" label="วัน-เวลาระบบ" sort={sort} toggle={toggle} />
              <Th k="customer" label="ลูกค้า" sort={sort} toggle={toggle} />
              <Th k="product" label="สินค้า" sort={sort} toggle={toggle} />
              <Th k="branch" label="สาขา" sort={sort} toggle={toggle} />
              <Th k="channel" label="ช่องทาง" sort={sort} toggle={toggle} />
              <Th k="status" label="สถานะ" sort={sort} toggle={toggle} />
              <Th k="owner" label="ส่วนงานที่รับผิดชอบ" sort={sort} toggle={toggle} />
              <Th k="hours" label="อยู่ใน step นี้มา" sort={sort} toggle={toggle} />
              <th>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={10} className="empty">กำลังโหลด…</td></tr>}
            {!loading && jobs.length === 0 && <tr><td colSpan={10} className="empty">ไม่พบรายการที่ตรงกับตัวกรอง</td></tr>}
            {!loading && jobs.map(j => (
              <tr key={j.id} className="clickable" onClick={() => onOpenJob(j.id)}>
                <td>
                  <div className={`jobid ${j.overdue ? 'overdue' : ''}`}>{j.jobNo}</div>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{fmtDateTime(j.stageEnteredAt)}</div>
                  <div className="sub-mute">เปิด {new Date(j.openedAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                </td>
                <td>
                  {j.type === 'STOCK' ? <span className="sub-mute">สต็อกสาขา</span> : j.customerName}
                  <div className="sub-mute">{j.customerPhone && !j.customerPhone.includes('x') ? fmtPhone(j.customerPhone) : j.customerPhone}</div>
                </td>
                <td>
                  {j.productName}
                  <div className="sub-mute">{j.brandName}</div>
                </td>
                <td>{j.branch.name}</td>
                <td>{j.channel ? CHANNEL_LABELS[j.channel] : '-'}</td>
                <td><StageBadge stage={j.stage} intakeUnpaid={j.intakeUnpaid} /></td>
                <td>{OWNER_LABELS[ownerOf(j) ?? ''] ?? '-'}</td>
                <td>{j.sla ? <>{j.sla.hoursInStep} ชม.<div className="sub-mute">SLA {j.sla.slaHours} ชม.</div></> : '-'}</td>
                <td>{flags(j).length ? <span className="flag">{flags(j).join(', ')}</span> : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
