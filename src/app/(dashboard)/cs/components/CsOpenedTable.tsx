'use client'

import { JobIdCell, EmptyCard } from '@/components/ui/Queue'
import StageBadge from '@/components/ui/StageBadge'
import { Th, useSort } from '@/components/ui/Sortable'
import { fmtBaht, fmtPhone, CHANNEL_LABELS } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'

interface CsOpenedTableProps {
  jobs: JobView[]
  readOnly: boolean
  onOpen: (id: string) => void
  onPay: (job: JobView, amount: number) => void
}

const SORT = {
  id: (j: JobView) => j.jobNo,
  customer: (j: JobView) => j.customerName ?? '',
  product: (j: JobView) => j.productName,
}

export default function CsOpenedTable({ jobs, readOnly, onOpen, onPay }: CsOpenedTableProps) {
  const s = useSort(jobs, SORT)
  if (s.sorted.length === 0) return <EmptyCard text="ยังไม่มีงานที่เปิดวันนี้" />

  return (
    <div className="tcard">
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s} />
              <Th k="customer" label="ลูกค้า" {...s} />
              <Th k="product" label="สินค้า" {...s} />
              <th>ช่องทาง</th>
              <th>สถานะ</th>
              <th>ค่าดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {s.sorted.map(j => (
              <tr key={j.id}>
                <td><JobIdCell job={j} onOpen={() => onOpen(j.id)} showDate /></td>
                <td>
                  {j.customerName}
                  <div className="sub-mute">{fmtPhone(j.customerPhone)}</div>
                </td>
                <td>
                  {j.productName}
                  <div className="sub-mute">{j.brandName}</div>
                </td>
                <td>{j.channel ? CHANNEL_LABELS[j.channel] : '-'}</td>
                <td><StageBadge stage={j.stage} intakeUnpaid={j.intakeUnpaid} /></td>
                <td>
                  {j.money && j.money.intakeBalance > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      <span className="text-amber-700 font-semibold text-xs">
                        • ค้างชำระ {fmtBaht(j.money.intakeBalance)}
                      </span>
                      <button
                        className="btn btn-primary"
                        disabled={readOnly}
                        onClick={() => onPay(j, j.money!.intakeBalance)}
                      >
                        รับชำระ
                      </button>
                    </div>
                  ) : (
                    <span className="text-emerald-700 font-medium text-xs">
                      • {(j.money?.intakeCharges ?? 0) > 0 ? 'ชำระเงินสำเร็จ' : 'ไม่มีค่าใช้จ่าย'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
