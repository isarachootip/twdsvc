'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import JobDetailModal from '@/components/jobs/JobDetail'
import { useSort } from '@/components/ui/Sortable'
import { DateRange } from '@/components/ui/Queue'
import { useToast } from '@/components/ui/Toast'
import { api, exportXlsx, monthStartBkk, todayBkk } from '@/lib/client'
import { CHANNEL_LABELS, OWNER_LABELS, STAGE_ORDER, fmtDateTime, type Stage } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'
import JobsTable, { ownerOf } from './components/JobsTable'
import JobsFilterBar from './components/JobsFilterBar'
import JobsKpiCards, { matchFlag } from './components/JobsKpiCards'

export interface JobsClientProps {
  role?: string
  user?: { role: string; siteId?: string | null }
  initialJobs?: JobView[]
}

export default function JobsClient({ role: initialRole, user, initialJobs }: JobsClientProps) {
  const role = initialRole ?? user?.role ?? 'CS'
  const sp = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const hasSpecificFilter = Boolean(sp.get('open') || sp.get('search') || sp.get('stage') || sp.get('stages') || sp.get('flag') || sp.get('overdue'))
  const [from, setFrom] = useState(hasSpecificFilter ? '' : monthStartBkk())
  const [to, setTo] = useState(hasSpecificFilter ? '' : todayBkk())

  const [jobs, setJobs] = useState<JobView[]>(initialJobs && initialJobs.length > 0 ? initialJobs : [])
  const [loading, setLoading] = useState<boolean>(!initialJobs || initialJobs.length === 0)

  const initialFlag = sp.get('flag') ?? (sp.get('overdue') === 'true' || sp.get('overdue') === '1' ? 'overdue' : null)
  const [flag, setFlag] = useState<string | null>(initialFlag)
  const [branch, setBranch] = useState('')
  const [channel, setChannel] = useState('')
  const [status, setStatus] = useState(sp.get('stage') ?? '')
  const [stageGroup, setStageGroup] = useState<string[]>((sp.get('stages') ?? '').split(',').filter(Boolean))
  const [search, setSearch] = useState(sp.get('search') ?? '')
  const [openId, setOpenId] = useState<string | null>(sp.get('open'))
  const [sysTime, setSysTime] = useState<string>('')

  useEffect(() => {
    const update = () => setSysTime(fmtDateTime(new Date()))
    update()
    const timer = setInterval(update, 10000)
    return () => clearInterval(timer)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ limit: '1000' })
      if (from) qs.set('from', from)
      if (to) qs.set('to', to)
      const d = await api<{ jobs: JobView[] }>(`/api/jobs?${qs}`)
      setJobs(d.jobs ?? [])
    } catch (e) {
      toast(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ', 'error')
    } finally {
      setLoading(false)
    }
  }, [from, to, toast])

  useEffect(() => {
    if (!initialJobs || initialJobs.length === 0) load()
  }, [load, initialJobs])

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
      if (status && j.stage !== status) return false
      if (stageGroup.length && !stageGroup.includes(j.stage)) return false
      if (q) {
        const hit = j.jobNo.toLowerCase().includes(q) || (j.customerName ?? '').toLowerCase().includes(q) || j.productName.toLowerCase().includes(q) ||
          (digits.length >= 3 && (j.customerPhone ?? '').replace(/\D/g, '').includes(digits))
        if (!hit) return false
      }
      return true
    })
  }, [jobs, branch, channel, status, search, stageGroup])

  const filtered = useMemo(() => base.filter(j => matchFlag(j, flag)), [base, flag])

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

  const doExport = () => exportXlsx([{
    name: 'งานซ่อม',
    rows: sorted.map(j => ({
      'เลขที่ใบแจ้งซ่อม': j.jobNo,
      'วัน-เวลาระบบ (เข้าสถานะ)': fmtDateTime(j.stageEnteredAt),
      'วันที่เปิด': new Date(j.openedAt).toLocaleDateString('th-TH'),
      'ลูกค้า': j.customerName ?? '',
      'เบอร์โทร': j.customerPhone ?? '',
      'สินค้า': j.productName,
      'แบรนด์': j.brandName,
      'สาขา': j.branch.name,
      'ช่องทาง': j.channel ? CHANNEL_LABELS[j.channel] : '',
      'สถานะ': j.stageLabel,
      'ส่วนงานที่รับผิดชอบ': OWNER_LABELS[ownerOf(j) ?? ''] ?? '',
      'ชั่วโมงใน step นี้': j.sla?.hoursInStep ?? '',
      'SLA (ชม.)': j.sla?.slaHours ?? '',
      'เกิน SLA': j.overdue ? 'ใช่' : 'ไม่',
      'ค้างชำระ': j.unpaid ? 'ใช่' : 'ไม่',
      'ศูนย์ซ่อม': j.vendor ? `${j.vendor.code} ${j.vendor.name}` : '',
    })),
  }], `service_center_jobs_${todayBkk()}.xlsx`)

  return (
    <div className="page">
      <div className="toprow">
        <div>
          <p className="page-title">งานซ่อมทั้งหมด</p>
          <p className="page-sub">
            กดที่ตัวเลขเพื่อดูเฉพาะรายการเร่งด่วนตามส่วนงานที่รับผิดชอบ SLA
            {sysTime && <span style={{ marginLeft: 8 }}>· วันและเวลาระบบ: <b>{sysTime}</b></span>}
          </p>
        </div>
        <DateRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} onExport={doExport} />
      </div>

      <JobsKpiCards jobs={base} flag={flag} onToggleFlag={k => setFlag(flag === k ? null : k)} />

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
        onChanged={load}
      />
    </div>
  )
}
