'use client'

import { SlaCell, JobIdCell, EmptyCard } from '@/components/ui/Queue'
import PhotoButton from '@/components/ui/PhotoButton'
import type { LabelData } from '@/components/ui/PrintLabel'
import { buildReturnBoxLabel } from '@/lib/shipping-labels'
import { Th, type SortState } from '@/components/ui/Sortable'
import type { useRowInputs } from '@/components/ui/useQueue'
import { fmtBaht } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'

const RETURN_CH: Record<string, string> = { DC: 'DC', DSD: 'สาขา (ผ่าน GR)', TPL: '3PL' }

export interface VdTabCommonProps {
  done: Record<string, string>
  readOnly: boolean
  busy: string | null
  rowCls: (j: JobView) => string
  onOpenJob: (id: string) => void
  run: (job: JobView, action: string, body?: Record<string, unknown>, doneLabel?: string, opts?: { silent?: boolean }) => Promise<Record<string, unknown> | null>
}

export function VdQuoteTab({ s2, ctx, onGoQuote }: { s2: SortState<JobView>; ctx: VdTabCommonProps; onGoQuote: (id: string) => void }) {
  if (s2.sorted.length === 0) return <EmptyCard />
  return (
    <div className="tcard"><div className="tbl-wrap"><table className="tbl">
      <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s2} /><Th k="customer" label="ลูกค้า" {...s2} /><Th k="product" label="สินค้า" {...s2} /><Th k="warranty" label="ประกัน" {...s2} /><Th k="hours" label="รอมาแล้ว" {...s2} /><th>สถานะ</th></tr></thead>
      <tbody>{s2.sorted.map(j => (
        <tr key={j.id} className={ctx.rowCls(j)}>
          <td><JobIdCell job={j} onOpen={() => ctx.onOpenJob(j.id)} /></td><td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}</td>
          <td>{j.type === 'STOCK' ? 'งานสต็อก' : j.hasWarranty ? 'มีประกัน' : 'ไม่มีประกัน'}</td><td><SlaCell job={j} /></td>
          <td>{ctx.done[j.id] ? <span className="text-emerald-700 font-semibold text-xs">• {ctx.done[j.id]}</span> : j.type === 'STOCK' ? (
            <button className="btn btn-primary" disabled={ctx.readOnly || ctx.busy !== null} onClick={() => ctx.run(j, 'vd_start_repair', {}, 'เริ่มซ่อมแล้ว')}>เริ่มซ่อม</button>
          ) : (
            <button className="btn btn-primary" disabled={ctx.readOnly} onClick={() => onGoQuote(j.id)}>ประเมิน + เสนอราคา</button>
          )}</td>
        </tr>
      ))}</tbody>
    </table></div></div>
  )
}

export function VdApprovalTab({ s3, ctx, onSetLon, onReviseQuote }: { s3: SortState<JobView>; ctx: VdTabCommonProps; onSetLon: (j: JobView) => void; onReviseQuote: (id: string) => void }) {
  if (s3.sorted.length === 0) return <EmptyCard />
  return (
    <div className="tcard"><div className="tbl-wrap"><table className="tbl">
      <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s3} /><Th k="customer" label="ลูกค้า" {...s3} /><Th k="product" label="สินค้า" {...s3} /><Th k="total" label="ยอดเสนอราคา" {...s3} /><Th k="hours" label="รอมาแล้ว" {...s3} /><th></th></tr></thead>
      <tbody>{s3.sorted.map(j => (
        <tr key={j.id} className={ctx.rowCls(j)}>
          <td><JobIdCell job={j} onOpen={() => ctx.onOpenJob(j.id)} /></td><td>{j.customerName}</td><td>{j.productName}</td>
          <td>{j.quote && 'total' in j.quote ? fmtBaht(Number(j.quote.total)) : '-'}{j.quote && 'expiresAt' in j.quote && j.quote.expiresAt && new Date(j.quote.expiresAt) < new Date() && <div className="text-rose-600 text-xs font-semibold">• ลิงก์หมดอายุ</div>}</td>
          <td><SlaCell job={j} /></td>
          <td><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn" onClick={() => onSetLon(j)}>ดูหน้า LON ลูกค้า</button>
            <button className="btn" disabled={ctx.readOnly} onClick={() => onReviseQuote(j.id)}>แก้ไขใบเสนอราคา</button>
          </div></td>
        </tr>
      ))}</tbody>
    </table></div></div>
  )
}

export function VdRepairTab({ s4, ctx }: { s4: SortState<JobView>; ctx: VdTabCommonProps }) {
  if (s4.sorted.length === 0) return <EmptyCard />
  return (
    <div className="tcard"><div className="tbl-wrap"><table className="tbl">
      <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s4} /><Th k="customer" label="ลูกค้า" {...s4} /><Th k="product" label="สินค้า" {...s4} /><Th k="days" label="ระยะเวลาซ่อม (วัน)" {...s4} /><Th k="hours" label="เวลาที่ใช้ไป" {...s4} /><th>รออะไหล่</th><th>สถานะ</th></tr></thead>
      <tbody>{s4.sorted.map(j => (
        <tr key={j.id} className={ctx.rowCls(j)}>
          <td><JobIdCell job={j} onOpen={() => ctx.onOpenJob(j.id)} /></td><td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}</td>
          <td>{j.quote?.repairDays ? `${j.quote.repairDays} วัน` : '-'}</td><td><SlaCell job={j} /></td>
          <td>{!ctx.done[j.id] && (j.sla?.paused ? (
            <button className="btn" disabled={ctx.readOnly || ctx.busy !== null} onClick={() => ctx.run(j, 'vd_resume_parts', {}, 'ซ่อมต่อ', { silent: true })}>▶ ซ่อมต่อ</button>
          ) : (
            <button className="btn" disabled={ctx.readOnly || ctx.busy !== null} onClick={() => ctx.run(j, 'vd_pause_parts', {}, 'รออะไหล่', { silent: true })}>⏸ รออะไหล่</button>
          ))}</td>
          <td>{ctx.done[j.id] ? <span className="text-emerald-700 font-semibold text-xs">• {ctx.done[j.id]}</span> : <button className="btn btn-primary" disabled={ctx.readOnly || ctx.busy !== null} onClick={() => ctx.run(j, 'vd_finish_repair', {}, 'ซ่อมเสร็จ')}>ซ่อมเสร็จ</button>}</td>
        </tr>
      ))}</tbody>
    </table></div></div>
  )
}

export function VdReturnTab({ s5, ctx, inp, onSetLabel }: { s5: SortState<JobView>; ctx: VdTabCommonProps; inp: ReturnType<typeof useRowInputs>; onSetLabel: (d: LabelData) => void }) {
  if (s5.sorted.length === 0) return <EmptyCard />
  return (
    <div className="tcard"><div className="tbl-wrap"><table className="tbl">
      <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s5} /><Th k="customer" label="ลูกค้า" {...s5} /><Th k="product" label="สินค้า" {...s5} /><Th k="channel" label="ช่องทางส่งคืน" {...s5} /><Th k="hours" label="เวลาที่ค้าง" {...s5} /><th>สถานะ / Action</th></tr></thead>
      <tbody>{s5.sorted.map(j => (
        <tr key={j.id} className={ctx.rowCls(j)}>
          <td><JobIdCell job={j} onOpen={() => ctx.onOpenJob(j.id)} /></td><td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}{j.decision === 'REJECTED' && <div className="text-rose-600 text-xs font-semibold">• ลูกค้าไม่อนุมัติซ่อม</div>}</td>
          <td><span className="text-sky-700 font-semibold text-xs">{RETURN_CH[j.channel ?? ''] ?? '-'}</span></td><td><SlaCell job={j} /></td>
          <td>{ctx.done[j.id] ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="text-emerald-700 font-semibold text-xs">• {ctx.done[j.id]}</span>
              <button type="button" className="btn" onClick={() => onSetLabel(buildReturnBoxLabel(j, { source: 'VD' }))}>🖨️ พิมพ์ใบปะหน้ากล่อง</button>
            </div>
          ) : j.channel === 'TPL' ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="btn" onClick={() => onSetLabel(buildReturnBoxLabel(j, { source: 'VD' }))}>🖨️ พิมพ์ใบปะหน้ากล่อง</button>
              <button className="btn btn-primary" disabled={ctx.readOnly || ctx.busy !== null} onClick={async () => {
                const r = await ctx.run(j, 'vd_return_pack', {}, 'รอ 3PL มารับ (Auto Book แล้ว)')
                if (r) onSetLabel(buildReturnBoxLabel(j, { source: 'VD', trackingNo: typeof r.trackingNo === 'string' ? r.trackingNo : null }))
              }}>Confirm ซ่อมเสร็จ พร้อมส่งคืน (Auto Book 3PL)</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <button type="button" className="btn" onClick={() => onSetLabel(buildReturnBoxLabel(j, { source: 'VD' }))}>🖨️ พิมพ์ใบปะหน้ากล่อง</button>
                <PhotoButton photos={inp.photos(j.id)} onChange={p => inp.setPhotos(j.id, p)} disabled={ctx.readOnly} />
              </div>
              <button className="btn btn-primary" disabled={!inp.photos(j.id).length || ctx.readOnly || ctx.busy !== null} onClick={async () => {
                const r = await ctx.run(j, 'vd_return_pack', { photos: inp.photos(j.id) }, j.channel === 'DC' ? 'ส่งให้ DC แล้ว — รอ DC รับและส่งต่อสาขา' : 'ส่งมอบ GR แล้ว — รอ GR แจ้งลูกค้า')
                if (r) onSetLabel(buildReturnBoxLabel(j, { source: 'VD' }))
              }}>{j.channel === 'DC' ? 'Pack เสร็จ + พิมพ์ใบปะหน้า (ส่งให้ DC)' : 'Pack เสร็จ + ส่งมอบให้ GR'}</button>
            </div>
          )}</td>
        </tr>
      ))}</tbody>
    </table></div></div>
  )
}
