'use client'

// เซลล์ที่ใช้ซ้ำในทุกตารางของหน้า GR: ปุ่ม action, ถ่ายภาพ, Location
import PhotoButton from '@/components/ui/PhotoButton'
import type { JobView } from '@/lib/job-view'
import type { GrRowCtx } from './gr-types'
import { isValidGrLoc } from './gr-config'

export function ActionCell({ ctx, job, text, disabled, onClick, reason }: {
  ctx: GrRowCtx; job: JobView; text: string; disabled: boolean; onClick: () => void; reason?: string
}) {
  if (ctx.done[job.id]) return <span className="badge b-green">{ctx.done[job.id]}</span>
  return (
    <button className="btn btn-primary" disabled={disabled || ctx.readOnly || ctx.busy !== null} title={disabled ? reason : undefined} onClick={onClick}>{text}</button>
  )
}

export function PhotoCell({ ctx, job }: { ctx: GrRowCtx; job: JobView }) {
  if (ctx.done[job.id]) return <>✓</>
  return <PhotoButton photos={ctx.inp.photos(job.id)} onChange={p => ctx.inp.setPhotos(job.id, p)} disabled={ctx.readOnly} />
}

export function LocCell({ ctx, job, placeholder, width = 140 }: { ctx: GrRowCtx; job: JobView; placeholder: string; width?: number }) {
  const v = ctx.inp.loc(job.id)
  if (ctx.done[job.id]) return <>{v}</>
  return <input className="inp inp-sm" style={{ width }} value={v} placeholder={placeholder} onChange={e => ctx.inp.setLoc(job.id, e.target.value)} disabled={ctx.readOnly} />
}

/** ตรวจว่าแถวพร้อมกดบันทึก — ต้องมีภาพ; ถ้า locMsg ไม่ใช่ null ต้องมี Location ด้วย (locMsg = ข้อความเตือน) */
export function rowReady(ctx: GrRowCtx, job: JobView, locMsg: string | null) {
  const hasPhoto = ctx.inp.photos(job.id).length > 0
  const validLoc = locMsg === null || isValidGrLoc(ctx.inp.loc(job.id))
  const reason = !hasPhoto ? 'ต้องถ่ายภาพก่อน' : !validLoc ? (locMsg ?? undefined) : undefined
  return { ok: hasPhoto && validLoc, reason, loc: ctx.inp.loc(job.id).trim().toUpperCase(), photos: ctx.inp.photos(job.id) }
}
