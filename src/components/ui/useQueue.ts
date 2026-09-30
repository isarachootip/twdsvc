'use client'

import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/client'
import { useToast } from './Toast'
import type { JobView } from '@/lib/job-view'
import type { OverdueItem } from './Queue'
import type { Photo } from './PhotoButton'

export interface QueueData { tabs: Record<string, JobView[]>; overdue: OverdueItem[] }

export function useQueue(
  dept: string,
  range?: { from: string; to: string },
  filter?: { branchId?: string; vendorCenterId?: string }
) {
  const [data, setData] = useState<QueueData>({ tabs: {}, overdue: [] })
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState<Record<string, string>>({}) // jobId → label ที่ทำเสร็จในรอบนี้
  const [busy, setBusy] = useState<string | null>(null)
  const { toast } = useToast()

  const reload = useCallback(async (keepDone = false) => {
    try {
      const qs = new URLSearchParams()
      if (range?.from) qs.set('from', range.from)
      if (range?.to) qs.set('to', range.to)
      if (filter?.branchId) qs.set('branchId', filter.branchId)
      if (filter?.vendorCenterId) qs.set('vendorCenterId', filter.vendorCenterId)
      const d = await api<QueueData>(`/api/queues/${dept}${qs.toString() ? `?${qs}` : ''}`)
      setData(d)
      if (!keepDone) setDone({})
    } catch (e) {
      toast(e instanceof Error ? e.message : 'โหลดคิวไม่สำเร็จ', 'error')
    } finally {
      setLoading(false)
    }
  }, [dept, range?.from, range?.to, filter?.branchId, filter?.vendorCenterId, toast])

  useEffect(() => { reload() }, [reload])

  /** เรียก action; สำเร็จ → แถวแสดงจาง + badge เขียว จน refresh (optimistic UI ตาม 07) */
  const run = useCallback(async (job: JobView, action: string, body: Record<string, unknown> = {}, doneLabel = 'เสร็จแล้ว', opts?: { silent?: boolean; reload?: boolean }) => {
    setBusy(job.id + action)
    try {
      const r = await api<{ extra: Record<string, unknown> }>(`/api/jobs/${job.id}/action`, { body: { action, version: job.version, ...body } })
      setDone(d => ({ ...d, [job.id]: doneLabel }))
      if (!opts?.silent) toast(`${job.jobNo}: ${doneLabel}`, 'success')
      if (opts?.reload) await reload(true)
      return r.extra ?? {}
    } catch (e) {
      toast(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด', 'error')
      return null
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
  return {
    photos: (id: string) => photos[id] ?? [],
    setPhotos: (id: string, p: Photo[]) => setPhotos(s => ({ ...s, [id]: p })),
    loc: (id: string) => locs[id] ?? '',
    setLoc: (id: string, v: string) => setLocs(s => ({ ...s, [id]: v })),
  }
}
