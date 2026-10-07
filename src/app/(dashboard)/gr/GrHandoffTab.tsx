'use client'

// แท็บ "ส่งมอบขนส่ง" — แบ่งตามช่องทาง DC / DSD / 3PL; ต้องรอจัดรถ + ถ่ายภาพก่อนยืนยัน
import { SlaCell, JobIdCell } from '@/components/ui/Queue'
import { useSort, Th } from '@/components/ui/Sortable'
import type { JobView } from '@/lib/job-view'
import { SORT, HANDOFF_GROUPS, customerLabel, type HandoffGroup } from './gr-config'
import { ActionCell, PhotoCell } from './GrRowCells'
import type { GrRowCtx } from './gr-types'

function truckStatus(j: JobView) {
  const s = j.outboundShipment
  if (!s || s.status === 'PENDING_DISPATCH') return { ready: false, badge: <span className="badge b-gray">รอจัดรถ</span> }
  if (s.carrier === 'TPL') return { ready: true, badge: <span className="badge b-coral">Booked #{s.trackingNo}</span> }
  if (s.status === 'DISPATCHED') return { ready: true, badge: <span className="badge b-amber">แจ้งคนรถแล้ว</span> }
  return { ready: true, badge: <span className="badge b-green">ขนส่งรับแล้ว</span> }
}

export default function GrHandoffTab({ ctx, rows }: { ctx: GrRowCtx; rows: JobView[] }) {
  return (
    <div className="tcard">
      {HANDOFF_GROUPS.map(g => <HandoffSection key={g.ch} g={g} ctx={ctx} rows={rows.filter(j => j.channel === g.ch)} />)}
    </div>
  )
}

function HandoffSection({ g, ctx, rows }: { g: HandoffGroup; ctx: GrRowCtx; rows: JobView[] }) {
  const s = useSort(rows, SORT)
  const pendingN = rows.filter(j => !ctx.done[j.id]).length
  return (
    <div className={`channel-section ${g.cls}`}>
      <div className="subhead"><span>{g.title}</span><span className={`badge ${g.badge}`}>{pendingN} งานรอส่งมอบ</span></div>
      {rows.length === 0 ? <div className="empty" style={{ padding: 16 }}>ไม่มีงานในช่องทางนี้</div> : (
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr>
            <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s} /><Th k="customer" label="ลูกค้า" {...s} /><Th k="product" label="สินค้า" {...s} />
            <th>ปลายทาง VD</th><Th k="hours" label="เวลาที่ค้าง" {...s} /><th>สถานะรถ</th><th>ถ่ายภาพ</th><th>สถานะ</th>
          </tr></thead>
          <tbody>{s.sorted.map(j => {
            const t = truckStatus(j)
            const hasPhoto = ctx.inp.photos(j.id).length > 0
            const reason = !t.ready ? 'รอ DC/VD จัดรถเข้ารับก่อน' : !hasPhoto ? 'ต้องถ่ายภาพก่อน' : undefined
            return (
              <tr key={j.id} id={`row-${j.id}`} className={ctx.rowCls(j)}>
                <td><JobIdCell job={j} onOpen={() => ctx.onOpen(j.id)} /></td><td>{customerLabel(j)}</td><td>{j.productName}</td>
                <td>{j.vendor ? `${j.vendor.name} (${j.vendor.centerCode})` : '-'}</td>
                <td><SlaCell job={j} /></td>
                <td>{t.badge}</td>
                <td><PhotoCell ctx={ctx} job={j} /></td>
                <td><ActionCell ctx={ctx} job={j} text="สแกนยืนยันส่งมอบ" disabled={!(t.ready && hasPhoto)} reason={reason}
                  onClick={() => ctx.run(j, 'gr_handoff', { photos: ctx.inp.photos(j.id) }, 'ส่งมอบแล้ว')} /></td>
              </tr>
            )
          })}</tbody>
        </table></div>
      )}
    </div>
  )
}
