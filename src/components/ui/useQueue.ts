'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/lib/client'
import { resolveDestination } from '@/lib/queue-destination'
import { useToast } from './Toast'
import type { JobView } from '@/lib/job-view'
import type { OverdueItem } from './Queue'
import type { Photo } from './PhotoButton'

export interface QueueData { tabs: Record<string, JobView[]>; overdue: OverdueItem[]; labels?: Record<string, string> }

export interface RunOptions {
  /** ไม่แสดง toast สำเร็จ */
  silent?: boolean
  /** default true — รีเฟรชคิวหลังทำ action; false = แสดงแถวจาง + badge จน refresh (แบบเดิม) */
  reload?: boolean
}

interface ActionResult { stage?: string; extra?: Record<string, unknown> }

export function useQueue(
  dept: string,
  range?: { from: string; to: string },
  filter?: { branchId?: string; vendorCenterId?: string },
  /** เรียกหลัง action สำเร็จ เช่น ล้างภาพ/Location ของแถว, focus ช่องสแกน */
  onSuccess?: (jobId: string) => void,
) {
  const [data, setData] = useState<QueueData>({ tabs: {}, overdue: [] })
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState<Record<string, string>>({}) // jobId → label (ใช้เมื่อ reload: false)
  const [busy, setBusy] = useState<string | null>(null)
  const { toast } = useToast()
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const reload = useCallback(async (keepDone = false): Promise<QueueData | null> => {
    try {
      const qs = new URLSearchParams()
      if (range?.from) qs.set('from', range.from)
      if (range?.to) qs.set('to', range.to)
      if (filter?.branchId) qs.set('branchId', filter.branchId)
      if (filter?.vendorCenterId) qs.set('vendorCenterId', filter.vendorCenterId)
      const d = await api<QueueData>(`/api/queues/${dept}${qs.toString() ? `?${qs}` : ''}`)
      setData(d)
      if (!keepDone) setDone({})
      return d
    } catch (e) {
      toast(e instanceof Error ? e.message : 'โหลดคิวไม่สำเร็จ', 'error')
      return null
    } finally {
      setLoading(false)
    }
  }, [dept, range?.from, range?.to, filter?.branchId, filter?.vendorCenterId, toast])

  useEffect(() => { reload() }, [reload])

  /** เรียก action; สำเร็จ → รีเฟรชคิว + toast บอกปลายทาง; ปุ่มถูกล็อก (busy) จนรีเฟรชเสร็จ */
  const run = useCallback(async (job: JobView, action: string, body: Record<string, unknown> = {}, doneLabel = 'เสร็จแล้ว', opts?: RunOptions) => {
    const autoReload = opts?.reload !== false
    setBusy(job.id + action)
    try {
      let r: ActionResult
      try {
        r = await api<ActionResult>(`/api/jobs/${job.id}/action`, { body: { action, version: job.version, ...body } })
      } catch (e) {
        toast(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด', 'error')
        if (autoReload) await reload(true) // ให้เห็นสถานะล่าสุด (เช่น มีคนทำงานนี้ไปแล้ว)
        return null
      }
      if (autoReload) {
        const fresh = await reload()
        const dest = fresh ? resolveDestination({ jobId: job.id, stage: r.stage, tabs: fresh.tabs, labels: fresh.labels }) : null
        if (!opts?.silent) toast(`${job.jobNo}: ${doneLabel}${dest ? ` → ${dest}` : ''}`, 'success')
      } else {
        setDone(d => ({ ...d, [job.id]: doneLabel }))
        if (!opts?.silent) toast(`${job.jobNo}: ${doneLabel}`, 'success')
      }
      onSuccessRef.current?.(job.id)
      return r.extra ?? {}
    } finally {
      setBusy(null)
    }
  }, [toast, reload])

  return { data, loading, reload, run, done, busy }
}

/** state ต่อแถว: ภาพ + location */
export function useRowInputs() {
  const [photos, setPhotos] = useState<Record<string, Photo[]>>({})
  const [locs, setLocs] = useState<Record<string, string>>({})
  /** ล้างภาพ + location ของงาน — กันค่าจากขั้นก่อนติดไปขั้นถัดไป */
  const clear = useCallback((id: string) => {
    setPhotos(s => { const next = { ...s }; delete next[id]; return next })
    setLocs(s => { const next = { ...s }; delete next[id]; return next })
  }, [])
  return {
    photos: (id: string) => photos[id] ?? [],
    setPhotos: (id: string, p: Photo[]) => setPhotos(s => ({ ...s, [id]: p })),
    loc: (id: string) => locs[id] ?? '',
    setLoc: (id: string, v: string) => setLocs(s => ({ ...s, [id]: v })),
    clear,
  }
}
