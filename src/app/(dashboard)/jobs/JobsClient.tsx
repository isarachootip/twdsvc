'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import JobDetailModal from '@/components/jobs/JobDetail'
import { useSort } from '@/components/ui/Sortable'
import { DateRange } from '@/components/ui/Queue'
import { monthStartBkk, todayBkk } from '@/lib/client'
import { STAGE_ORDER, fmtDateTime, type Stage } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'
import { matchesStatusFilter } from '@/lib/job-status-filter'
import JobsTable, { ownerOf } from './components/JobsTable'
import JobsFilterBar from './components/JobsFilterBar'
import JobsKpiCards from './components/JobsKpiCards'
import { exportJobsXlsx } from './components/jobs-export'
import { useJobsData } from './useJobsData'

export interface JobsClientProps {
  role?: string
  user?: { role: string; siteId?: string | null }
  initialJobs?: JobView[]
}

export default function JobsClient({ role: initialRole, user, initialJobs }: JobsClientProps) {
  const role = initialRole ?? user?.role ?? 'CS'
  const sp = useSearchParams()
  const router = useRouter()

  const hasSpecificFilter = Boolean(sp.get('open') || sp.get('search') || sp.get('stage') || sp.get('stages') || sp.get('flag') || sp.get('overdue'))
  const [from, setFrom] = useState(hasSpecificFilter ? '' : monthStartBkk())
  const [to, setTo] = useState(hasSpecificFilter ? '' : todayBkk())

  const initialFlag = sp.get('flag') ?? (sp.get('overdue') === 'true' || sp.get('overdue') === '1' ? 'overdue' : null)
  const [flag, setFlag] = useState<string | null>(initialFlag)
  const [branch, setBranch] = useState('')
  const [channel, setChannel] = useState('')
  const [status, setStatus] = useState(sp.get('stage') ?? '')
  const [stageGroup, setStageGroup] = useState<string[]>((sp.get('stages') ?? '').split(',').filter(Boolean))
  const [search, setSearch] = useState(sp.get('search') ?? '')
  const [openId, setOpenId] = useState<string | null>(sp.get('open'))
  const [sysTime, setSysTime] = useState<string>('')
  const { jobs, loading, kpis, reloadAll } = useJobsData({ from, to, flag, branch, channel, initialJobs })

  useEffect(() => {
    const update = () => setSysTime(fmtDateTime(new Date()))
    update()
    const timer = setInterval(update, 10000)
    return () => clearInterval(timer)
  }, [])


  useEffect(() => {
    const o = sp.get('open')
    if (o) setOpenId(o)
    const s = sp.get('search')
    if (s !== null) setSearch(s)
    const stg = sp.get('stage')
    if (stg !== null) setStatus(stg)
    const stgs = sp.get('stages')
    if (stgs !== null) setStageGroup(stgs.split(',').filter(Boolean))
    const isOverdue = sp.get('overdue') === 'true' || sp.get('overdue') === '1'
    const flg = sp.get('flag')
    if (isOverdue) setFlag('overdue')
    else if (flg !== null) setFlag(flg)
  }, [sp])

  const branches = useMemo(() => [...new Map(jobs.map(j => [j.branch.id, j.branch.name])).entries()], [jobs])

  const base = useMemo(() => {
    const q = search.trim().toLowerCase()
    const digits = q.replace(/\D/g, '')
    return jobs.filter(j => {
      if (branch && j.branch.id !== branch) return false
      if (channel && j.channel !== channel) return false
      if (!matchesStatusFilter(j, status)) return false
      if (stageGroup.length && !stageGroup.includes(j.stage)) return false
      if (q) {
        const hit = j.jobNo.toLowerCase().includes(q) || (j.customerName ?? '').toLowerCase().includes(q) || j.productName.toLowerCase().includes(q) ||
          (digits.length >= 3 && (j.customerPhone ?? '').replace(/\D/g, '').includes(digits))
        if (!hit) return false
      }
      return true
    })
  }, [jobs, branch, channel, status, search, stageGroup])

  // เมื่อเลือกการ์ด เซิร์ฟเวอร์คัดรายการตามการ์ดนั้นมาให้แล้ว (flag) จึงไม่กรองซ้ำฝั่ง client
  const filtered = base

  // Default sorting: Latest item that entered the current state (stageEnteredAt desc)
  const { sorted, sort, toggle } = useSort(filtered, {
    id: j => j.jobNo,
    systemTime: j => (j.stageEnteredAt ? new Date(j.stageEnteredAt).getTime() : 0),
    customer: j => j.customerName ?? '',
    product: j => j.productName,
    branch: j => j.branch.name,
    channel: j => j.channel ?? '',
    status: j => STAGE_ORDER.indexOf(j.stage as Stage),
    owner: j => ownerOf(j) ?? '',
    hours: j => j.sla?.hoursInStep ?? 0,
  }, { key: 'systemTime', dir: -1 })

  const doExport = () => exportJobsXlsx(sorted)

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">งานซ่อมทั้งหมด</h1>
            {sysTime && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>วันและเวลาระบบ: {sysTime}</span>
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            กดที่การ์ดตัวเลขเพื่อดูเฉพาะรายการเร่งด่วนตาม SLA หรือค้นหาตามเงื่อนไขด้านล่าง
          </p>
        </div>
        <div className="self-start md:self-auto">
          <DateRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} onExport={doExport} />
        </div>
      </div>

      <JobsKpiCards kpis={kpis} flag={flag} onToggleFlag={k => setFlag(flag === k ? null : k)} />
      {flag && (
        <p className="text-[11px] text-slate-500 -mt-3 mb-4">
          รายการด้านล่างแสดงงานที่ยังไม่ปิดทั้งหมดของการ์ดที่เลือก (ไม่ใช้ช่วงวันที่)
        </p>
      )}

      <JobsFilterBar
        branch={branch}
        setBranch={setBranch}
        branches={branches}
        channel={channel}
        setChannel={setChannel}
        status={status}
        setStatus={setStatus}
        search={search}
        setSearch={setSearch}
        flag={flag}
        setFlag={setFlag}
        stageGroup={stageGroup}
        setStageGroup={setStageGroup}
        role={role}
        onNewJob={() => router.push('/cs/new')}
      />

      <JobsTable
        jobs={sorted}
        sort={sort}
        toggle={toggle}
        loading={loading}
        onOpenJob={setOpenId}
      />

      <JobDetailModal
        jobId={openId}
        role={role}
        onClose={() => {
          setOpenId(null)
          if (sp.get('open')) router.replace('/jobs')
        }}
        onChanged={reloadAll}
      />
    </div>
  )
}
