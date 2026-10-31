'use client'

import { useEffect, useMemo, useState } from 'react'
import { OverdueSummary, KpiGrid, TabBar, QueueHeader, EmptyCard, DateRange } from '@/components/ui/Queue'
import { BranchSearchSelect } from '@/components/ui/BranchSearchSelect'
import type { SearchableBranchOption } from '@/lib/branch-search'
import PrintLabel, { type LabelData } from '@/components/ui/PrintLabel'
import DriverDoc from '@/components/ui/DriverDoc'
import { buildLogisticsBoxLabel } from '@/lib/shipping-labels'
import JobDetailModal from '@/components/jobs/JobDetail'
import { useSort } from '@/components/ui/Sortable'
import { useQueue, useRowInputs } from '@/components/ui/useQueue'
import { useToast } from '@/components/ui/Toast'
import { absUrl, exportXlsx, todayBkk } from '@/lib/client'
import type { JobView } from '@/lib/job-view'
import { DcPickupTab, DcDispatchBranchTab } from './DcPickupTables'
import { DcReceiveLocationTab, DcHandoffVdTab, DcReturnFromVdTab, type DcWarehouseCtx } from './DcWarehouseTables'

const TABS = [
  { key: 'pickup', label: 'เข้ารับจากสาขา', kpi: 'รอเข้ารับจากสาขา' },
  { key: 'receiveDC', label: 'รับเข้า Location', kpi: 'รอรับเข้า Location' },
  { key: 'handoffVD', label: 'ส่งมอบให้ VD', kpi: 'รอส่งมอบให้ VD' },
  { key: 'returnFromVD', label: 'รับคืนจาก VD', kpi: 'รอรับคืนจาก VD' },
  { key: 'dispatchBranch', label: 'ส่งคืนกลับสาขา', kpi: 'รอส่งคืนกลับสาขา' },
]

const SORT = {
  id: (j: JobView) => j.jobNo, customer: (j: JobView) => j.customerName ?? '', product: (j: JobView) => j.productName,
  branch: (j: JobView) => j.branch.name, hours: (j: JobView) => j.sla?.hoursInStep ?? 0, vd: (j: JobView) => j.vendor?.code ?? '',
  openedAt: (j: JobView) => new Date(j.openedAt).getTime(),
}

export default function DcClient({ role }: { role: string }) {
  const [tab, setTab] = useState('pickup')
  const [range, setRange] = useState({ from: '', to: '' })
  const [branchFilter, setBranchFilter] = useState('')
  const [siteOptions, setSiteOptions] = useState<SearchableBranchOption[]>([])
  const inp = useRowInputs()
  const { data, loading, reload, run, done, busy } = useQueue('DC', range, branchFilter ? { branchId: branchFilter } : undefined, inp.clear)
  const [openId, setOpenId] = useState<string | null>(null)
  const [driverDoc, setDriverDoc] = useState<{ job: JobView; leg: string; url?: string } | null>(null)
  const [label, setLabel] = useState<LabelData | null>(null)
  const { toast } = useToast()
  const readOnly = role !== 'DC' && role !== 'ADMIN'

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

  const list = (k: string) => data.tabs[k] ?? []
  const pending = (k: string) => list(k).filter(j => !done[j.id]).length
  const overCount = (k: string) => list(k).filter(j => !done[j.id] && j.sla?.overdue).length
  const rowCls = (j: JobView) => (done[j.id] ? 'done-row' : '')

  const branches = useMemo<SearchableBranchOption[]>(() => {
    if (siteOptions.length > 0) return siteOptions
    return [...new Map(Object.values(data.tabs).flat().map(j => [j.branch.id, j.branch])).values()]
  }, [siteOptions, data])

  const s1 = useSort(list('pickup'), SORT)
  const s2 = useSort(list('receiveDC'), SORT)
  const s3 = useSort(list('handoffVD'), SORT)
  const s4 = useSort(list('returnFromVD'), SORT)
  const s5 = useSort(list('dispatchBranch'), SORT)

  const handleDispatchDriver = async (
    j: JobView,
    method: 'PRINT' | 'LINK',
    leg: 'GR_TO_DC' | 'DC_TO_BRANCH',
  ) => {
    const r = await run(j, 'dispatch_pickup', { method }, 'แจ้งคนรถแล้ว', { silent: true })
    if (!r) return
    if (method === 'PRINT') {
      toast('แจ้งคนรถแล้ว — แสดงใบปะหน้ากล่องมาตรฐานไทวัสดุ', 'success')
      setLabel(buildLogisticsBoxLabel(j, leg))
    } else if (r.driverUrl) {
      const url = absUrl(String(r.driverUrl))
      try { await navigator.clipboard?.writeText(url) } catch { /* ignore */ }
      toast('แจ้งคนรถและคัดลอกลิงก์แล้ว', 'success')
      setDriverDoc({ job: j, leg: leg === 'GR_TO_DC' ? 'สาขา → คลัง DC' : 'คลัง DC → สาขา', url })
    }
  }

  const exportAll = () => exportXlsx(TABS.map(t => ({
    name: t.label,
    rows: list(t.key).map(j => ({ 'เลขที่ใบแจ้งซ่อม': j.jobNo, 'สาขา': j.branch.name, 'ลูกค้า': j.customerName ?? '', 'สินค้า': j.productName, 'VD': j.vendor ? `${j.vendor.centerCode} ${j.vendor.name}` : '', 'รอมาแล้ว (ชม.)': j.sla?.hoursInStep ?? '', 'SLA (ชม.)': j.sla?.slaHours ?? '', 'เกิน SLA': j.sla?.overdue ? 'ใช่' : 'ไม่', 'Location': j.location ?? '' })),
  })), `service_center_dc_${todayBkk()}.xlsx`)

  const whCtx: DcWarehouseCtx = { done, inp, readOnly, busy, rowCls, onOpenJob: setOpenId, run }

  return (
    <div className="page">
      <QueueHeader
        title="ส่วนงาน DC"
        sub="เข้ารับจากสาขา → รับเข้า Location → ส่งมอบให้ VD → รับคืนจาก VD → ส่งคืนกลับสาขา"
        right={<DateRange from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} onExport={exportAll} />}
      />
      <OverdueSummary items={data.overdue.filter(o => !done[o.id])} onGo={t => setTab(t)} loading={loading} />
      <KpiGrid items={TABS.map(t => ({ tab: t.key, label: t.kpi, count: pending(t.key), over: overCount(t.key) }))} active={tab} onPick={setTab} loading={loading} />
      <TabBar tabs={TABS.map(t => ({ key: t.key, label: t.label, count: pending(t.key) }))} active={tab} onPick={setTab} loading={loading} />
      {branches.length > 0 && (
        <div className="filter-bar" style={{ marginTop: 12, marginBottom: 12 }}>
          <BranchSearchSelect
            size="sm"
            options={branches}
            value={branchFilter}
            onChange={setBranchFilter}
            allOptionLabel={`ทุกสาขา (${branches.length} สาขา)`}
          />
        </div>
      )}
      {readOnly && <p className="hint"><span className="text-amber-700 font-semibold text-xs">• โหมดดูอย่างเดียว</span></p>}
      {loading && <EmptyCard text="กำลังโหลด…" />}

      {!loading && tab === 'pickup' && (
        <DcPickupTab s1={s1} done={done} readOnly={readOnly} busy={busy} rowCls={rowCls} onOpenJob={setOpenId} onSetLabel={setLabel} onDispatchDriver={handleDispatchDriver} />
      )}
      {!loading && tab === 'receiveDC' && <DcReceiveLocationTab s2={s2} ctx={whCtx} />}
      {!loading && tab === 'handoffVD' && <DcHandoffVdTab s3={s3} ctx={whCtx} />}
      {!loading && tab === 'returnFromVD' && <DcReturnFromVdTab s4={s4} ctx={whCtx} />}
      {!loading && tab === 'dispatchBranch' && (
        <DcDispatchBranchTab
          s5={s5}
          done={done}
          readOnly={readOnly}
          busy={busy}
          rowCls={rowCls}
          onOpenJob={setOpenId}
          onDispatchDriver={handleDispatchDriver}
          onSetLabel={setLabel}
          onConfirmDispatchBranch={async j => {
            const r = await run(j, 'dc_dispatch_confirm', {}, 'ส่งคืนกลับสาขาแล้ว — รอ GR รับที่สาขา')
            if (r) setLabel(buildLogisticsBoxLabel(j, 'DC_TO_BRANCH'))
          }}
        />
      )}

      <DriverDoc doc={driverDoc} onClose={() => setDriverDoc(null)} />
      <PrintLabel data={label} onClose={() => setLabel(null)} />
      <JobDetailModal jobId={openId} role={role} onClose={() => setOpenId(null)} onChanged={() => reload(true)} />
    </div>
  )
}
