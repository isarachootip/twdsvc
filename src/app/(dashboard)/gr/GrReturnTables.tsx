'use client'

// แท็บ "รับคืนจาก VD/DC/3PL" และ "รอส่งมอบ CS"
import { SlaCell, JobIdCell, EmptyCard } from '@/components/ui/Queue'
import { Th } from '@/components/ui/Sortable'
import { CHANNEL_LABELS } from '@/lib/constants'
import { customerLabel } from './gr-config'
import { ActionCell, PhotoCell, LocCell, rowReady } from './GrRowCells'
import type { GrTableProps } from './gr-types'

export function GrReturnTable({ ctx, s }: GrTableProps) {
  if (s.sorted.length === 0) return <EmptyCard />
  return (
    <div className="tcard"><div className="tbl-wrap"><table className="tbl">
      <thead><tr>
        <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s} /><Th k="customer" label="ลูกค้า" {...s} /><Th k="product" label="สินค้า" {...s} />
        <Th k="channel" label="ช่องทางที่ส่งคืนมา" {...s} /><Th k="hours" label="เวลาที่ค้าง" {...s} /><th>ถ่ายภาพ</th><th>เลขที่ Location</th><th>สถานะ</th>
      </tr></thead>
      <tbody>{s.sorted.map(j => {
        const r = rowReady(ctx, j, 'กรุณากรอกเลขที่ Location')
        return (
          <tr key={j.id} id={`row-${j.id}`} className={ctx.rowCls(j)}>
            <td><JobIdCell job={j} onOpen={() => ctx.onOpen(j.id)} /></td><td>{customerLabel(j)}</td><td>{j.productName}</td>
            <td><span className="badge b-blue">{j.channel ? CHANNEL_LABELS[j.channel] : '-'}</span>{j.inboundShipment?.trackingNo && <div className="sub-mute">#{j.inboundShipment.trackingNo}</div>}</td>
            <td><SlaCell job={j} /></td>
            <td><PhotoCell ctx={ctx} job={j} /></td>
            <td><LocCell ctx={ctx} job={j} placeholder="ระบุ Location" /></td>
            <td><ActionCell ctx={ctx} job={j} text="ยืนยันรับคืน" disabled={!r.ok} reason={r.reason}
              onClick={() => ctx.run(j, 'gr_receive_return', { photos: r.photos, location: r.loc }, 'รับคืนแล้ว')} /></td>
          </tr>
        )
      })}</tbody>
    </table></div></div>
  )
}

export function GrDeliverCsTable({ ctx, s }: GrTableProps) {
  if (s.sorted.length === 0) return <EmptyCard text="ไม่มีงานรอส่งมอบ CS" />
  return (
    <div className="tcard"><div className="tbl-wrap"><table className="tbl">
      <thead><tr>
        <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s} /><Th k="customer" label="ลูกค้า" {...s} /><Th k="product" label="สินค้า" {...s} />
        <th>Location</th><Th k="hours" label="เวลาที่ค้าง" {...s} /><th>ถ่ายภาพ</th><th>สถานะ</th>
      </tr></thead>
      <tbody>{s.sorted.map(j => {
        const r = rowReady(ctx, j, null)
        return (
          <tr key={j.id} id={`row-${j.id}`} className={ctx.rowCls(j)}>
            <td><JobIdCell job={j} onOpen={() => ctx.onOpen(j.id)} /></td><td>{customerLabel(j)}</td><td>{j.productName}</td>
            <td>{j.location ?? '-'}</td>
            <td><SlaCell job={j} /></td>
            <td><PhotoCell ctx={ctx} job={j} /></td>
            <td><ActionCell ctx={ctx} job={j} text={j.type === 'STOCK' ? 'ส่งมอบให้สาขา (S2)' : 'ส่งมอบให้ CS'} disabled={!r.ok} reason={r.reason}
              onClick={() => ctx.run(j, 'gr_deliver_cs', { photos: r.photos }, 'ส่งมอบ CS แล้ว')} /></td>
          </tr>
        )
      })}</tbody>
    </table></div></div>
  )
}
