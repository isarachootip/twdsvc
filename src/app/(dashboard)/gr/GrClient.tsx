'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { OverdueSummary, KpiGrid, TabBar, QueueHeader, EmptyCard } from '@/components/ui/Queue'
import PrintLabel, { type LabelData } from '@/components/ui/PrintLabel'
import ShippingLabel3PLModal from '@/components/ui/ShippingLabel3PLModal'
import { buildCaseA3PlLabel, type ThreePlLabelData } from '@/lib/threepl-label'
import JobDetailModal from '@/components/jobs/JobDetail'
import { useSort } from '@/components/ui/Sortable'
import { useQueue, useRowInputs } from '@/components/ui/useQueue'
import { useToast } from '@/components/ui/Toast'
import { findJobTab, type JobLocation } from '@/lib/job-locator'
import type { JobView } from '@/lib/job-view'
import { TABS, TAB_KEYS, SORT } from './gr-config'
import type { GrRowCtx } from './gr-types'
import GrReceiveTable from './GrReceiveTable'
import GrPackTable from './GrPackTable'
import GrHandoffTab from './GrHandoffTab'
import { GrReturnTable, GrDeliverCsTable } from './GrReturnTables'

export default function GrClient({ role }: { role: string }) {
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('search') ?? searchParams.get('jobNo')
  const initialTab = searchParams.get('tab')
  const [tab, setTab] = useState(initialTab && TAB_KEYS.includes(initialTab) ? initialTab : 'receive')
  const [branchFilter, setBranchFilter] = useState('')
  const [siteOptions, setSiteOptions] = useState<Array<{ id: string; name: string }>>([])
  const inp = useRowInputs()
  const scanRef = useRef<HTMLInputElement>(null)
  const { data, loading, reload, run, done, busy } = useQueue('GR', undefined, branchFilter ? { branchId: branchFilter } : undefined, id => {
    inp.clear(id)
    scanRef.current?.focus()
  })
  const [label, setLabel] = useState<LabelData | null>(null)
  const [label3Pl, setLabel3Pl] = useState<ThreePlLabelData | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [scan, setScan] = useState('')
  const { toast } = useToast()
  const readOnly = role !== 'GR' && role !== 'ADMIN'

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
  const pending = (k: string) => list(k).filter(j => !done[j.id]).length
  const overCount = (k: string) => list(k).filter(j => !done[j.id] && j.sla?.overdue).length

  /** สลับไปแท็บที่มีงาน + ไฮไลต์ + เลื่อนไปที่แถว */
  const goTo = (loc: JobLocation, delayMs: number) => {
    setTab(loc.tab)
    setHighlight(loc.jobId)
    setTimeout(() => document.getElementById(`row-${loc.jobId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), delayMs)
  }

  useEffect(() => {
    if (!searchQuery) return
    const loc = findJobTab(data.tabs, TAB_KEYS, searchQuery)
    if (loc) goTo(loc, 100)
  }, [searchQuery, data]) // eslint-disable-line react-hooks/exhaustive-deps

  const onScan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scan.trim()) return
    const loc = findJobTab(data.tabs, TAB_KEYS, scan)
    if (!loc) { toast('ไม่พบเลขงานนี้ในคิว GR', 'error'); return }
    goTo(loc, 50)
    setScan('')
  }

  const rowCls = (j: JobView) => `${done[j.id] ? 'done-row' : ''} ${highlight === j.id ? 'highlight' : ''}`
  const ctx: GrRowCtx = { done, inp, readOnly, busy, rowCls, onOpen: setOpenId, run }

  // เก็บ state การเรียงไว้ที่นี่ เพื่อให้คงอยู่เมื่อสลับแท็บ (เหมือนเดิม)
  const receive = useSort(list('receive'), SORT)
  const pack = useSort(list('pack'), SORT)
  const ret = useSort(list('return'), SORT)
  const dcs = useSort(list('deliverCS'), SORT)

  return (
    <div className="page">
      <QueueHeader
        title="ส่วนงาน GR"
        sub="รับสินค้าจาก CS → Pack และพิมพ์ใบปะหน้า → ส่งมอบขนส่ง → รับของซ่อมคืน → ส่งมอบ CS"
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {role === 'ADMIN' && branches.length > 0 && (
              <select className="sel" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                <option value="">ทุกสาขา ({branches.length} สาขา)</option>
                {branches.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            )}
            <button className="btn" onClick={() => reload()}>↻ รีเฟรช</button>
          </div>
        }
      />
      <OverdueSummary items={data.overdue.filter(o => !done[o.id])} onGo={(t, id) => { setTab(t); setHighlight(id) }} />
      <KpiGrid items={TABS.map(t => ({ tab: t.key, label: t.kpi, count: pending(t.key), over: overCount(t.key) }))} active={tab} onPick={setTab} />
      <TabBar tabs={TABS.map(t => ({ key: t.key, label: t.label, count: pending(t.key) }))} active={tab} onPick={setTab} />

      <form className="filter-bar" onSubmit={onScan}>
        <input ref={scanRef} className="inp" style={{ flex: 1, maxWidth: 460 }} value={scan} onChange={e => setScan(e.target.value)} placeholder="สแกน QR / คีย์เลขใบแจ้งซ่อม แล้วกด Enter เพื่อหางาน" />
        {readOnly && <span className="badge b-amber">โหมดดูอย่างเดียว</span>}
      </form>

      {loading && <EmptyCard text="กำลังโหลด…" />}
      {!loading && tab === 'receive' && <GrReceiveTable ctx={ctx} s={receive} />}
      {!loading && tab === 'pack' && <GrPackTable ctx={ctx} s={pack} onLabel={setLabel} onLabel3Pl={setLabel3Pl} />}
      {!loading && tab === 'handoff' && <GrHandoffTab ctx={ctx} rows={list('handoff')} onPrint3Pl={j => setLabel3Pl(buildCaseA3PlLabel(j))} />}
      {!loading && tab === 'return' && <GrReturnTable ctx={ctx} s={ret} />}
      {!loading && tab === 'deliverCS' && <GrDeliverCsTable ctx={ctx} s={dcs} />}

      <PrintLabel data={label} onClose={() => setLabel(null)} />
      <ShippingLabel3PLModal data={label3Pl} onClose={() => setLabel3Pl(null)} />
      <JobDetailModal jobId={openId} role={role} onClose={() => setOpenId(null)} onChanged={() => reload(true)} />
    </div>
  )
}
