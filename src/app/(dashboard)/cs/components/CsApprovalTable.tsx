'use client'

import { SlaCell, JobIdCell, EmptyCard } from '@/components/ui/Queue'
import { Th, useSort } from '@/components/ui/Sortable'
import { fmtBaht, fmtPhone } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'

interface CsApprovalTableProps {
  jobs: JobView[]
  selId: string | null
  onSelect: (job: JobView) => void
}

const SORT = {
  id: (j: JobView) => j.jobNo,
  customer: (j: JobView) => j.customerName ?? '',
  product: (j: JobView) => j.productName,
  total: (j: JobView) => Number(j.quote?.total ?? 0),
  hours: (j: JobView) => j.sla?.hoursInStep ?? 0,
}

export default function CsApprovalTable({ jobs, selId, onSelect }: CsApprovalTableProps) {
  const s = useSort(jobs, SORT)
  if (s.sorted.length === 0) return <EmptyCard text="ไม่มีงานรอลูกค้าอนุมัติ" />

  return (
    <div className="tcard">
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s} />
              <Th k="customer" label="ลูกค้า" {...s} />
              <Th k="product" label="สินค้า" {...s} />
              <Th k="total" label="ยอดเสนอราคา" {...s} />
              <Th k="hours" label="รอมาแล้ว" {...s} />
            </tr>
          </thead>
          <tbody>
            {s.sorted.map(j => {
              const expired = j.quote?.expiresAt && new Date(j.quote.expiresAt) < new Date()
              const isSelected = selId === j.id
              return (
                <tr
                  key={j.id}
                  className={`clickable ${isSelected ? 'highlight' : ''}`}
                  onClick={() => onSelect(j)}
                >
                  <td><JobIdCell job={j} /></td>
                  <td>
                    {j.customerName}
                    <div className="sub-mute">{fmtPhone(j.customerPhone)}</div>
                  </td>
                  <td>
                    {j.productName}
                    <div className="sub-mute">{j.vendor?.name}</div>
                  </td>
                  <td>
                    {fmtBaht(Number(j.quote?.total ?? 0))}
                    {expired && (
                      <div>
                        <span className="text-rose-600 font-medium text-xs">
                          • ใบเสนอราคาหมดอายุ — โทรติดตาม
                        </span>
                      </div>
                    )}
                  </td>
                  <td><SlaCell job={j} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
