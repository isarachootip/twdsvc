'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, ChevronRight, X, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import StageBadge from '@/components/ui/StageBadge'
import SlaTag from '@/components/ui/SlaTag'
import { JobStage } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SlaClock {
  startedAt: string
  dueAt: string
  stoppedAt: string | null
  pausedMinutes: number
  breached: boolean
  status: string
  slaStep: { code: string; ownerDept: string; hours: number }
}
interface JobCharge { type: string; amount: number; description: string | null }
interface JobPayment { amount: number; status: string }

interface Job {
  id: string
  jobNo: string
  stage: JobStage
  channel: string | null
  openedAt: string
  stageEnteredAt: string
  closedAt: string | null
  decision: string
  customerName: string | null
  customerPhone: string | null
  productName: string
  brandName: string
  hasWarranty: boolean
  branch: { name: string; nickname: string }
  vendorCenter: { code: string; vendorParent: { name: string } } | null
  slaClocks: SlaClock[]
  charges: JobCharge[]
  payments: JobPayment[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getActiveClock(job: Job): SlaClock | undefined {
  return job.slaClocks.find(c => c.status === 'RUNNING' || c.status === 'PAUSED')
}

function hoursInStep(clock: SlaClock): number {
  const end = clock.stoppedAt ? new Date(clock.stoppedAt) : new Date()
  const ms = end.getTime() - new Date(clock.startedAt).getTime() - clock.pausedMinutes * 60000
  return Math.floor(Math.max(0, ms) / 3600000)
}

function calcBalance(charges: JobCharge[], payments: JobPayment[]): number {
  const total = charges.reduce((s, c) => s + c.amount, 0)
  const paid = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
  return total - paid
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function fmtBaht(n: number) {
  return '฿' + n.toLocaleString('th-TH', { maximumFractionDigits: 0 })
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

// ─── Pickup Panel (Right drawer content) ─────────────────────────────────────
function PickupPanel({ job, onClose, onRefresh }: { job: Job; onClose: () => void; onRefresh: () => void }) {
  const [actionLoading, setActionLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const balance = calcBalance(job.charges, job.payments)
  const approved = job.decision === 'APPROVED' || job.decision === 'AUTO_APPROVED'
  const rejected = job.decision === 'REJECTED'

  const opFee = job.charges.find(c => c.type === 'OPERATION_FEE')?.amount ?? 0
  const repairCost = job.charges.find(c => c.type === 'REPAIR')?.amount ?? 0
  const opCredit = job.charges.find(c => c.type === 'OPERATION_FEE_CREDIT')?.amount ?? 0

  const doAction = async (action: string, payload?: Record<string, unknown>) => {
    setActionLoading(true)
    setMsg(null)
    const r = await fetch(`/api/jobs/${job.id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    })
    if (r.ok) {
      setMsg('ดำเนินการสำเร็จ')
      onRefresh()
    } else {
      const d = await r.json()
      setMsg(d.error ?? 'เกิดข้อผิดพลาด')
    }
    setActionLoading(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-xs" style={{ color: 'var(--text-2)' }}>รายละเอียด</p>
          <h3 className="font-bold text-base">{job.jobNo}</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100" style={{ color: 'var(--text-2)' }}>
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Customer / Product */}
        <div className="space-y-1">
          <p className="text-sm font-semibold">{job.customerName}</p>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{job.customerPhone}</p>
          <p className="text-sm mt-1">{job.productName} · <span style={{ color: 'var(--text-2)' }}>{job.brandName}</span></p>
          {job.hasWarranty && <span className="b-green text-xs px-2 py-0.5 rounded-full">ประกัน</span>}
        </div>

        {/* Decision badge */}
        <div className="flex items-center gap-2">
          <StageBadge stage={job.stage} size="sm" />
          <span className={`text-xs px-2 py-0.5 rounded-full ${approved ? 'b-green' : rejected ? 'b-coral' : 'b-amber'}`}>
            {approved ? 'ลูกค้าอนุมัติ' : rejected ? 'ลูกค้าไม่อนุมัติ' : 'รอการตัดสินใจ'}
          </span>
        </div>

        {/* Fee breakdown */}
        <div className="card space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>ค่าใช้จ่าย</p>

          {approved && (
            <>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-2)' }}>ค่าดำเนินการ</span>
                <span>{fmtBaht(opFee)}</span>
              </div>
              {opCredit !== 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--green)' }}>หักค่าดำเนินการคืน</span>
                  <span style={{ color: 'var(--green)' }}>{fmtBaht(opCredit)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-2)' }}>ค่าซ่อม</span>
                <span>{fmtBaht(repairCost)}</span>
              </div>
            </>
          )}

          {rejected && (
            <>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-2)' }}>ค่าดำเนินการ (ไม่คืน)</span>
                <span>{fmtBaht(opFee)}</span>
              </div>
            </>
          )}

          <div className="border-t pt-2 flex justify-between text-sm font-semibold" style={{ borderColor: 'var(--border)' }}>
            <span>ยอดค้างชำระ</span>
            <span style={{ color: balance > 0 ? 'var(--red)' : 'var(--green)' }}>{fmtBaht(balance)}</span>
          </div>
        </div>

        {msg && (
          <div
            className="text-sm px-3 py-2 rounded-lg"
            style={{ background: msg === 'ดำเนินการสำเร็จ' ? 'var(--green-tint)' : 'var(--red-tint)', color: msg === 'ดำเนินการสำเร็จ' ? 'var(--green)' : 'var(--red)' }}
          >
            {msg}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="p-5 border-t space-y-2 shrink-0" style={{ borderColor: 'var(--border)' }}>
        {approved && (
          <>
            <button
              onClick={() => doAction('cs_receive_payment')}
              disabled={actionLoading || balance <= 0}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
              style={{ background: 'var(--red)' }}
            >
              รับชำระ {balance > 0 ? fmtBaht(balance) : '(ชำระแล้ว)'}
            </button>
            <button
              onClick={() => doAction('cs_close_job')}
              disabled={actionLoading || balance > 0}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
              style={{
                background: balance <= 0 ? 'var(--green-tint)' : 'var(--surface-2)',
                color: balance <= 0 ? 'var(--green)' : 'var(--text-mute)',
                border: '1px solid var(--border)',
              }}
            >
              ลูกค้ารับสินค้าแล้ว — ปิดงาน
            </button>
          </>
        )}

        {rejected && (
          <>
            <button
              onClick={() => doAction('cs_trade_in')}
              disabled={actionLoading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--amber-tint)', color: 'var(--amber)', border: '1px solid var(--amber)' }}
            >
              Trade-in
            </button>
            <button
              onClick={() => doAction('cs_return_only')}
              disabled={actionLoading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              รับสินค้ากลับอย่างเดียว
            </button>
            <button
              onClick={() => doAction('cs_close_job')}
              disabled={actionLoading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--red-tint)', color: 'var(--red)', border: '1px solid var(--red)' }}
            >
              ปิดงาน
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Approval Panel ───────────────────────────────────────────────────────────
function ApprovalPanel({ job, onClose, onRefresh }: { job: Job; onClose: () => void; onRefresh: () => void }) {
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const latestQuote = job.charges.find(c => c.type === 'REPAIR')

  const submit = async () => {
    if (!decision) return
    setLoading(true)
    const r = await fetch(`/api/jobs/${job.id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cs_record_decision', decision }),
    })
    if (r.ok) { setMsg('บันทึกสำเร็จ'); onRefresh() }
    else { const d = await r.json(); setMsg(d.error ?? 'เกิดข้อผิดพลาด') }
    setLoading(false)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div>
          <p className="text-xs" style={{ color: 'var(--text-2)' }}>บันทึกผลแทนลูกค้า</p>
          <h3 className="font-bold">{job.jobNo}</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100" style={{ color: 'var(--text-2)' }}>
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{job.customerName}</p>
          <p className="text-sm">{job.productName} · {job.brandName}</p>
          {latestQuote && (
            <p className="text-sm font-semibold mt-2" style={{ color: 'var(--text)' }}>
              ราคาซ่อม: <span style={{ color: 'var(--red)' }}>฿{latestQuote.amount.toLocaleString()}</span>
            </p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">ผลการตัดสินใจของลูกค้า</p>
          {(['APPROVED', 'REJECTED'] as const).map(d => (
            <button
              key={d}
              onClick={() => setDecision(d)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${decision === d ? (d === 'APPROVED' ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50') : 'border-gray-200'}`}
              style={{ color: decision === d ? (d === 'APPROVED' ? 'var(--green)' : 'var(--red)') : 'var(--text)' }}
            >
              {d === 'APPROVED' ? '✓ ลูกค้าอนุมัติซ่อม' : '✕ ลูกค้าไม่อนุมัติ (ไม่ซ่อม)'}
            </button>
          ))}
        </div>
        {msg && (
          <div className="text-sm px-3 py-2 rounded-lg" style={{ background: msg === 'บันทึกสำเร็จ' ? 'var(--green-tint)' : 'var(--red-tint)', color: msg === 'บันทึกสำเร็จ' ? 'var(--green)' : 'var(--red)' }}>
            {msg}
          </div>
        )}
      </div>
      <div className="p-5 border-t shrink-0" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={submit}
          disabled={!decision || loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: 'var(--red)' }}
        >
          {loading ? 'กำลังบันทึก...' : 'บันทึกผล'}
        </button>
      </div>
    </div>
  )
}

// ─── Job Row ──────────────────────────────────────────────────────────────────
function JobRow({ job, onClick }: { job: Job; onClick: () => void }) {
  const clock = getActiveClock(job)
  const balance = calcBalance(job.charges, job.payments)
  const hrs = clock ? hoursInStep(clock) : 0
  const isOverdue = clock?.breached ?? false

  return (
    <tr
      className="border-b hover:bg-orange-50 cursor-pointer transition-colors"
      style={{ borderColor: 'var(--border)' }}
      onClick={onClick}
    >
      <td className="px-4 py-3">
        <div className="font-mono text-sm font-semibold" style={{ color: isOverdue ? 'var(--red)' : 'var(--text)' }}>
          <span className="flex items-center gap-1">
            {isOverdue && <AlertTriangle size={13} />}
            {job.jobNo}
          </span>
        </div>
        <div className="text-xs" style={{ color: 'var(--text-mute)' }}>{fmtDate(job.openedAt)}</div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm">{job.customerName}</div>
        <div className="text-xs" style={{ color: 'var(--text-mute)' }}>{job.customerPhone}</div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm">{job.productName}</div>
        <div className="text-xs" style={{ color: 'var(--text-mute)' }}>{job.brandName}</div>
      </td>
      <td className="px-4 py-3">
        {clock ? <SlaTag hoursInStep={hrs} slaHours={clock.slaStep.hours} isOverdue={isOverdue} ownerDept={clock.slaStep.ownerDept} /> : <span className="text-xs" style={{ color: 'var(--text-mute)' }}>—</span>}
      </td>
      <td className="px-4 py-3 text-sm font-semibold" style={{ color: balance > 0 ? 'var(--red)' : 'var(--green)' }}>
        {fmtBaht(balance)}
      </td>
      <td className="px-4 py-3 text-right">
        <ChevronRight size={16} style={{ color: 'var(--text-mute)' }} className="ml-auto" />
      </td>
    </tr>
  )
}

// ─── Tab Table ────────────────────────────────────────────────────────────────
function PickupTable({ jobs, onSelect }: { jobs: Job[]; onSelect: (j: Job) => void }) {
  if (jobs.length === 0) return <EmptyState text="ไม่มีงานพร้อมรับที่สาขา" />
  return (
    <table className="w-full text-sm">
      <thead>
        <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
          {['เลขงาน', 'ลูกค้า', 'สินค้า', 'SLA', 'ยอดค้าง', ''].map((h, i) => (
            <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {jobs.map(j => <JobRow key={j.id} job={j} onClick={() => onSelect(j)} />)}
      </tbody>
    </table>
  )
}

function WaitingApprovalTable({ jobs, onSelect }: { jobs: Job[]; onSelect: (j: Job) => void }) {
  if (jobs.length === 0) return <EmptyState text="ไม่มีงานรอลูกค้าอนุมัติ" />
  return (
    <table className="w-full text-sm">
      <thead>
        <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
          {['เลขงาน', 'ลูกค้า', 'สินค้า', 'ราคาใบเสนอ', 'SLA', ''].map((h, i) => (
            <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {jobs.map(j => {
          const clock = getActiveClock(j)
          const hrs = clock ? hoursInStep(clock) : 0
          const isOverdue = clock?.breached ?? false
          const repairCharge = j.charges.find(c => c.type === 'REPAIR')

          return (
            <tr key={j.id} className="border-b hover:bg-orange-50 cursor-pointer" style={{ borderColor: 'var(--border)' }} onClick={() => onSelect(j)}>
              <td className="px-4 py-3 font-mono text-sm font-semibold" style={{ color: isOverdue ? 'var(--red)' : 'var(--text)' }}>
                <div className="flex items-center gap-1">{isOverdue && <AlertTriangle size={13} />}{j.jobNo}</div>
                <div className="text-xs font-normal" style={{ color: 'var(--text-mute)' }}>{fmtDate(j.openedAt)}</div>
              </td>
              <td className="px-4 py-3">
                <div>{j.customerName}</div>
                <div className="text-xs" style={{ color: 'var(--text-mute)' }}>{j.customerPhone}</div>
              </td>
              <td className="px-4 py-3">
                <div>{j.productName}</div>
                <div className="text-xs" style={{ color: 'var(--text-mute)' }}>{j.brandName}</div>
              </td>
              <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text)' }}>
                {repairCharge ? fmtBaht(repairCharge.amount) : '—'}
              </td>
              <td className="px-4 py-3">
                {clock ? <SlaTag hoursInStep={hrs} slaHours={clock.slaStep.hours} isOverdue={isOverdue} ownerDept={clock.slaStep.ownerDept} /> : <span className="text-xs" style={{ color: 'var(--text-mute)' }}>—</span>}
              </td>
              <td className="px-4 py-3 text-right"><ChevronRight size={16} style={{ color: 'var(--text-mute)' }} className="ml-auto" /></td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function OpenedTodayTable({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0) return <EmptyState text="ยังไม่มีงานที่เปิดวันนี้" />
  return (
    <table className="w-full text-sm">
      <thead>
        <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
          {['เลขงาน', 'ลูกค้า', 'สินค้า', 'ช่องทาง', 'สถานะ'].map((h, i) => (
            <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-2)' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {jobs.map(j => (
          <tr key={j.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
            <td className="px-4 py-3 font-mono text-sm font-semibold">{j.jobNo}</td>
            <td className="px-4 py-3">
              <div>{j.customerName}</div>
              <div className="text-xs" style={{ color: 'var(--text-mute)' }}>{j.customerPhone}</div>
            </td>
            <td className="px-4 py-3">
              <div>{j.productName}</div>
              <div className="text-xs" style={{ color: 'var(--text-mute)' }}>{j.brandName}</div>
            </td>
            <td className="px-4 py-3">
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                {{ DC: 'DC มาตรฐาน', DSD: 'DSD', TPL: '3PL' }[j.channel ?? ''] ?? '—'}
              </span>
            </td>
            <td className="px-4 py-3"><StageBadge stage={j.stage} size="sm" /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-2">
      <CheckCircle2 size={36} style={{ color: 'var(--border-strong)' }} />
      <p className="text-sm" style={{ color: 'var(--text-mute)' }}>{text}</p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
type TabKey = 'pickup' | 'approval' | 'opened'

export default function CsPage() {
  const [tab, setTab] = useState<TabKey>('pickup')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [panelMode, setPanelMode] = useState<'pickup' | 'approval' | null>(null)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/jobs?limit=200')
    if (r.ok) {
      const d = await r.json()
      setJobs(d.jobs)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  const pickupJobs = jobs.filter(j => j.stage === 'READY_FOR_PICKUP')
  const approvalJobs = jobs.filter(j => j.stage === 'WAITING_APPROVAL')
  const openedJobs = jobs.filter(j => j.stage === 'CS_OPENED' && isToday(j.openedAt))

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'pickup', label: 'พร้อมรับที่สาขา', count: pickupJobs.length },
    { key: 'approval', label: 'รอลูกค้าอนุมัติ', count: approvalJobs.length },
    { key: 'opened', label: 'เปิดวันนี้', count: openedJobs.length },
  ]

  const openPickup = (j: Job) => { setSelectedJob(j); setPanelMode('pickup') }
  const openApproval = (j: Job) => { setSelectedJob(j); setPanelMode('approval') }
  const closePanel = () => { setSelectedJob(null); setPanelMode(null) }

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>CS Queue</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>คิวงานสำหรับ Customer Service</p>
        </div>
        <Link
          href="/cs/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: 'var(--red)' }}
        >
          <Plus size={16} />
          เปิดใบแจ้งซ่อม
        </Link>
      </div>

      {/* Main layout: table + side panel */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Table area */}
        <div className="flex flex-col flex-1 min-w-0 card p-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); closePanel() }}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-current' : 'border-transparent hover:bg-gray-50'}`}
                style={{ color: tab === t.key ? 'var(--red)' : 'var(--text-2)' }}
              >
                {t.label}
                <span
                  className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${tab === t.key ? 'text-white' : ''}`}
                  style={{ background: tab === t.key ? 'var(--red)' : 'var(--surface-2)', color: tab === t.key ? 'white' : 'var(--text-2)' }}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--red)' }} />
              </div>
            ) : (
              <>
                {tab === 'pickup' && <PickupTable jobs={pickupJobs} onSelect={openPickup} />}
                {tab === 'approval' && <WaitingApprovalTable jobs={approvalJobs} onSelect={openApproval} />}
                {tab === 'opened' && <OpenedTodayTable jobs={openedJobs} />}
              </>
            )}
          </div>
        </div>

        {/* Side panel */}
        {selectedJob && panelMode && (
          <div
            className="w-80 shrink-0 rounded-xl overflow-hidden flex flex-col"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {panelMode === 'pickup' && (
              <PickupPanel job={selectedJob} onClose={closePanel} onRefresh={fetchJobs} />
            )}
            {panelMode === 'approval' && (
              <ApprovalPanel job={selectedJob} onClose={closePanel} onRefresh={fetchJobs} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
