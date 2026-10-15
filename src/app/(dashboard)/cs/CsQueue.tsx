'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TabBar, EmptyCard } from '@/components/ui/Queue'
import JobDetailModal from '@/components/jobs/JobDetail'
import PaymentModal from '@/components/jobs/PaymentModal'
import { useQueue, useRowInputs } from '@/components/ui/useQueue'
import { useToast } from '@/components/ui/Toast'
import { findJobsByScan } from '@/lib/job-locator'
import type { JobView } from '@/lib/job-view'

import CsReceiveTable from './components/CsReceiveTable'
import CsPickupTable from './components/CsPickupTable'
import CsApprovalTable from './components/CsApprovalTable'
import CsOpenedTable from './components/CsOpenedTable'
import CsLocationModal from './components/CsLocationModal'
import CsReturnReceiptModal from './components/CsReturnReceiptModal'
import { PickupPanel, ApprovalPanel } from './components/CsPanels'

const TABS = [
  { key: 'receive', label: 'รอรับของเข้า CS' },
  { key: 'pickup', label: 'พร้อมรับที่สาขา' },
  { key: 'approval', label: 'รอลูกค้าอนุมัติ' },
  { key: 'opened', label: 'เปิดวันนี้ / รอชำระ' },
]

const TAB_KEYS = ['receive', 'pickup', 'approval', 'opened']

export default function CsQueue({ role }: { role: string }) {
  const router = useRouter()
  const [tab, setTab] = useState('receive')
  const [branchFilter, setBranchFilter] = useState('')
  const [siteOptions, setSiteOptions] = useState<Array<{ id: string; name: string }>>([])
  const inp = useRowInputs()
  const scanRef = useRef<HTMLInputElement>(null)
  const { data, loading, reload, run, busy } = useQueue('CS', undefined, branchFilter ? { branchId: branchFilter } : undefined, id => {
    inp.clear(id)
    scanRef.current?.focus()
  })
  const [sel, setSel] = useState<JobView | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [locJob, setLocJob] = useState<JobView | null>(null)
  const [printJob, setPrintJob] = useState<JobView | null>(null)
  const [scan, setScan] = useState('')
  const [pay, setPay] = useState<{ job: JobView; kind: 'intake' | 'repair'; amount: number } | null>(null)
  const { toast } = useToast()
  const readOnly = role !== 'CS' && role !== 'ADMIN'

  useEffect(() => {
    if (role === 'ADMIN') {
      fetch('/api/sites')
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d)) {
            setSiteOptions(d.filter(s => s.type === 'BRANCH').map(s => ({ id: s.id, name: s.name })))
          }
        })
        .catch(() => {})
    }
  }, [role])

  const branches = useMemo(() => {
    if (siteOptions.length > 0) return siteOptions.map(s => [s.id, s.name] as [string, string])
    return [...new Map(Object.values(data.tabs).flat().map(j => [j.branch.id, j.branch.name])).entries()]
  }, [siteOptions, data])

  const list = (k: string) => data.tabs[k] ?? []
  const current = sel ? Object.values(data.tabs).flat().find(j => j.id === sel.id) ?? null : null

  const onScan = (e: React.FormEvent) => {
    e.preventDefault()
    const q = scan.trim()
    if (!q) return
    const multi = findJobsByScan(data.tabs, TAB_KEYS, q)
    if (!multi) {
      toast('ไม่พบเลขที่ใบแจ้งซ่อมนี้ในคิว CS', 'error')
      return
    }
    setTab(multi.tab)
    const target = list(multi.tab).find(j => j.id === multi.jobIds[0])
    if (target) setSel(target)
    setTimeout(() => document.getElementById(`row-${multi.jobIds[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
    setScan('')
  }

  const handleReceive = async (job: JobView, location: string) => {
    const photos = inp.photos(job.id)
    await run(job, 'cs_receive', { location, photos }, 'รับของเข้า CS แล้ว')
    inp.clear(job.id)
  }

  return (
    <div className="page-wide" style={{ maxWidth: 1280 }}>
      <div className="toprow">
        <div>
          <p className="page-title">คิวงาน CS</p>
          <p className="page-sub">รับสินค้าเข้า CS · ส่งมอบสินค้าให้ลูกค้า · ติดตามการอนุมัติใบเสนอราคา · รับชำระเงิน</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {role === 'ADMIN' && branches.length > 0 && (
            <select className="sel" value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setSel(null) }}>
              <option value="">ทุกสาขา ({branches.length} สาขา)</option>
              {branches.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          )}
          <button className="btn" onClick={() => reload()}>↻ รีเฟรช</button>
          {!readOnly && <Link href="/cs/new" className="btn btn-primary">+ เปิดใบแจ้งซ่อม</Link>}
        </div>
      </div>

      <TabBar tabs={TABS.map(t => ({ ...t, count: list(t.key).length }))} active={tab} onPick={k => { setTab(k); setSel(null) }} />

      <form className="filter-bar" onSubmit={onScan} style={{ marginBottom: 12 }}>
        <input
          ref={scanRef}
          className="inp"
          style={{ flex: 1, maxWidth: 460 }}
          value={scan}
          onChange={e => setScan(e.target.value)}
          placeholder="สแกน QR / คีย์เลขใบแจ้งซ่อม แล้วกด Enter เพื่อหางาน"
        />
        {readOnly && <span className="text-amber-700 font-semibold text-xs">• โหมดดูอย่างเดียว</span>}
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: current && (tab === 'pickup' || tab === 'approval') ? 'minmax(0,1fr) 380px' : '1fr', gap: 16, alignItems: 'start' }}>
        <div>
          {loading && <EmptyCard text="กำลังโหลด…" />}
          {!loading && tab === 'receive' && (
            <CsReceiveTable jobs={list('receive')} readOnly={readOnly} busy={busy} inp={inp} onOpen={setOpenId} onReceive={handleReceive} />
          )}

          {!loading && tab === 'pickup' && (
            <CsPickupTable jobs={list('pickup')} selId={sel?.id ?? null} onSelect={setSel} onEditLoc={setLocJob} readOnly={readOnly} />
          )}

          {!loading && tab === 'approval' && (
            <CsApprovalTable jobs={list('approval')} selId={sel?.id ?? null} onSelect={setSel} />
          )}

          {!loading && tab === 'opened' && (
            <CsOpenedTable jobs={list('opened')} readOnly={readOnly} onOpen={setOpenId} onPay={(j, a) => setPay({ job: j, kind: 'intake', amount: a })} />
          )}
        </div>

        {current && (tab === 'pickup' || tab === 'approval') && (
          <div className="pcard" style={{ position: 'sticky', top: 0 }}>
            <button className="close-btn" style={{ position: 'static', float: 'right' }} onClick={() => setSel(null)}>✕</button>
            <p className="sub-mute" style={{ margin: 0 }}>เลขที่ใบแจ้งซ่อม</p>
            <h3 style={{ fontSize: 17, margin: '2px 0 8px' }}>{current.jobNo}</h3>
            <div className="info-row"><span className="info-label">ลูกค้า</span><span>{current.customerName}</span></div>
            <div className="info-row"><span className="info-label">สินค้า</span><span>{current.productName} ({current.brandName})</span></div>
            {tab === 'pickup' && (
              <PickupPanel
                job={current}
                readOnly={readOnly}
                busy={busy}
                onPay={() => setPay({ job: current, kind: 'repair', amount: current.money?.balance ?? 0 })}
                onClose={async opt => { const r = await run(current, 'cs_close', { pickupOption: opt }, 'ปิดงานแล้ว'); if (r) setSel(null) }}
                onTradein={() => router.push(`/tradein?type=2&jobId=${current.id}`)}
                onDetail={() => setOpenId(current.id)}
                onEditLoc={() => setLocJob(current)}
                onPrintReturn={() => setPrintJob(current)}
              />
            )}
            {tab === 'approval' && (
              <ApprovalPanel
                job={current}
                readOnly={readOnly}
                busy={busy}
                onDetail={() => setOpenId(current.id)}
                onRecord={async (decision, reason) => {
                  const r = await run(current, 'cs_record_decision', { decision, reason, note: reason }, decision === 'approve' ? 'บันทึก: ลูกค้าอนุมัติ' : 'บันทึก: ลูกค้าไม่อนุมัติ')
                  if (r) setSel(null)
                }}
              />
            )}
          </div>
        )}
      </div>

      <PaymentModal job={pay?.job ?? null} kind={pay?.kind ?? 'repair'} amount={pay?.amount ?? 0} onClose={() => setPay(null)} onPaid={() => { setPay(null); reload() }} />
      <JobDetailModal jobId={openId} role={role} onClose={() => setOpenId(null)} onChanged={() => reload()} />
      <CsLocationModal job={locJob} onClose={() => setLocJob(null)} onUpdated={() => reload()} run={run} busy={busy} />
      <CsReturnReceiptModal job={printJob} onClose={() => setPrintJob(null)} />
    </div>
  )
}
