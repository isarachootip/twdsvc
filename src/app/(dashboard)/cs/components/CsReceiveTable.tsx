'use client'

import { SlaCell, JobIdCell, EmptyCard } from '@/components/ui/Queue'
import { Th, useSort } from '@/components/ui/Sortable'
import PhotoButton from '@/components/ui/PhotoButton'
import { fmtPhone } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'
import type { useRowInputs } from '@/components/ui/useQueue'

interface CsReceiveTableProps {
  jobs: JobView[]
  readOnly: boolean
  busy: string | null
  inp: ReturnType<typeof useRowInputs>
  onOpen: (id: string) => void
  onReceive: (job: JobView, location: string) => void
}

const SORT = {
  id: (j: JobView) => j.jobNo,
  customer: (j: JobView) => j.customerName ?? '',
  product: (j: JobView) => j.productName,
  branch: (j: JobView) => j.branch.name,
  hours: (j: JobView) => j.sla?.hoursInStep ?? 0,
}

export default function CsReceiveTable({
  jobs,
  readOnly,
  busy,
  inp,
  onOpen,
  onReceive,
}: CsReceiveTableProps) {
  const s = useSort(jobs, SORT)
  if (s.sorted.length === 0) return <EmptyCard text="ไม่มีงานรอรับของเข้า CS" />

  return (
    <div className="tcard">
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s} />
              <Th k="customer" label="ลูกค้า" {...s} />
              <Th k="product" label="สินค้า" {...s} />
              <Th k="branch" label="สาขา" {...s} />
              <Th k="hours" label="รอมาแล้ว" {...s} />
              <th>ถ่ายภาพ</th>
              <th>เลขที่ Location</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {s.sorted.map(j => {
              const currentLoc = inp.loc(j.id)
              const hasLoc = currentLoc.trim().length > 0
              return (
                <tr key={j.id} id={`row-${j.id}`}>
                  <td><JobIdCell job={j} onOpen={() => onOpen(j.id)} showDate /></td>
                  <td>
                    {j.customerName}
                    <div className="sub-mute">{fmtPhone(j.customerPhone)}</div>
                  </td>
                  <td>
                    {j.productName}
                    <div className="sub-mute">{j.brandName}</div>
                  </td>
                  <td>{j.branch.name}</td>
                  <td><SlaCell job={j} /></td>
                  <td>
                    <PhotoButton
                      photos={inp.photos(j.id)}
                      onChange={p => inp.setPhotos(j.id, p)}
                      disabled={readOnly}
                    />
                  </td>
                  <td>
                    <input
                      className="inp inp-sm"
                      style={{ width: 130 }}
                      placeholder="ระบุ Location"
                      value={currentLoc}
                      onChange={e => inp.setLoc(j.id, e.target.value)}
                      disabled={readOnly}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-primary"
                      disabled={readOnly || !hasLoc || busy !== null}
                      title={!hasLoc ? 'กรุณากรอกเลขที่ Location ก่อนยืนยัน' : undefined}
                      onClick={() => onReceive(j, currentLoc.trim().toUpperCase())}
                    >
                      ยืนยันรับสินค้า
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
