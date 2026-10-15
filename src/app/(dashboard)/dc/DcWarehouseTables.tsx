'use client'

import { SlaCell, JobIdCell, EmptyCard } from '@/components/ui/Queue'
import PhotoButton from '@/components/ui/PhotoButton'
import { Th, type SortState } from '@/components/ui/Sortable'
import type { useRowInputs } from '@/components/ui/useQueue'
import type { JobView } from '@/lib/job-view'

const isValidDcLoc = (loc: string) => /^DC-\d{2}-[A-Z]$/i.test(loc.trim())

export interface DcWarehouseCtx {
  done: Record<string, string>
  inp: ReturnType<typeof useRowInputs>
  readOnly: boolean
  busy: string | null
  rowCls: (j: JobView) => string
  onOpenJob: (id: string) => void
  run: (
    job: JobView,
    action: string,
    body?: Record<string, unknown>,
    doneLabel?: string,
  ) => Promise<Record<string, unknown> | null>
}

function actionBtn(
  ctx: DcWarehouseCtx,
  j: JobView,
  text: string,
  disabled: boolean,
  onClick: () => void,
  reason?: string,
) {
  return ctx.done[j.id] ? (
    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
      {ctx.done[j.id]}
    </span>
  ) : (
    <button
      className="btn btn-primary"
      disabled={disabled || ctx.readOnly || ctx.busy !== null}
      title={disabled ? reason : undefined}
      onClick={onClick}
    >
      {text}
    </button>
  )
}

export function DcReceiveLocationTab({ s2, ctx }: { s2: SortState<JobView>; ctx: DcWarehouseCtx }) {
  if (s2.sorted.length === 0) return <EmptyCard />
  return (
    <div className="tcard"><div className="tbl-wrap"><table className="tbl">
      <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s2} /><Th k="branch" label="สาขาต้นทาง" {...s2} /><Th k="customer" label="ลูกค้า" {...s2} /><Th k="product" label="สินค้า" {...s2} /><Th k="hours" label="เวลาที่ค้าง" {...s2} /><th>เลขที่ Location (DC-00-A)</th><th>สถานะ</th></tr></thead>
      <tbody>{s2.sorted.map(j => {
        const locVal = ctx.inp.loc(j.id)
        const valid = isValidDcLoc(locVal)
        return (
          <tr key={j.id} className={ctx.rowCls(j)}>
            <td><JobIdCell job={j} onOpen={() => ctx.onOpenJob(j.id)} /></td><td>{j.branch.name}</td><td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}</td><td><SlaCell job={j} /></td>
            <td>{ctx.done[j.id] ? locVal : <input className="inp inp-sm" style={{ width: 130 }} placeholder="เช่น DC-01-A" value={locVal} onChange={e => ctx.inp.setLoc(j.id, e.target.value)} disabled={ctx.readOnly} />}</td>
            <td>{actionBtn(ctx, j, 'ยืนยันรับเข้า Location', !valid, () => ctx.run(j, 'dc_receive_outbound', { location: locVal.trim().toUpperCase() }, 'รับเข้าแล้ว'), !valid ? 'Location ต้องเป็นรูปแบบ DC-00-A (เช่น DC-01-A)' : undefined)}</td>
          </tr>
        )
      })}</tbody>
    </table></div></div>
  )
}

export function DcHandoffVdTab({ s3, ctx }: { s3: SortState<JobView>; ctx: DcWarehouseCtx }) {
  if (s3.sorted.length === 0) return <EmptyCard />
  return (
    <div className="tcard"><div className="tbl-wrap"><table className="tbl">
      <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s3} /><Th k="customer" label="ลูกค้า" {...s3} /><Th k="product" label="สินค้า" {...s3} /><Th k="vd" label="VD ที่มารับ" {...s3} /><th>สถานะรถ VD</th><Th k="hours" label="เวลาที่ค้าง" {...s3} /><th>ถ่ายภาพ</th><th>สถานะ</th></tr></thead>
      <tbody>{s3.sorted.map(j => {
        const dispatched = j.outboundShipment?.legType === 'DC_TO_VD' && j.outboundShipment.status !== 'PENDING_DISPATCH'
        const hasPhoto = ctx.inp.photos(j.id).length > 0
        return (
          <tr key={j.id} className={ctx.rowCls(j)}>
            <td><JobIdCell job={j} onOpen={() => ctx.onOpenJob(j.id)} /></td><td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}</td>
            <td>{j.vendor ? `${j.vendor.centerCode} ${j.vendor.name}` : '-'}{j.location && <div className="sub-mute">Location {j.location}</div>}</td>
            <td>
              {dispatched ? (
                <span className="inline-flex items-center gap-1.5 text-amber-700 font-semibold text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  VD ส่งรถแล้ว{j.outboundShipment?.pickupSlipNo ? ` (${j.outboundShipment.pickupSlipNo})` : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  รอ VD ส่งรถ
                </span>
              )}
            </td>
            <td><SlaCell job={j} /></td>
            <td>{ctx.done[j.id] ? '✓' : <PhotoButton photos={ctx.inp.photos(j.id)} onChange={p => ctx.inp.setPhotos(j.id, p)} disabled={ctx.readOnly} />}</td>
            <td>{actionBtn(ctx, j, 'ยืนยันส่งมอบ + Clear Location', !dispatched || !hasPhoto, () => ctx.run(j, 'dc_handoff_vd', { photos: ctx.inp.photos(j.id) }, 'ส่งมอบแล้ว — Location clear'), !dispatched ? 'รอ VD ส่งรถมารับ' : !hasPhoto ? 'ต้องถ่ายภาพก่อน' : undefined)}</td>
          </tr>
        )
      })}</tbody>
    </table></div></div>
  )
}

export function DcReturnFromVdTab({ s4, ctx }: { s4: SortState<JobView>; ctx: DcWarehouseCtx }) {
  if (s4.sorted.length === 0) return <EmptyCard />
  return (
    <div className="tcard"><div className="tbl-wrap"><table className="tbl">
      <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s4} /><Th k="customer" label="ลูกค้า" {...s4} /><Th k="product" label="สินค้า" {...s4} /><Th k="vd" label="VD ที่ส่งคืนมา" {...s4} /><Th k="hours" label="เวลาที่ค้าง" {...s4} /><th>ถ่ายภาพ</th><th>สถานะ</th></tr></thead>
      <tbody>{s4.sorted.map(j => {
        const hasPhoto = ctx.inp.photos(j.id).length > 0
        return (
          <tr key={j.id} className={ctx.rowCls(j)}>
            <td><JobIdCell job={j} onOpen={() => ctx.onOpenJob(j.id)} /></td><td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}</td>
            <td>{j.vendor ? `${j.vendor.centerCode} ${j.vendor.name}` : '-'}</td><td><SlaCell job={j} /></td>
            <td>{ctx.done[j.id] ? '✓' : <PhotoButton photos={ctx.inp.photos(j.id)} onChange={p => ctx.inp.setPhotos(j.id, p)} disabled={ctx.readOnly} />}</td>
            <td>{actionBtn(ctx, j, 'ยืนยันรับคืนจาก VD', !hasPhoto, () => ctx.run(j, 'dc_receive_inbound', { photos: ctx.inp.photos(j.id) }, 'รับคืนแล้ว'), !hasPhoto ? 'ต้องถ่ายภาพก่อน' : undefined)}</td>
          </tr>
        )
      })}</tbody>
    </table></div></div>
  )
}
