'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { OverdueSummary, KpiGrid, TabBar, QueueHeader, EmptyCard } from '@/components/ui/Queue'
import { BranchSearchSelect } from '@/components/ui/BranchSearchSelect'
import type { SearchableBranchOption } from '@/lib/branch-search'
import { ShippingLabelModal } from '@/components/ui/shipping-labels'
import { buildThaiwasaduLabel, buildKexLabel, type UnifiedShippingLabelData } from '@/lib/shipping-labels'
import JobDetailModal from '@/components/jobs/JobDetail'
import { useSort } from '@/components/ui/Sortable'
import { useQueue, useRowInputs } from '@/components/ui/useQueue'
import { useToast } from '@/components/ui/Toast'
import { findJobTab, findJobsByScan, type JobLocation } from '@/lib/job-locator'
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
  const [siteOptions, setSiteOptions] = useState<SearchableBranchOption[]>([])
  const inp = useRowInputs()
  const scanRef = useRef<HTMLInputElement>(null)
  const { data, loading, reload, run, done, busy } = useQueue('GR', undefined, branchFilter ? { branchId: branchFilter } : undefined, id => {
    inp.clear(id)
    scanRef.current?.focus()
  })
  const [shippingLabel, setShippingLabel] = useState<UnifiedShippingLabelData | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [highlightIds, setHighlightIds] = useState<string[]>([])
  const [scan, setScan] = useState('')
  const { toast } = useToast()
  const readOnly = role !== 'GR' && role !== 'ADMIN'

  useEffect(() => {
    if (role === 'ADMIN') {
      fetch('/api/sites')
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d)) {
            setSiteOptions(d.filter((s: SearchableBranchOption & { type?: string }) => s.type === 'BRANCH'))
          }
        })
        .catch(() => {})
    }
  }, [role])

  const branches = useMemo<SearchableBranchOption[]>(() => {
    if (siteOptions.length > 0) return siteOptions
    return [...new Map(Object.values(data.tabs).flat().map(j => [j.branch.id, j.branch])).values()]
  }, [siteOptions, data])
  const list = (k: string) => data.tabs[k] ?? []
  const pending = (k: string) => list(k).filter(j => !done[j.id]).length
  const overCount = (k: string) => list(k).filter(j => !done[j.id] && j.sla?.overdue).length

  /** สลับไปแท็บที่มีงาน + ไฮไลต์ + เลื่อนไปที่แถว */
  const goTo = (loc: JobLocation, delayMs: number, allIds?: string[]) => {
    setTab(loc.tab)
    setHighlightIds(allIds?.length ? allIds : [loc.jobId])
    setTimeout(() => document.getElementById(`row-${loc.jobId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), delayMs)
  }

  useEffect(() => {
    if (!searchQuery) return
    const loc = findJobTab(data.tabs, TAB_KEYS, searchQuery)
    if (loc) goTo(loc, 100)
  }, [searchQuery, data]) // eslint-disable-line react-hooks/exhaustive-deps

  const onScan = (e: React.FormEvent) => {
    e.preventDefault()
    const q = scan.trim()
    if (!q) return
    const multi = findJobsByScan(data.tabs, TAB_KEYS, q)
    if (!multi) { toast('ไม่พบเลขใบแจ้งซ่อมหรือใบรับสินค้านี้ในคิว GR', 'error'); return }
    goTo({ tab: multi.tab, jobId: multi.jobIds[0] }, 50, multi.jobIds)
    if (q.toUpperCase().startsWith('PU-')) {
      toast(`พบ ${multi.jobIds.length} งานในใบรับสินค้า ${q.toUpperCase()}`, 'success')
    }
    setScan('')
  }

  const rowCls = (j: JobView) => `${done[j.id] ? 'done-row' : ''} ${highlightIds.includes(j.id) ? 'highlight' : ''}`
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
              <BranchSearchSelect
                size="sm"
                options={branches}
                value={branchFilter}
                onChange={setBranchFilter}
                allOptionLabel={`ทุกสาขา (${branches.length} สาขา)`}
              />
            )}
            <button className="btn" onClick={() => reload()}>↻ รีเฟรช</button>
          </div>
        }
      />
      <OverdueSummary items={data.overdue.filter(o => !done[o.id])} onGo={(t, id) => { setTab(t); setHighlightIds([id]) }} loading={loading} />
      <KpiGrid items={TABS.map(t => ({ tab: t.key, label: t.kpi, count: pending(t.key), over: overCount(t.key) }))} active={tab} onPick={setTab} loading={loading} />
      <TabBar tabs={TABS.map(t => ({ key: t.key, label: t.label, count: pending(t.key) }))} active={tab} onPick={setTab} loading={loading} />

      <form className="filter-bar" onSubmit={onScan}>
        <input ref={scanRef} className="inp" style={{ flex: 1, maxWidth: 460 }} value={scan} onChange={e => setScan(e.target.value)} placeholder="สแกน QR / บาร์โค้ดใบรับสินค้า (PU-...) / เลขใบแจ้งซ่อม แล้วกด Enter" />
        {readOnly && <span className="text-amber-700 font-semibold text-xs">• โหมดดูอย่างเดียว</span>}
      </form>

      {loading && <EmptyCard text="กำลังโหลด…" />}
      {!loading && tab === 'receive' && <GrReceiveTable ctx={ctx} s={receive} />}
      {!loading && tab === 'pack' && <GrPackTable ctx={ctx} s={pack} onShippingLabel={setShippingLabel} />}
      {!loading && tab === 'handoff' && (
        <GrHandoffTab
          ctx={ctx}
          rows={list('handoff')}
          onPrintShippingLabel={j => {
            if (j.channel === 'TPL') {
              setShippingLabel(buildKexLabel(j))
            } else {
              setShippingLabel(buildThaiwasaduLabel(j))
            }
          }}
        />
      )}
      {!loading && tab === 'return' && <GrReturnTable ctx={ctx} s={ret} />}
      {!loading && tab === 'deliverCS' && <GrDeliverCsTable ctx={ctx} s={dcs} />}

      <ShippingLabelModal data={shippingLabel} onClose={() => setShippingLabel(null)} />
      <JobDetailModal jobId={openId} role={role} onClose={() => setOpenId(null)} onChanged={() => reload(true)} />
    </div>
  )
}
