'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OverdueSummary, KpiGrid, TabBar, QueueHeader, EmptyCard, DateRange } from '@/components/ui/Queue'
import PrintLabel, { type LabelData } from '@/components/ui/PrintLabel'
import DriverDoc from '@/components/ui/DriverDoc'
import { buildLogisticsBoxLabel, type LogisticsLabelLeg } from '@/lib/shipping-labels'
import JobDetailModal from '@/components/jobs/JobDetail'
import LonPreview from '@/components/jobs/LonPreview'
import { useSort } from '@/components/ui/Sortable'
import { useQueue, useRowInputs } from '@/components/ui/useQueue'
import { useToast } from '@/components/ui/Toast'
import { useMe } from '@/components/ui/useMe'
import { absUrl, exportXlsx, todayBkk } from '@/lib/client'
import type { JobView } from '@/lib/job-view'
import { VdReceiveTab, RECEIVE_TYPE } from './VdReceiveTab'
import { VdQuoteTab, VdApprovalTab, VdRepairTab, VdReturnTab, type VdTabCommonProps } from './VdRepairTabs'

const TABS = [
  { key: 'receive', label: 'งานรอรับ', kpi: 'งานรอรับ' },
  { key: 'quote', label: 'ประเมิน/เสนอราคา', kpi: 'รอประเมิน/เสนอราคา' },
  { key: 'approval', label: 'รอลูกค้าอนุมัติ', kpi: 'รอลูกค้าอนุมัติ' },
  { key: 'repair', label: 'กำลังซ่อม', kpi: 'กำลังซ่อม' },
  { key: 'return', label: 'Pack และส่งคืน', kpi: 'รอ Pack และส่งคืน' },
]

const SORT = {
  id: (j: JobView) => j.jobNo, customer: (j: JobView) => j.customerName ?? '', product: (j: JobView) => j.productName,
  branch: (j: JobView) => j.branch.name, hours: (j: JobView) => j.sla?.hoursInStep ?? 0, channel: (j: JobView) => j.channel ?? '',
  warranty: (j: JobView) => (j.hasWarranty ? 1 : 0), total: (j: JobView) => (j.quote && 'total' in j.quote ? Number(j.quote.total) : 0),
  days: (j: JobView) => j.quote?.repairDays ?? 0,
}

export default function VdClient({ role }: { role: string }) {
  const router = useRouter()
  const me = useMe()
  const [tab, setTab] = useState('receive')
  const [range, setRange] = useState({ from: '', to: '' })
  const [vendorFilter, setVendorFilter] = useState('')
  const [centerOptions, setCenterOptions] = useState<Array<{ id: string; label: string }>>([])
  const inp = useRowInputs()
  const { data, loading, reload, run, done, busy } = useQueue('VD', range, vendorFilter ? { vendorCenterId: vendorFilter } : undefined, inp.clear)
  const [openId, setOpenId] = useState<string | null>(null)
  const [filter, setFilter] = useState('ทั้งหมด')
  const [scan, setScan] = useState('')
  const [driverDoc, setDriverDoc] = useState<{ job: JobView; leg: string; url?: string } | null>(null)
  const [label, setLabel] = useState<LabelData | null>(null)
  const [lon, setLon] = useState<JobView | null>(null)
  const { toast } = useToast()
  const readOnly = role !== 'VD' && role !== 'ADMIN'
  const demo = me?.demoMode ?? false

  useEffect(() => {
    if (role === 'ADMIN') {
      fetch('/api/vendor-centers')
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d)) {
            setCenterOptions(
              d.map((c: { id: string; code: string; vendorParent?: { name?: string } }) => ({
                id: c.id,
                label: `${c.vendorParent?.name ?? c.code} (${c.code})`,
              })),
            )
          }
        })
        .catch(() => {})
    }
  }, [role])

  const vendors = useMemo(() => {
    if (centerOptions.length > 0) return centerOptions.map(c => [c.id, c.label] as [string, string])
    const map = new Map<string, string>()
    Object.values(data.tabs).flat().forEach(j => {
      if (j.vendor?.centerId && j.vendor?.name) {
        map.set(j.vendor.centerId, `${j.vendor.name} (${j.vendor.centerCode})`)
      }
    })
    return [...map.entries()]
  }, [centerOptions, data])

  const list = (k: string) => data.tabs[k] ?? []
  const pending = (k: string) => list(k).filter(j => !done[j.id]).length
  const overCount = (k: string) => list(k).filter(j => !done[j.id] && j.sla?.overdue).length
  const rowCls = (j: JobView) => (done[j.id] ? 'done-row' : '')

  const receiveRows = useMemo(() => list('receive').filter(j => filter === 'ทั้งหมด' || RECEIVE_TYPE[j.channel ?? ''] === filter), [data, filter]) // eslint-disable-line react-hooks/exhaustive-deps
  const s1 = useSort(receiveRows, SORT)
  const s2 = useSort(list('quote'), SORT)
  const s3 = useSort(list('approval'), SORT)
  const s4 = useSort(list('repair'), SORT)
  const s5 = useSort(list('return'), SORT)

  const handleDispatchDriver = async (j: JobView, method: 'PRINT' | 'LINK', leg: LogisticsLabelLeg) => {
    const r = await run(j, 'dispatch_pickup', { method }, 'ส่งรถเข้ารับแล้ว', { silent: true })
    if (!r) return
    if (method === 'PRINT') {
      toast('ส่งรถเข้ารับแล้ว — แสดงใบปะหน้ากล่องมาตรฐานไทวัสดุ', 'success')
      setLabel(buildLogisticsBoxLabel(j, leg))
    } else if (r.driverUrl) {
      const url = absUrl(String(r.driverUrl))
      try { await navigator.clipboard?.writeText(url) } catch { /* ignore */ }
      toast('แจ้งคนรถและคัดลอกลิงก์แล้ว', 'success')
      setDriverDoc({ job: j, leg: leg === 'DC_TO_VD' ? 'คลัง DC → VD' : 'สาขา → VD', url })
    }
  }

  const onScan = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = scan.trim().toLowerCase()
    if (!q) return
    const j = list('receive').find(x => x.jobNo.toLowerCase() === q && x.stage === 'OUTBOUND_TO_VD' && x.channel !== 'TPL')
    setScan('')
    if (j) await run(j, 'vd_receive', {}, 'ส่งมอบช่างแล้ว')
    else toast('ไม่พบใบแจ้งซ่อมนี้ในสถานะ "ขนส่ง VD รับแล้ว" ที่พร้อมส่งมอบช่าง', 'error')
  }

  const exportAll = () => exportXlsx(TABS.map(t => ({
    name: t.label.replace('/', ''),
    rows: list(t.key).map(j => ({ 'เลขที่ใบแจ้งซ่อม': j.jobNo, 'ลูกค้า': j.customerName ?? '', 'สินค้า': j.productName, 'สาขา': j.branch.name, 'ช่องทาง': RECEIVE_TYPE[j.channel ?? ''] ?? '', 'ประกัน': j.hasWarranty ? 'มีประกัน' : 'ไม่มีประกัน', 'รอมาแล้ว (ชม.)': j.sla?.hoursInStep ?? '', 'SLA (ชม.)': j.sla?.slaHours ?? '', 'วันที่เปิด': new Date(j.openedAt).toLocaleDateString('th-TH') })),
  })), `service_center_vd_${todayBkk()}.xlsx`)

  const commonCtx: VdTabCommonProps = { done, readOnly, busy, rowCls, onOpenJob: setOpenId, run }

  return (
    <div className="page">
      <QueueHeader
        title="ส่วนงานช่าง (VD)"
        sub="รับงาน → ประเมิน/เสนอราคา → รอลูกค้าอนุมัติ → กำลังซ่อม → Pack และส่งคืน"
        right={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {role === 'ADMIN' && vendors.length > 0 && (
              <select className="sel" value={vendorFilter} onChange={e => setVendorFilter(e.target.value)}>
                <option value="">ทุกศูนย์ VD ({vendors.length} ศูนย์)</option>
                {vendors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            )}
            <DateRange from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} onExport={exportAll} />
          </div>
        }
      />
      <OverdueSummary items={data.overdue.filter(o => !done[o.id])} onGo={t => setTab(t)} />
      <KpiGrid items={TABS.map(t => ({ tab: t.key, label: t.kpi, count: pending(t.key), over: overCount(t.key) }))} active={tab} onPick={setTab} />
      <TabBar tabs={TABS.map(t => ({ key: t.key, label: t.label, count: pending(t.key) }))} active={tab} onPick={setTab} />
      {readOnly && <p className="hint"><span className="text-amber-700 font-semibold text-xs">• โหมดดูอย่างเดียว</span></p>}
      {loading && <EmptyCard text="กำลังโหลด…" />}

      {!loading && tab === 'receive' && (
        <VdReceiveTab
          s1={s1}
          receiveRows={receiveRows}
          filter={filter}
          setFilter={setFilter}
          scan={scan}
          setScan={setScan}
          onScan={onScan}
          done={done}
          readOnly={readOnly}
          demo={demo}
          busy={busy}
          rowCls={rowCls}
          onOpenJob={setOpenId}
          onSetLabel={setLabel}
          onDispatchDriver={handleDispatchDriver}
          run={run}
        />
      )}
      {!loading && tab === 'quote' && <VdQuoteTab s2={s2} ctx={commonCtx} onGoQuote={id => router.push(`/vd/jobs/${id}/quote`)} />}
      {!loading && tab === 'approval' && <VdApprovalTab s3={s3} ctx={commonCtx} onSetLon={setLon} onReviseQuote={id => router.push(`/vd/jobs/${id}/quote?revise=1`)} />}
      {!loading && tab === 'repair' && <VdRepairTab s4={s4} ctx={commonCtx} />}
      {!loading && tab === 'return' && <VdReturnTab s5={s5} ctx={commonCtx} inp={inp} onSetLabel={setLabel} />}

      <DriverDoc doc={driverDoc} onClose={() => setDriverDoc(null)} />
      <PrintLabel data={label} onClose={() => setLabel(null)} />
      <LonPreview job={lon} demo={demo && !readOnly} onClose={() => setLon(null)} onDecided={() => { setLon(null); reload() }} />
      <JobDetailModal jobId={openId} role={role} onClose={() => setOpenId(null)} onChanged={() => reload(true)} />
    </div>
  )
}
