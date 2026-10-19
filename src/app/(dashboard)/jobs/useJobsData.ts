'use client'

import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { api } from '@/lib/client'
import type { JobView } from '@/lib/job-view'
import type { SlaKpis } from '@/lib/sla-summary'
import { isJobNoFormat } from '@/lib/business-rules'

export interface JobsDataParams {
  from: string
  to: string
  flag: string | null
  branch: string
  channel: string
  status?: string
  stageGroup?: string[]
  search?: string
  initialJobs?: JobView[]
}

/**
 * ข้อมูลหน้า /jobs แยกเป็น 2 ส่วน:
 *  - ตาราง: ค่าเริ่มต้น (การ์ด "งานทั้งหมด") แสดงงานที่ยังไม่ปิดทั้งหมดทุกช่วงเวลา (open=1)
 *           หากผู้ใช้เลือกช่วงวันที่หรือกรองสถานะปิดงาน จึงดึงตามช่วงวันที่/สถานะนั้น
 *  - การ์ด SLA: นับจากงานที่ยังไม่ปิดทั้งหมด ขึ้นกับสาขา/ช่องทางที่เลือกเท่านั้น
 */
export function useJobsData({ from, to, flag, branch, channel, status = '', stageGroup = [], search = '', initialJobs }: JobsDataParams) {
  const { toast } = useToast()
  const hasInitial = Boolean(initialJobs && initialJobs.length > 0)
  const [jobs, setJobs] = useState<JobView[]>(hasInitial ? (initialJobs ?? []) : [])
  const [loading, setLoading] = useState<boolean>(!hasInitial)
  const [kpis, setKpis] = useState<SlaKpis | null>(null)
  const jobNoQuery = isJobNoFormat(search) ? search.trim() : ''
  const hasStageFilter = Boolean(status) || stageGroup.length > 0

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ limit: '1000', kpis: '0' })
      if (flag) {
        qs.set('flag', flag)
      } else if (jobNoQuery) {
        qs.set('search', jobNoQuery)
      } else if (!from && !to && !hasStageFilter) {
        qs.set('open', '1')
      } else {
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
  }, [from, to, flag, jobNoQuery, hasStageFilter, toast])

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
