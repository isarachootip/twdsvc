'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import StageBadge from '@/components/ui/StageBadge'
import JobDetailModal from '@/components/jobs/JobDetail'
import { useSort, Th } from '@/components/ui/Sortable'
import { DateRange } from '@/components/ui/Queue'
import { useToast } from '@/components/ui/Toast'
import { api, exportXlsx, monthStartBkk, todayBkk } from '@/lib/client'
import { CHANNEL_LABELS, OWNER_LABELS, STAGE_LABELS, STAGE_ORDER, fmtPhone, type Stage } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'

interface Kpis { total: number; GR: number; VD: number; transport: number; CS: number; unpaid: number }

const KPI_DEFS: Array<{ key: string | null; label: string; cls: string }> = [
  { key: null, label: 'งานทั้งหมด', cls: 'total' },
  { key: 'GR', label: 'เกิน SLA ฝั่ง GR', cls: 'urgent' },
  { key: 'VD', label: 'เกิน SLA ฝั่ง VD', cls: 'urgent' },
  { key: 'transport', label: 'เกิน SLA ฝั่งขนส่ง (DC/3PL)', cls: 'urgent' },
  { key: 'CS', label: 'เกิน SLA ฝั่ง CS/ลูกค้า', cls: 'urgent' },
  { key: 'unpaid', label: 'ยอดค้างชำระ', cls: 'urgent' },
]

function ownerOf(j: JobView) {
  return j.overdue ? j.overdueOwner : j.sla?.owner ?? null
}

function matchFlag(j: JobView, flag: string | null) {
  if (!flag) return true
  if (flag === 'unpaid') return j.unpaid
  if (!j.overdue) return false
  if (flag === 'overdue') return true
  if (flag === 'transport') return ['DC', 'TPL', 'CARRIER'].includes(j.overdueOwner ?? '')
  if (flag === 'CS') return ['CS', 'CUSTOMER'].includes(j.overdueOwner ?? '')
  return j.overdueOwner === flag
}

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

  // Parse initial filter flags from URL params
  const initialFlag = sp.get('flag') ?? (sp.get('overdue') === 'true' || sp.get('overdue') === '1' ? 'overdue' : null)
  const [flag, setFlag] = useState<string | null>(initialFlag)
  const [branch, setBranch] = useState('')
  const [channel, setChannel] = useState('')
  const [status, setStatus] = useState(sp.get('stage') ?? '')
  const [stageGroup, setStageGroup] = useState<string[]>((sp.get('stages') ?? '').split(',').filter(Boolean))
  const [search, setSearch] = useState(sp.get('search') ?? '')
  const [openId, setOpenId] = useState<string | null>(sp.get('open'))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ limit: '1000' })
      if (from) qs.set('from', from)
      if (to) qs.set('to', to)
      const d = await api<{ jobs: JobView[]; kpis: Kpis }>(`/api/jobs?${qs}`)
      setJobs(d.jobs ?? [])
    } catch (e) {
      toast(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ', 'error')
    } finally {
      setLoading(false)
    }
  }, [from, to, toast])

  // Always fetch on mount if jobs are empty or to ensure sync
  useEffect(() => {
    if (!initialJobs || initialJobs.length === 0) {
      load()
    }
  }, [load, initialJobs])

  // Synchronize when searchParams change
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

  const kpiCount = (key: string | null) => base.filter(j => matchFlag(j, key)).length
  const filtered = useMemo(() => base.filter(j => matchFlag(j, flag)), [base, flag])

  const { sorted, sort, toggle } = useSort(filtered, {
    id: j => j.jobNo,
    customer: j => j.customerName ?? '',
    product: j => j.productName,
    branch: j => j.branch.name,
    channel: j => j.channel ?? '',
    status: j => STAGE_ORDER.indexOf(j.stage as Stage),
    owner: j => ownerOf(j) ?? '',
    hours: j => j.sla?.hoursInStep ?? 0,
  }, { key: 'id', dir: -1 })

  const flags = (j: JobView) => {
    const out: string[] = []
    if (j.overdue) out.push(`เกิน SLA (${OWNER_LABELS[j.overdueOwner ?? ''] ?? j.overdueOwner})`)
    if (j.unpaid) out.push('ค้างชำระ')
    if (j.intakeUnpaid && ['CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT'].includes(j.stage)) out.push('รอชำระค่าดำเนินการ')
    if (j.stage === 'PENDING_VENDOR_ASSIGNMENT') out.push('รอกำหนดศูนย์ซ่อม')
    return out
  }

  const doExport = () => exportXlsx([{
    name: 'งานซ่อม',
    rows: sorted.map(j => ({
      'เลขที่ใบแจ้งซ่อม': j.jobNo,
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
          <p className="page-sub">กดที่ตัวเลขเพื่อดูเฉพาะรายการเร่งด่วนตามส่วนงานที่รับผิดชอบ SLA</p>
        </div>
        <DateRange from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t) }} onExport={doExport} />
      </div>

      <div className="kpi-grid">
        {KPI_DEFS.map(k => (
          <button
            key={k.label}
            className={`kpi-card ${k.cls} ${flag === k.key && k.key !== null ? 'active' : ''}`}
            onClick={() => setFlag(flag === k.key ? null : k.key)}
          >
            <div className="num">{kpiCount(k.key)}</div>
            <div className="lbl">{k.label}</div>
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <select className="sel" value={branch} onChange={e => setBranch(e.target.value)}>
          <option value="">ทุกสาขา</option>
          {branches.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select className="sel" value={channel} onChange={e => setChannel(e.target.value)}>
          <option value="">ทุกช่องทาง</option>
          <option value="DSD">DSD</option>
          <option value="DC">DC</option>
          <option value="TPL">3PL</option>
        </select>
        <select className="sel" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">ทุกสถานะ</option>
          {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
        </select>
        <input
          className="inp"
          style={{ flex: 1, minWidth: 220 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหา: เลขที่ใบแจ้งซ่อม / ชื่อลูกค้า / เบอร์โทร"
        />
        {flag && <button className="clear-filter" onClick={() => setFlag(null)}>✕ ล้างตัวกรองรายการเร่งด่วน</button>}
        {stageGroup.length > 0 && <button className="clear-filter" onClick={() => setStageGroup([])}>✕ ล้างตัวกรองกลุ่มสถานะ ({stageGroup.length})</button>}
        {status && <button className="clear-filter" onClick={() => setStatus('')}>✕ ล้างสถานะ</button>}
        {['CS', 'ADMIN'].includes(role) && (
          <button className="btn btn-primary" onClick={() => router.push('/cs/new')}>+ เปิดใบแจ้งซ่อม</button>
        )}
      </div>

      <div className="tcard">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <Th k="id" label="เลขที่ใบแจ้งซ่อม" sort={sort} toggle={toggle} />
                <Th k="customer" label="ลูกค้า" sort={sort} toggle={toggle} />
                <Th k="product" label="สินค้า" sort={sort} toggle={toggle} />
                <Th k="branch" label="สาขา" sort={sort} toggle={toggle} />
                <Th k="channel" label="ช่องทาง" sort={sort} toggle={toggle} />
                <Th k="status" label="สถานะ" sort={sort} toggle={toggle} />
                <Th k="owner" label="ส่วนงานที่รับผิดชอบ" sort={sort} toggle={toggle} />
                <Th k="hours" label="อยู่ใน step นี้มา" sort={sort} toggle={toggle} />
                <th>หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} className="empty">กำลังโหลด…</td></tr>}
              {!loading && sorted.length === 0 && <tr><td colSpan={9} className="empty">ไม่พบรายการที่ตรงกับตัวกรอง</td></tr>}
              {!loading && sorted.map(j => (
                <tr key={j.id} className="clickable" onClick={() => setOpenId(j.id)}>
                  <td>
                    <div className={`jobid ${j.overdue ? 'overdue' : ''}`}>{j.jobNo}</div>
                    <div className="sub-mute">{new Date(j.openedAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                  </td>
                  <td>{j.type === 'STOCK' ? <span className="sub-mute">สต็อกสาขา</span> : j.customerName}<div className="sub-mute">{j.customerPhone && !j.customerPhone.includes('x') ? fmtPhone(j.customerPhone) : j.customerPhone}</div></td>
                  <td>{j.productName}<div className="sub-mute">{j.brandName}</div></td>
                  <td>{j.branch.name}</td>
                  <td>{j.channel ? CHANNEL_LABELS[j.channel] : '-'}</td>
                  <td><StageBadge stage={j.stage} intakeUnpaid={j.intakeUnpaid} /></td>
                  <td>{OWNER_LABELS[ownerOf(j) ?? ''] ?? '-'}</td>
                  <td>{j.sla ? <>{j.sla.hoursInStep} ชม.<div className="sub-mute">SLA {j.sla.slaHours} ชม.</div></> : '-'}</td>
                  <td>{flags(j).length ? <span className="flag">{flags(j).join(', ')}</span> : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <JobDetailModal
        jobId={openId}
        role={role}
        onClose={() => {
          setOpenId(null)
          if (sp.get('open')) {
            router.replace('/jobs')
          }
        }}
        onChanged={load}
      />
    </div>
  )
}
