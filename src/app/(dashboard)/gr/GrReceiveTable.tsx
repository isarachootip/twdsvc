'use client'

// แท็บ "รับจาก CS" — ยืนยันรับสินค้าเข้า GR (ถ่ายภาพ + Location)
import { SlaCell, JobIdCell, EmptyCard } from '@/components/ui/Queue'
import { Th } from '@/components/ui/Sortable'
import { customerLabel } from './gr-config'
import { ActionCell, PhotoCell, LocCell, rowReady } from './GrRowCells'
import type { GrTableProps } from './gr-types'

export default function GrReceiveTable({ ctx, s }: GrTableProps) {
  if (s.sorted.length === 0) return <EmptyCard />
  return (
    <div className="tcard"><div className="tbl-wrap"><table className="tbl">
      <thead><tr>
        <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s} /><Th k="customer" label="ลูกค้า" {...s} /><Th k="product" label="สินค้า" {...s} />
        <Th k="branch" label="สาขา" {...s} /><Th k="hours" label="รอมาแล้ว" {...s} /><th>ถ่ายภาพ</th><th>เลขที่ Location</th><th>สถานะ</th>
      </tr></thead>
      <tbody>{s.sorted.map(j => {
        const r = rowReady(ctx, j, 'กรุณากรอกเลขที่ Location')
        return (
          <tr key={j.id} id={`row-${j.id}`} className={ctx.rowCls(j)}>
            <td><JobIdCell job={j} onOpen={() => ctx.onOpen(j.id)} /></td><td>{customerLabel(j)}</td><td>{j.productName}</td><td>{j.branch.name}</td>
            <td><SlaCell job={j} /></td>
            <td><PhotoCell ctx={ctx} job={j} /></td>
            <td><LocCell ctx={ctx} job={j} placeholder="ระบุ Location" /></td>
            <td>{j.intakeUnpaid && !ctx.done[j.id]
              ? <span className="badge b-amber">รอชำระค่าดำเนินการ</span>
              : <ActionCell ctx={ctx} job={j} text="ยืนยันรับสินค้า" disabled={!r.ok} reason={r.reason}
                  onClick={() => ctx.run(j, 'gr_receive', { photos: r.photos, location: r.loc }, 'รับแล้ว')} />}</td>
          </tr>
        )
      })}</tbody>
    </table></div></div>
  )
}
