'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TabBar, EmptyCard } from '@/components/ui/Queue'
import { BranchSearchSelect } from '@/components/ui/BranchSearchSelect'
import type { SearchableBranchOption } from '@/lib/branch-search'
import { useQueue, useRowInputs } from '@/components/ui/useQueue'
import { useToast } from '@/components/ui/Toast'
import { findJobsByScan } from '@/lib/job-locator'
import type { JobView } from '@/lib/job-view'
import CsReceiveTable from './components/CsReceiveTable'
import CsPickupTable from './components/CsPickupTable'
import CsApprovalTable from './components/CsApprovalTable'
import CsOpenedTable from './components/CsOpenedTable'
import CsModals from './components/CsModals'
import { PickupPanel, ApprovalPanel } from './components/CsPanels'

const TABS = [
  { key: 'managerSign', label: 'รอ ผจก. ลงนาม' }, { key: 'approval', label: 'รอลูกค้าอนุมัติ' },
  { key: 'receive', label: 'รอรับของเข้า CS' }, { key: 'pickup', label: 'พร้อมรับที่สาขา' },
  { key: 'opened', label: 'เปิดวันนี้ / รอชำระ' },
]

const TAB_KEYS = ['managerSign', 'approval', 'receive', 'pickup', 'opened']

export default function CsQueue({ role }: { role: string }) {
  const router = useRouter()
  const [tab, setTab] = useState('managerSign')
  const [branchFilter, setBranchFilter] = useState('')
  const [siteOptions, setSiteOptions] = useState<SearchableBranchOption[]>([])
  const inp = useRowInputs()
  const scanRef = useRef<HTMLInputElement>(null)
  const { data, loading, reload, run, busy } = useQueue('CS', undefined, branchFilter ? { branchId: branchFilter } : undefined, id => {
    inp.clear(id); scanRef.current?.focus()
  })
  const [sel, setSel] = useState<JobView | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [locJob, setLocJob] = useState<JobView | null>(null)
  const [printJob, setPrintJob] = useState<JobView | null>(null)
  const [signJob, setSignJob] = useState<JobView | null>(null)
  const [signManagerJob, setSignManagerJob] = useState<JobView | null>(null)
  const [lonJob, setLonJob] = useState<JobView | null>(null)
  const [scan, setScan] = useState('')
  const [pay, setPay] = useState<{ job: JobView; kind: 'intake' | 'repair'; amount: number } | null>(null)
  const { toast } = useToast()
  const readOnly = role !== 'CS' && role !== 'ADMIN'

  useEffect(() => {
    if (role === 'ADMIN') {
      fetch('/api/sites')
        .then(r => r.json())
        .then(d => Array.isArray(d) && setSiteOptions(d.filter((s: SearchableBranchOption & { type?: string }) => s.type === 'BRANCH')))
        .catch(() => {})
    }
  }, [role])

  const branches = useMemo<SearchableBranchOption[]>(() => {
    if (siteOptions.length > 0) return siteOptions
    return [...new Map(Object.values(data.tabs).flat().map(j => [j.branch.id, j.branch])).values()]
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
            <BranchSearchSelect
              size="sm"
              options={branches}
              value={branchFilter}
              onChange={v => { setBranchFilter(v); setSel(null) }}
              allOptionLabel={`ทุกสาขา (${branches.length} สาขา)`}
            />
          )}
          <button className="btn" onClick={() => reload()}>↻ รีเฟรช</button>
          {!readOnly && <Link href="/cs/new" className="btn btn-primary">+ เปิดใบแจ้งซ่อม</Link>}
        </div>
      </div>

      <TabBar tabs={TABS.map(t => ({ ...t, count: list(t.key).length }))} active={tab} onPick={k => { setTab(k); setSel(null) }} loading={loading} />

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

      <div style={{ display: 'grid', gridTemplateColumns: current && (tab === 'pickup' || tab === 'approval' || tab === 'managerSign') ? 'minmax(0,1fr) 380px' : '1fr', gap: 16, alignItems: 'start' }}>
        <div>
          {loading && <EmptyCard text="กำลังโหลด…" />}
          {!loading && (tab === 'approval' || tab === 'managerSign') && (
            <CsApprovalTable jobs={list(tab)} selId={sel?.id ?? null} onSelect={setSel} />
          )}

          {!loading && tab === 'receive' && (
            <CsReceiveTable jobs={list('receive')} readOnly={readOnly} busy={busy} inp={inp} onOpen={setOpenId} onReceive={handleReceive} />
          )}

          {!loading && tab === 'pickup' && (
            <CsPickupTable jobs={list('pickup')} selId={sel?.id ?? null} onSelect={setSel} onEditLoc={setLocJob} readOnly={readOnly} />
          )}

          {!loading && tab === 'opened' && (
            <CsOpenedTable jobs={list('opened')} readOnly={readOnly} onOpen={setOpenId} onPay={(j, a) => setPay({ job: j, kind: 'intake', amount: a })} />
          )}
        </div>

        {current && (tab === 'pickup' || tab === 'approval' || tab === 'managerSign') && (
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
                onSignPickup={() => setSignJob(current)}
              />
            )}
            {(tab === 'approval' || tab === 'managerSign') && (
              <ApprovalPanel
                job={current}
                readOnly={readOnly}
                busy={busy}
                onDetail={() => setOpenId(current.id)}
                onSignManager={() => setSignManagerJob(current)}
                onSendLon={() => setLonJob(current)}
                onRecord={async (decision, reason) => {
                  const r = await run(current, 'cs_record_decision', { decision, reason, note: reason }, decision === 'approve' ? 'บันทึก: ลูกค้าอนุมัติ' : 'บันทึก: ลูกค้าไม่อนุมัติ')
                  if (r) setSel(null)
                }}
              />
            )}
          </div>
        )}
      </div>

      <CsModals
        role={role} openId={openId} setOpenId={setOpenId}
        pay={pay} setPay={setPay} locJob={locJob} setLocJob={setLocJob}
        printJob={printJob} setPrintJob={setPrintJob} signJob={signJob} setSignJob={setSignJob}
        signManagerJob={signManagerJob} setSignManagerJob={setSignManagerJob}
        lonJob={lonJob} setLonJob={setLonJob}
        busy={busy} reload={reload} run={run}
        onSignConfirm={async sig => {
          if (!signJob) return
          if (await run(signJob, 'cs_sign_pickup', { signatureUrl: sig }, 'บันทึกลายมือชื่อรับสินค้าเรียบร้อย')) {
            setSignJob(null); reload()
          }
        }}
      />
    </div>
  )
}
