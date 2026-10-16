'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { api } from '@/lib/client'
import type { JobView } from '@/lib/job-view'
import type { SlaKpis } from '@/lib/sla-summary'

export interface JobsDataParams {
  from: string
  to: string
  flag: string | null
  branch: string
  channel: string
  initialJobs?: JobView[]
}

/**
 * ข้อมูลหน้า /jobs แยกเป็น 2 ส่วน:
 *  - ตาราง: ใช้ช่วงวันที่ — แต่เมื่อเลือกการ์ด จะแสดงงานเปิดทั้งหมดของการ์ดนั้น (ตรงกับตัวเลข) ไม่ใช้วันที่
 *  - การ์ด SLA: นับจากงานที่ยังไม่ปิดทั้งหมด ขึ้นกับสาขา/ช่องทางที่เลือกเท่านั้น
 */
export function useJobsData({ from, to, flag, branch, channel, initialJobs }: JobsDataParams) {
  const { toast } = useToast()
  const hasInitial = Boolean(initialJobs && initialJobs.length > 0)
  const [jobs, setJobs] = useState<JobView[]>(hasInitial ? (initialJobs ?? []) : [])
  const [loading, setLoading] = useState<boolean>(!hasInitial)
  const [kpis, setKpis] = useState<SlaKpis | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ limit: '1000', kpis: '0' })
      if (flag) qs.set('flag', flag)
      else {
        if (from) qs.set('from', from)
        if (to) qs.set('to', to)
      }
      const d = await api<{ jobs: JobView[] }>(`/api/jobs?${qs}`)
      setJobs(d.jobs ?? [])
    } catch (e) {
      toast(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ', 'error')
    } finally {
      setLoading(false)
    }
  }, [from, to, flag, toast])

  const loadKpis = useCallback(async () => {
    try {
      const qs = new URLSearchParams({ limit: '1' })
      if (branch) qs.set('branchId', branch)
      if (channel) qs.set('channel', channel)
      const d = await api<{ kpis: SlaKpis | null }>(`/api/jobs?${qs}`)
      setKpis(d.kpis)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'โหลดตัวเลข SLA ไม่สำเร็จ', 'error')
    }
  }, [branch, channel, toast])

  useEffect(() => {
    if (!hasInitial) load()
  }, [load, hasInitial])

  useEffect(() => { loadKpis() }, [loadKpis])

  const reloadAll = useCallback(() => { load(); loadKpis() }, [load, loadKpis])

  return { jobs, loading, kpis, reloadAll }
}
