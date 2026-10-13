'use client'

// แท็บ "Pack สินค้า" — Pack + พิมพ์ใบปะหน้า (หน้าต่างพิมพ์เปิดที่ GrClient ผ่าน onLabel)
import { SlaCell, JobIdCell, EmptyCard } from '@/components/ui/Queue'
import { Th } from '@/components/ui/Sortable'
import { buildThaiwasaduLabel, buildKexLabel, type UnifiedShippingLabelData } from '@/lib/shipping-labels'
import { CHANNEL_LABELS } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'
import { customerLabel } from './gr-config'
import { ActionCell, PhotoCell, LocCell, rowReady } from './GrRowCells'
import type { GrTableProps } from './gr-types'

export default function GrPackTable({
  ctx,
  s,
  onShippingLabel,
}: GrTableProps & {
  onShippingLabel: (d: UnifiedShippingLabelData) => void
}) {
  if (s.sorted.length === 0) return <EmptyCard />
  return (
    <div className="tcard"><div className="tbl-wrap"><table className="tbl">
      <thead><tr>
        <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s} /><Th k="customer" label="ลูกค้า" {...s} /><Th k="product" label="สินค้า" {...s} />
        <Th k="channel" label="ช่องทาง" {...s} /><Th k="hours" label="เวลาที่ค้าง" {...s} /><th>Location เดิม</th><th>Location ใหม่</th><th>ถ่ายภาพ</th><th>สถานะ</th>
      </tr></thead>
      <tbody>{s.sorted.map(j => {
        const r = rowReady(ctx, j, 'กรุณากรอก Location ใหม่')
        return (
          <tr key={j.id} id={`row-${j.id}`} className={ctx.rowCls(j)}>
            <td><JobIdCell job={j} onOpen={() => ctx.onOpen(j.id)} /></td><td>{customerLabel(j)}</td><td>{j.productName}</td>
            <td><span className="badge b-blue">{j.channel ? CHANNEL_LABELS[j.channel] : '-'}</span></td>
            <td><SlaCell job={j} /></td>
            <td>{j.location ?? '-'}</td>
            <td><LocCell ctx={ctx} job={j} placeholder="ระบุ Location ใหม่" /></td>
            <td><PhotoCell ctx={ctx} job={j} /></td>
            <td><ActionCell ctx={ctx} job={j} text="Pack เสร็จ + พิมพ์ใบปะหน้า" disabled={!r.ok} reason={r.reason} onClick={async () => {
              const res = await ctx.run(j, 'gr_pack', { photos: r.photos, location: r.loc }, 'Pack แล้ว')
              if (res) {
                if (j.channel === 'TPL') {
                  const trackingNo = typeof res.trackingNo === 'string' ? res.trackingNo : j.outboundShipment?.trackingNo
                  onShippingLabel(buildKexLabel(j, { trackingNo }))
                } else {
                  onShippingLabel(buildThaiwasaduLabel(j))
                }
              }
            }} /></td>
          </tr>
        )
      })}</tbody>
    </table></div></div>
  )
}
