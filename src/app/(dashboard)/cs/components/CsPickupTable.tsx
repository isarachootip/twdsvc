'use client'

import { SlaCell, JobIdCell, EmptyCard } from '@/components/ui/Queue'
import { Th, useSort } from '@/components/ui/Sortable'
import { fmtBaht, fmtPhone } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'

interface CsPickupTableProps {
  jobs: JobView[]
  selId: string | null
  onSelect: (job: JobView) => void
  onEditLoc: (job: JobView) => void
  readOnly: boolean
}

const SORT = {
  id: (j: JobView) => j.jobNo,
  customer: (j: JobView) => j.customerName ?? '',
  product: (j: JobView) => j.productName,
  location: (j: JobView) => j.location ?? '',
  balance: (j: JobView) => j.money?.balance ?? 0,
  hours: (j: JobView) => j.sla?.hoursInStep ?? 0,
}

export default function CsPickupTable({
  jobs,
  selId,
  onSelect,
  onEditLoc,
  readOnly,
}: CsPickupTableProps) {
  const s = useSort(jobs, SORT)
  if (s.sorted.length === 0) return <EmptyCard text="ไม่มีงานพร้อมรับที่สาขา" />

  return (
    <div className="tcard">
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s} />
              <Th k="customer" label="ลูกค้า" {...s} />
              <Th k="product" label="สินค้า" {...s} />
              <Th k="location" label="Location" {...s} />
              <th>ผลการซ่อม</th>
              <Th k="balance" label="ยอดค้างชำระ" {...s} />
              <Th k="hours" label="รอลูกค้ามาแล้ว" {...s} />
            </tr>
          </thead>
          <tbody>
            {s.sorted.map(j => {
              const isSelected = selId === j.id
              const balance = j.money?.balance ?? 0
              return (
                <tr
                  key={j.id}
                  className={`clickable ${isSelected ? 'highlight' : ''}`}
                  onClick={() => onSelect(j)}
                >
                  <td><JobIdCell job={j} showDate /></td>
                  <td>
                    {j.customerName}
                    <div className="sub-mute">{fmtPhone(j.customerPhone)}</div>
                  </td>
                  <td>
                    {j.productName}
                    <div className="sub-mute">{j.brandName}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="font-semibold text-slate-800">{j.location ?? '-'}</span>
                      {!readOnly && (
                        <button
                          className="link-btn text-xs text-amber-700 hover:text-amber-800"
                          style={{ padding: '2px 4px' }}
                          title="แก้ไข Location"
                          onClick={e => {
                            e.stopPropagation()
                            onEditLoc(j)
                          }}
                        >
                          ✏️ แก้ไข
                        </button>
                      )}
                    </div>
                  </td>
                  <td>
                    {j.decision === 'REJECTED' ? (
                      <span className="text-rose-600 font-medium inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        ไม่อนุมัติซ่อม
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        ซ่อมเสร็จ
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      fontWeight: 600,
                      color: balance > 0 && j.decision !== 'REJECTED' ? 'var(--red-dark)' : 'var(--green)',
                    }}
                  >
                    {j.decision === 'REJECTED' ? '-' : balance > 0 ? fmtBaht(balance) : 'ชำระครบ'}
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
