'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Search, Download, RefreshCw, Plus } from 'lucide-react'
import StageBadge from '@/components/ui/StageBadge'
import SlaTag from '@/components/ui/SlaTag'
import { JobStage } from '@prisma/client'

interface Job {
  id: string
  jobNo: string
  type: string
  stage: JobStage
  channel: string | null
  customerName: string | null
  productName: string
  brandName: string
  openedAt: string
  branch: { name: string; nickname: string }
  vendorCenter?: { code: string; vendorParent: { name: string } } | null
  slaClocks: Array<{
    breached: boolean
    startedAt: string
    dueAt: string
    pausedMinutes: number
    stoppedAt: string | null
    status: string
    slaStep: { code: string; ownerDept: string; hours: number }
  }>
  charges: Array<{ amount: number; type: string }>
  payments: Array<{ amount: number; status: string }>
}

const CHANNEL_LABELS: Record<string, string> = { DC: 'DC', DSD: 'DSD', TPL: '3PL' }

const KPI_FILTERS = [
  { label: 'ทั้งหมด', key: 'all', color: 'var(--text-2)' },
  { label: 'เกิน SLA', key: 'overdue', color: 'var(--red)' },
  { label: 'รอลูกค้าอนุมัติ', key: 'waiting', color: 'var(--amber)' },
  { label: 'กำลังซ่อม', key: 'repairing', color: 'var(--blue)' },
  { label: 'พร้อมรับ', key: 'pickup', color: 'var(--green)' },
  { label: 'ปิดวันนี้', key: 'closed_today', color: 'var(--text-2)' },
]

function getBalance(charges: Job['charges'], payments: Job['payments']) {
  const totalCharge = charges.reduce((s, c) => s + c.amount, 0)
  const totalPaid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
  return totalCharge - totalPaid
}

function getActiveClock(job: Job) {
  return job.slaClocks.find(c => c.status === 'RUNNING' || c.status === 'PAUSED')
}

function hoursIn(clock: Job['slaClocks'][0]) {
  const end = clock.stoppedAt ? new Date(clock.stoppedAt) : new Date()
  const ms = end.getTime() - new Date(clock.startedAt).getTime() - clock.pausedMinutes * 60000
  return Math.floor(Math.max(0, ms) / 3600000)
}

interface JobsClientProps {
  initialJobs: Job[]
  user: { role: string; siteId: string | null }
}

export default function JobsClient({ initialJobs, user }: JobsClientProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [search, setSearch] = useState('')
  const [kpiFilter, setKpiFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Job | null>(null)

  const today = new Date().toDateString()

  const filtered = jobs.filter(job => {
    if (search) {
      const q = search.toLowerCase()
      if (!job.jobNo.toLowerCase().includes(q) && !(job.customerName ?? '').toLowerCase().includes(q) && !job.productName.toLowerCase().includes(q)) return false
    }
    if (kpiFilter === 'overdue') return job.slaClocks.some(c => c.breached)
    if (kpiFilter === 'waiting') return job.stage === 'WAITING_APPROVAL'
    if (kpiFilter === 'repairing') return job.stage === 'REPAIRING'
    if (kpiFilter === 'pickup') return job.stage === 'READY_FOR_PICKUP'
    if (kpiFilter === 'closed_today') return ['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED'].includes(job.stage) // && same day check simplified
    return true
  })

  const kpiCounts = {
    all: jobs.length,
    overdue: jobs.filter(j => j.slaClocks.some(c => c.breached)).length,
    waiting: jobs.filter(j => j.stage === 'WAITING_APPROVAL').length,
    repairing: jobs.filter(j => j.stage === 'REPAIRING').length,
    pickup: jobs.filter(j => j.stage === 'READY_FOR_PICKUP').length,
    closed_today: jobs.filter(j => ['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED'].includes(j.stage)).length,
  }

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/jobs?limit=100')
      const data = await res.json()
      setJobs(data.jobs ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>งานซ่อมทั้งหมด</h1>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={loading} className="p-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--text-2)' }} />
          </button>
          {['CS', 'ADMIN'].includes(user.role) && (
            <Link href="/cs/new" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--red)' }}>
              <Plus size={16} /> เปิดใบแจ้งซ่อม
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-3">
        {KPI_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setKpiFilter(f.key)}
            className={`card text-left transition-all ${kpiFilter === f.key ? 'ring-2' : 'hover:shadow-sm'}`}
            style={{ ringColor: f.color } as any}
          >
            <div className="text-2xl font-bold" style={{ color: kpiFilter === f.key ? f.color : 'var(--text)' }}>
              {kpiCounts[f.key as keyof typeof kpiCounts]}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-mute)' }}>{f.label}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="card flex items-center gap-3 py-3">
        <Search size={16} style={{ color: 'var(--text-mute)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาเลขงาน / ชื่อลูกค้า / สินค้า..."
          className="flex-1 text-sm outline-none"
          style={{ background: 'transparent', color: 'var(--text)' }}
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs" style={{ color: 'var(--text-mute)' }}>ล้าง</button>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>
              <th className="px-4 py-3 text-left font-medium">เลขงาน</th>
              <th className="px-4 py-3 text-left font-medium">ลูกค้า</th>
              <th className="px-4 py-3 text-left font-medium">สินค้า</th>
              <th className="px-4 py-3 text-left font-medium">สถานะ</th>
              <th className="px-4 py-3 text-left font-medium">ช่องทาง</th>
              <th className="px-4 py-3 text-left font-medium">สาขา</th>
              <th className="px-4 py-3 text-left font-medium">VD</th>
              <th className="px-4 py-3 text-left font-medium">SLA</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-mute)' }}>
                  ไม่พบงานในเงื่อนไขนี้
                </td>
              </tr>
            )}
            {filtered.map(job => {
              const clock = getActiveClock(job)
              const isOverdue = job.slaClocks.some(c => c.breached)
              return (
                <tr
                  key={job.id}
                  onClick={() => setSelected(job)}
                  className="border-b cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <td className="px-4 py-3 font-mono font-medium" style={{ color: isOverdue ? 'var(--red)' : 'var(--text)' }}>
                    {job.jobNo}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{job.customerName ?? '-'}</td>
                  <td className="px-4 py-3">
                    <div style={{ color: 'var(--text)' }}>{job.productName}</div>
                    <div className="text-xs" style={{ color: 'var(--text-mute)' }}>{job.brandName}</div>
                  </td>
                  <td className="px-4 py-3"><StageBadge stage={job.stage} size="sm" /></td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-2)' }}>{job.channel ? CHANNEL_LABELS[job.channel] : '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-2)' }}>{job.branch.nickname}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-2)' }}>{job.vendorCenter?.vendorParent.name ?? '-'}</td>
                  <td className="px-4 py-3">
                    {clock ? (
                      <SlaTag hoursInStep={hoursIn(clock)} slaHours={clock.slaStep.hours} isOverdue={clock.breached} ownerDept={clock.slaStep.ownerDept} />
                    ) : <span className="text-xs" style={{ color: 'var(--text-mute)' }}>-</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Job Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <span className="font-mono font-bold text-base" style={{ color: selected.slaClocks.some(c => c.breached) ? 'var(--red)' : 'var(--text)' }}>
                  {selected.jobNo}
                </span>
                <StageBadge stage={selected.stage} size="sm" />
              </div>
              <button onClick={() => setSelected(null)} className="text-2xl font-light" style={{ color: 'var(--text-2)' }}>×</button>
            </div>
            <div className="overflow-y-auto p-6 grid grid-cols-2 gap-6">
              {/* Left: Job info */}
              <div className="space-y-3 text-sm">
                <h3 className="font-semibold" style={{ color: 'var(--text)' }}>ข้อมูลงาน</h3>
                <div><span style={{ color: 'var(--text-2)' }}>ลูกค้า:</span> <span className="font-medium">{selected.customerName ?? '-'}</span></div>
                <div><span style={{ color: 'var(--text-2)' }}>สินค้า:</span> <span className="font-medium">{selected.productName}</span></div>
                <div><span style={{ color: 'var(--text-2)' }}>ยี่ห้อ:</span> {selected.brandName}</div>
                <div><span style={{ color: 'var(--text-2)' }}>ช่องทาง:</span> {selected.channel ? CHANNEL_LABELS[selected.channel] : '-'}</div>
                <div><span style={{ color: 'var(--text-2)' }}>สาขา:</span> {selected.branch.name}</div>
                <div><span style={{ color: 'var(--text-2)' }}>VD:</span> {selected.vendorCenter?.vendorParent.name ?? 'ยังไม่ได้กำหนด'}</div>
                <div><span style={{ color: 'var(--text-2)' }}>ยอดค้างชำระ:</span> <span className="font-medium text-overdue">฿{getBalance(selected.charges, selected.payments).toLocaleString()}</span></div>
                <Link
                  href={`/jobs/${selected.id}`}
                  className="block w-full text-center py-2 rounded-lg text-sm font-medium text-white mt-4"
                  style={{ background: 'var(--red)' }}
                >
                  ดูรายละเอียดเต็ม
                </Link>
              </div>
              {/* Right: Timeline placeholder */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Timeline</h3>
                <div className="text-xs" style={{ color: 'var(--text-mute)' }}>ขั้นตอนการดำเนินงาน</div>
                <div className="space-y-1 text-xs" style={{ color: 'var(--text-2)' }}>
                  <div>● เปิดงาน → {new Date(selected.openedAt).toLocaleDateString('th-TH')}</div>
                  <div className="font-medium" style={{ color: 'var(--amber)' }}>◉ {selected.stage}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
