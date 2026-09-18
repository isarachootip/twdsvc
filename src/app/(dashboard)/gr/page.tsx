'use client'

import { useState, useCallback, useRef } from 'react'
import { RefreshCw, Package, CheckCircle2 } from 'lucide-react'
import StageBadge from '@/components/ui/StageBadge'
import SlaTag from '@/components/ui/SlaTag'
import OverdueBanner from '@/components/ui/OverdueBanner'

interface QueueJob {
  id: string
  jobNo: string
  customerName: string | null
  productName: string
  brandName: string
  channel: string | null
  openedAt: string
  slaClocks: Array<{ breached: boolean; startedAt: string; dueAt: string; pausedMinutes: number; stoppedAt: string | null; status: string; slaStep: { code: string; ownerDept: string; hours: number } }>
}

function hoursIn(clock: QueueJob['slaClocks'][0]) {
  const end = clock.stoppedAt ? new Date(clock.stoppedAt) : new Date()
  const ms = end.getTime() - new Date(clock.startedAt).getTime() - clock.pausedMinutes * 60000
  return Math.floor(Math.max(0, ms) / 3600000)
}

const TABS = [
  { key: 'cs_opened', label: 'รับจาก CS', color: '' },
  { key: 'gr_received', label: 'Pack สินค้า', color: '' },
  { key: 'gr_packed', label: 'ส่งมอบขนส่ง', color: '' },
  { key: 'inbound', label: 'รับคืน', color: '' },
  { key: 'return_received', label: 'ส่งมอบ CS', color: '' },
]

const CHANNEL_COLORS: Record<string, string> = {
  DC: 'var(--blue)',
  DSD: 'var(--green)',
  TPL: 'var(--coral)',
}

const CHANNEL_LABELS: Record<string, string> = {
  DC: '🔵 ส่ง DC',
  DSD: '🟢 ส่ง VD/DSD',
  TPL: '🟠 ส่ง 3PL',
}

export default function GRPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [data, setData] = useState<Record<string, QueueJob[]>>({})
  const [kpis, setKpis] = useState<Record<string, number>>({})
  const [overdueJobs, setOverdueJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [locations, setLocations] = useState<Record<string, string>>({})
  const [doneRows, setDoneRows] = useState<Set<string>>(new Set())
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/queues/GR')
      const d = await res.json()
      setData(d.tabs ?? {})
      setKpis(d.kpis ?? {})
      setOverdueJobs(
        (d.overdueJobs ?? []).map((j: QueueJob, i: number) => {
          const clock = j.slaClocks.find(c => c.breached)
          return { id: j.id, jobNo: j.jobNo, productName: j.productName, stage: '', hoursInStep: clock ? hoursIn(clock) : 0, slaHours: clock?.slaStep.hours ?? 24, tab: 'cs_opened', tabLabel: '\u0e23\u0e31\u0e1a\u0e08\u0e32\u0e01 CS' }
        })
      )
    } finally { setLoading(false) }
  }, [])

  useState(() => { load() })

  const doAction = async (jobId: string, action: string, extra: Record<string, unknown> = {}) => {
    setActionLoading(jobId)
    try {
      const res = await fetch(`/api/jobs/${jobId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      if (res.ok) {
        setDoneRows(prev => new Set([...prev, jobId]))
        setTimeout(() => { load() }, 1000)
      } else {
        const d = await res.json()
        alert(d.error ?? 'เกิดข้อผิดพลาด')
      }
    } finally { setActionLoading(null) }
  }

  const jumpToTab = (tab: string, jobId: string) => {
    const idx = TABS.findIndex(t => t.key === tab)
    if (idx >= 0) { setActiveTab(idx); tabRefs.current[idx]?.scrollIntoView({ behavior: 'smooth' }) }
  }

  const tabJobs = (key: string): QueueJob[] => data[key] ?? []

  const TabContent = () => {
    const key = TABS[activeTab].key

    if (key === 'cs_opened') {
      return (
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>
              <th className="px-4 py-3 text-left font-medium">เลขงาน</th>
              <th className="px-4 py-3 text-left font-medium">สินค้า</th>
              <th className="px-4 py-3 text-left font-medium">SLA</th>
              <th className="px-4 py-3 text-left font-medium">Location (A-00-00)</th>
              <th className="px-4 py-3 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {tabJobs(key).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-mute)' }}>ไม่มีงานในคิวนี้</td></tr>}
            {tabJobs(key).map(job => {
              const done = doneRows.has(job.id)
              const clock = job.slaClocks[0]
              return (
                <tr key={job.id} className="border-b transition-opacity" style={{ borderColor: 'var(--border)', opacity: done ? 0.4 : 1 }}>
                  <td className="px-4 py-3 font-mono font-medium" style={{ color: job.slaClocks.some(c => c.breached) ? 'var(--red)' : 'var(--text)' }}>{job.jobNo}</td>
                  <td className="px-4 py-3">
                    <div style={{ color: 'var(--text)' }}>{job.productName}</div>
                    <div className="text-xs" style={{ color: 'var(--text-mute)' }}>{job.customerName}</div>
                  </td>
                  <td className="px-4 py-3">
                    {clock ? <SlaTag hoursInStep={hoursIn(clock)} slaHours={clock.slaStep.hours} isOverdue={clock.breached} /> : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={locations[job.id] ?? ''}
                      onChange={e => setLocations(prev => ({ ...prev, [job.id]: e.target.value }))}
                      placeholder="A-00-00"
                      className="border rounded px-2 py-1 text-sm w-28"
                      style={{ borderColor: 'var(--border)' }}
                      disabled={done}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => doAction(job.id, 'gr_receive', { location: locations[job.id] })}
                      disabled={!locations[job.id] || actionLoading === job.id || done}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40"
                      style={{ background: 'var(--red)' }}
                    >
                      {done ? '✓ รับแล้ว' : 'ยืนยันรับสินค้า'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )
    }

    if (key === 'gr_packed') {
      // Group by channel
      const grouped: Record<string, QueueJob[]> = { DC: [], DSD: [], TPL: [] }
      tabJobs(key).forEach(j => { if (j.channel) grouped[j.channel]?.push(j) })
      return (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {(['DC', 'DSD', 'TPL'] as const).map(ch => (
            grouped[ch].length > 0 && (
              <div key={ch}>
                <div className="px-4 py-2 text-xs font-semibold flex items-center gap-2" style={{ color: CHANNEL_COLORS[ch], background: 'var(--surface-2)' }}>
                  {CHANNEL_LABELS[ch]} <span className="bg-white rounded-full px-1.5">{grouped[ch].length}</span>
                </div>
                {grouped[ch].map(job => (
                  <div key={job.id} className="px-4 py-3 flex items-center gap-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex-1">
                      <span className="font-mono font-medium text-sm" style={{ color: 'var(--text)' }}>{job.jobNo}</span>
                      <span className="text-sm ml-2" style={{ color: 'var(--text-2)' }}>{job.productName}</span>
                    </div>
                    <button
                      onClick={() => doAction(job.id, 'gr_handoff')}
                      disabled={actionLoading === job.id || doneRows.has(job.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40"
                      style={{ background: CHANNEL_COLORS[ch] }}
                    >
                      ยืนยันส่งมอบ
                    </button>
                  </div>
                ))}
              </div>
            )
          ))}
          {tabJobs(key).length === 0 && <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-mute)' }}>ไม่มีงานในคิวนี้</div>}
        </div>
      )
    }

    // Generic tab (gr_received, inbound, return_received)
    const actionMap: Record<string, string> = { gr_received: 'gr_pack', inbound: 'gr_receive_return', return_received: 'gr_deliver_cs' }
    const btnLabels: Record<string, string> = { gr_received: 'Pack เสร็จ + พิมพ์ใบปะหน้า', inbound: 'ยืนยันรับคืน', return_received: 'ส่งมอบให้ CS' }
    const action = actionMap[key]
    const btnLabel = btnLabels[key] ?? 'ยืนยัน'
    return (
      <table className="w-full text-sm">
        <thead>
          <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', color: 'var(--text-2)' }}>
            <th className="px-4 py-3 text-left font-medium">เลขงาน</th>
            <th className="px-4 py-3 text-left font-medium">สินค้า</th>
            <th className="px-4 py-3 text-left font-medium">ช่อง</th>
            <th className="px-4 py-3 text-left font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {tabJobs(key).length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-mute)' }}>ไม่มีงานในคิวนี้</td></tr>}
          {tabJobs(key).map(job => (
            <tr key={job.id} className="border-b transition-opacity" style={{ borderColor: 'var(--border)', opacity: doneRows.has(job.id) ? 0.4 : 1 }}>
              <td className="px-4 py-3 font-mono font-medium" style={{ color: 'var(--text)' }}>{job.jobNo}</td>
              <td className="px-4 py-3" style={{ color: 'var(--text)' }}>{job.productName}</td>
              <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-2)' }}>{job.channel ?? '-'}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => doAction(job.id, action)}
                  disabled={actionLoading === job.id || doneRows.has(job.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40"
                  style={{ background: 'var(--red)' }}
                >
                  {doneRows.has(job.id) ? '✓ เสร็จแล้ว' : btnLabel}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>GR — รับ-ส่งสินค้า</h1>
        <button onClick={load} disabled={loading} className="p-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--text-2)' }} />
        </button>
      </div>

      <OverdueBanner overdueJobs={overdueJobs} onJumpToTab={jumpToTab} />

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-3">
        {TABS.map((t, i) => (
          <button key={t.key} onClick={() => setActiveTab(i)}
            className={`card text-left ${activeTab === i ? 'ring-2 ring-red-400' : ''}`}>
            <div className="text-2xl font-bold" style={{ color: activeTab === i ? 'var(--red)' : 'var(--text)' }}>{kpis[t.key] ?? 0}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-mute)' }}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="card p-0 overflow-hidden">
        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
          {TABS.map((t, i) => (
            <button
              key={t.key}
              ref={el => { tabRefs.current[i] = el }}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === i ? 'border-b-2 border-red-500 text-red-600' : 'hover:bg-gray-50'}`}
              style={{ color: activeTab === i ? 'var(--red)' : 'var(--text-2)' }}
            >
              {t.label}
              <span className="text-xs rounded-full px-1.5 py-0.5" style={{ background: activeTab === i ? 'var(--red-tint)' : 'var(--surface-2)', color: activeTab === i ? 'var(--red)' : 'var(--text-mute)' }}>
                {kpis[t.key] ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <TabContent />
        </div>
      </div>
    </div>
  )
}
