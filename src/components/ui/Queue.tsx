'use client'

import { useState } from 'react'
import Modal from './Modal'
import type { JobView } from '@/lib/job-view'
import { fmtOverage } from '@/lib/constants'

export interface OverdueItem { id: string; jobNo: string; customerName: string | null; productName: string; tab: string; tabLabel: string; stepName: string; overHours: number }

export function OverdueSummary({ items, onGo }: { items: OverdueItem[]; onGo: (tab: string, jobId: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button className={`overdue-summary ${items.length === 0 ? 'ok' : ''}`} onClick={() => setOpen(true)}>
        <div className="num">{items.length}</div>
        <div className="lbl">{items.length ? 'รายการเกิน SLA ทั้งหมด — กดเพื่อดูรายละเอียดและดำเนินการ' : 'ไม่มีงานเกิน SLA ในขณะนี้'}</div>
      </button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>รายการเกิน SLA ทั้งหมด</h3>
        <div className="tbl-wrap">
          <table className="tbl compact">
            <thead>
              <tr><th>เลขที่ใบแจ้งซ่อม</th><th>ลูกค้า</th><th>สินค้า</th><th>ขั้นตอนที่ค้าง</th><th>เกินมา</th><th></th></tr>
            </thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={6} className="empty">ไม่มีงานเกิน SLA ในขณะนี้</td></tr>}
              {items.map(o => (
                <tr key={o.id + o.tab}>
                  <td><b>{o.jobNo}</b></td>
                  <td>{o.customerName ?? '-'}</td>
                  <td>{o.productName}</td>
                  <td>{o.tabLabel}<div className="sub-mute">{o.stepName}</div></td>
                  <td><span className="badge b-red">เกิน {fmtOverage(o.overHours)}</span></td>
                  <td><button className="btn btn-primary" onClick={() => { setOpen(false); onGo(o.tab, o.id) }}>ไปดำเนินการ</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  )
}

export interface KpiDef { tab: string; label: string; count: number; over: number }

export function KpiGrid({ items, active, onPick }: { items: KpiDef[]; active?: string; onPick: (tab: string) => void }) {
  return (
    <div className="kpi-grid">
      {items.map(k => (
        <button key={k.tab} className={`kpi-card ${active === k.tab ? 'active' : ''}`} onClick={() => onPick(k.tab)}>
          <div className="num">{k.count}</div>
          <div className="lbl">{k.label}</div>
          {k.over > 0 && <div className="over-lbl">เกิน SLA: {k.over} งาน</div>}
        </button>
      ))}
    </div>
  )
}

export function TabBar({ tabs, active, onPick }: { tabs: Array<{ key: string; label: string; count: number }>; active: string; onPick: (k: string) => void }) {
  return (
    <div className="tabs">
      {tabs.map(t => (
        <button key={t.key} className={`tab-btn ${active === t.key ? 'active' : ''}`} onClick={() => onPick(t.key)}>
          {t.label} <span className="tab-count">{t.count}</span>
        </button>
      ))}
    </div>
  )
}

export function SlaCell({ job }: { job: Pick<JobView, 'sla'> }) {
  if (!job.sla) return <span className="sub-mute">-</span>
  const s = job.sla
  return (
    <div>
      {s.hoursInStep} ชม.{s.paused && <span className="badge b-amber" style={{ marginLeft: 4 }}>หยุดนับ (รออะไหล่)</span>}
      <div style={{ fontSize: 11, color: s.overdue ? 'var(--red-dark)' : 'var(--text-mute)' }}>SLA {s.slaHours} ชม.{s.overdue ? ' — เกิน' : ''}</div>
    </div>
  )
}

export function JobIdCell({ job, onOpen, showDate }: { job: Pick<JobView, 'jobNo' | 'sla' | 'overdue' | 'openedAt' | 'type'>; onOpen?: () => void; showDate?: boolean }) {
  const over = job.sla?.overdue ?? job.overdue
  return (
    <div>
      <b className={over ? 'jobid-over' : ''} style={onOpen ? { cursor: 'pointer', textDecoration: 'underline dotted' } : undefined} onClick={onOpen}>{job.jobNo}</b>
      {job.type === 'STOCK' && <span className="badge b-gray" style={{ marginLeft: 4 }}>สต็อก</span>}
      {showDate && <div className="sub-mute">{new Date(job.openedAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}</div>}
    </div>
  )
}

export function QueueHeader({ title, sub, right }: { title: string; sub: string; right?: React.ReactNode }) {
  return (
    <div className="toprow">
      <div>
        <p className="page-title">{title}</p>
        <p className="page-sub">{sub}</p>
      </div>
      {right}
    </div>
  )
}

export function DateRange({ from, to, onChange, onExport, exportLabel = 'Export เป็น Excel' }: { from: string; to: string; onChange: (from: string, to: string) => void; onExport?: () => void; exportLabel?: string }) {
  return (
    <div className="daterange">
      <label>ตั้งแต่</label>
      <input type="date" className="inp" value={from} onChange={e => onChange(e.target.value, to)} />
      <label>ถึง</label>
      <input type="date" className="inp" value={to} onChange={e => onChange(from, e.target.value)} />
      {onExport && <button className="btn btn-primary" onClick={onExport}>{exportLabel}</button>}
    </div>
  )
}

export function EmptyCard({ text = 'ไม่มีงานในคิวนี้' }: { text?: string }) {
  return <div className="tcard"><div className="empty">{text}</div></div>
}

export function hoursOf(j: Pick<JobView, 'sla'>) {
  return j.sla?.hoursInStep ?? 0
}
