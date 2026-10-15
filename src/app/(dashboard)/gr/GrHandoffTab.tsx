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
  if (!s || s.status === 'PENDING_DISPATCH') {
    return {
      ready: false,
      node: (
        <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          รอจัดรถ
        </span>
      ),
    }
  }
  if (s.carrier === 'TPL') {
    return {
      ready: true,
      node: (
        <span className="inline-flex items-center gap-1.5 text-orange-700 font-semibold text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          Booked #{s.trackingNo}
        </span>
      ),
    }
  }
  const slip = s.pickupSlip
  const slipDetail = slip?.driverName || slip?.vehiclePlate
    ? `${slip.driverName ?? ''}${slip.vehiclePlate ? ` · ${slip.vehiclePlate}` : ''}`.trim()
    : null
  if (s.status === 'DISPATCHED') {
    return {
      ready: true,
      node: (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            แจ้งคนรถแล้ว{s.pickupSlipNo ? ` (${s.pickupSlipNo})` : ''}
          </span>
          {slipDetail && <span className="text-[11px] text-slate-600">{slipDetail}</span>}
        </div>
      ),
    }
  }
  return {
    ready: true,
    node: (
      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
        ขนส่งรับแล้ว
      </span>
    ),
  }
}

export default function GrHandoffTab({
  ctx,
  rows,
  onPrintShippingLabel,
  onPrint3Pl,
}: {
  ctx: GrRowCtx
  rows: JobView[]
  onPrintShippingLabel?: (j: JobView) => void
  onPrint3Pl?: (j: JobView) => void
}) {
  const handlePrint = onPrintShippingLabel ?? onPrint3Pl
  return (
    <div className="tcard">
      {HANDOFF_GROUPS.map(g => (
        <HandoffSection
          key={g.ch}
          g={g}
          ctx={ctx}
          rows={rows.filter(j => j.channel === g.ch)}
          onPrintLabel={handlePrint}
        />
      ))}
    </div>
  )
}

function HandoffSection({
  g,
  ctx,
  rows,
  onPrintLabel,
}: {
  g: HandoffGroup
  ctx: GrRowCtx
  rows: JobView[]
  onPrintLabel?: (j: JobView) => void
}) {
  const s = useSort(rows, SORT)
  const pendingN = rows.filter(j => !ctx.done[j.id]).length
  return (
    <div className={`channel-section ${g.cls}`}>
      <div className="subhead">
        <span>{g.title}</span>
        <span className="text-xs font-semibold text-slate-700">{pendingN} งานรอส่งมอบ</span>
      </div>
      {rows.length === 0 ? <div className="empty" style={{ padding: 16 }}>ไม่มีงานในช่องทางนี้</div> : (
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr>
            <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s} /><Th k="customer" label="ลูกค้า" {...s} /><Th k="product" label="สินค้า" {...s} />
            <th>ปลายทาง VD</th><Th k="hours" label="เวลาที่ค้าง" {...s} /><th>สถานะรถ / ใบรับสินค้า</th><th>ถ่ายภาพ</th><th>สถานะ</th>
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
                <td>{t.node}</td>
                <td><PhotoCell ctx={ctx} job={j} /></td>
                <td>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {onPrintLabel && (
                      <button
                        type="button"
                        className="btn"
                        style={{ padding: '5px 8px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                        onClick={() => onPrintLabel(j)}
                        title="พิมพ์ใบปะหน้า"
                      >
                        🖨️ {g.ch === 'TPL' ? 'ใบปะหน้า 3PL' : 'ใบปะหน้า'}
                      </button>
                    )}
                    <ActionCell ctx={ctx} job={j} text="สแกนยืนยันส่งมอบ" disabled={!(t.ready && hasPhoto)} reason={reason}
                      onClick={() => ctx.run(j, 'gr_handoff', { photos: ctx.inp.photos(j.id) }, 'ส่งมอบแล้ว')} />
                  </div>
                </td>
              </tr>
            )
          })}</tbody>
        </table></div>
      )}
    </div>
  )
}
