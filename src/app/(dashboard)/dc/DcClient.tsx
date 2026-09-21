'use client'

import { useMemo, useState } from 'react'
import { OverdueSummary, KpiGrid, TabBar, SlaCell, JobIdCell, QueueHeader, EmptyCard, DateRange } from '@/components/ui/Queue'
import PhotoButton from '@/components/ui/PhotoButton'
import PrintLabel, { type LabelData } from '@/components/ui/PrintLabel'
import JobDetailModal from '@/components/jobs/JobDetail'
import DriverDoc from '@/components/ui/DriverDoc'
import { useSort, Th } from '@/components/ui/Sortable'
import { useQueue, useRowInputs } from '@/components/ui/useQueue'
import { useToast } from '@/components/ui/Toast'
import { absUrl, exportXlsx, todayBkk } from '@/lib/client'
import type { JobView } from '@/lib/job-view'

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
}

const isValidDcLoc = (loc: string) => /^DC-\d{2}-[A-Z]$/i.test(loc.trim())

export default function DcClient({ role }: { role: string }) {
  const [tab, setTab] = useState('pickup')
  const [range, setRange] = useState({ from: '', to: '' })
  const { data, loading, reload, run, done, busy } = useQueue('DC', range)
  const inp = useRowInputs()
  const [openId, setOpenId] = useState<string | null>(null)
  const [branchFilter, setBranchFilter] = useState('')
  const [driverDoc, setDriverDoc] = useState<{ job: JobView; leg: string; url?: string } | null>(null)
  const [label, setLabel] = useState<LabelData | null>(null)
  const { toast } = useToast()
  const readOnly = role !== 'DC' && role !== 'ADMIN'

  const list = (k: string) => data.tabs[k] ?? []
  const pending = (k: string) => list(k).filter(j => !done[j.id]).length
  const overCount = (k: string) => list(k).filter(j => !done[j.id] && j.sla?.overdue).length
  const rowCls = (j: JobView) => (done[j.id] ? 'done-row' : '')

  const pickupRows = useMemo(() => list('pickup').filter(j => !branchFilter || j.branch.id === branchFilter), [data, branchFilter]) // eslint-disable-line react-hooks/exhaustive-deps
  const branches = useMemo(() => [...new Map(list('pickup').map(j => [j.branch.id, j.branch.name])).entries()], [data]) // eslint-disable-line react-hooks/exhaustive-deps
  const s1 = useSort(pickupRows, SORT)
  const s2 = useSort(list('receiveDC'), SORT)
  const s3 = useSort(list('handoffVD'), SORT)
  const s4 = useSort(list('returnFromVD'), SORT)
  const s5 = useSort(list('dispatchBranch'), SORT)

  const dispatch = async (j: JobView, method: 'PRINT' | 'LINK', legLabel: string) => {
    const r = await run(j, 'dispatch_pickup', { method }, 'แจ้งคนรถแล้ว', { silent: true })
    if (!r) return
    if (method === 'LINK' && r.driverUrl) {
      const url = absUrl(String(r.driverUrl))
      try { await navigator.clipboard?.writeText(url) } catch { /* ignore */ }
      setDriverDoc({ job: j, leg: legLabel, url })
      toast('สร้างลิงก์ให้คนรถแล้ว (คัดลอกแล้ว)', 'success')
    } else {
      setDriverDoc({ job: j, leg: legLabel })
    }
    await reload(true)
  }

  const shipBadge = (j: JobView, which: 'out' | 'in') => {
    const s = which === 'out' ? j.outboundShipment : j.inboundShipment
    if (!s || s.status === 'PENDING_DISPATCH') return null
    return s
  }

  const actionBtn = (j: JobView, text: string, disabled: boolean, onClick: () => void, reason?: string) => (
    done[j.id] ? <span className="badge b-green">{done[j.id]}</span> :
      <button className="btn btn-primary" disabled={disabled || readOnly || busy !== null} title={disabled ? reason : undefined} onClick={onClick}>{text}</button>
  )

  const exportAll = () => exportXlsx(TABS.map(t => ({
    name: t.label,
    rows: list(t.key).map(j => ({ 'เลขที่ใบแจ้งซ่อม': j.jobNo, 'สาขา': j.branch.name, 'ลูกค้า': j.customerName ?? '', 'สินค้า': j.productName, 'VD': j.vendor ? `${j.vendor.centerCode} ${j.vendor.name}` : '', 'รอมาแล้ว (ชม.)': j.sla?.hoursInStep ?? '', 'SLA (ชม.)': j.sla?.slaHours ?? '', 'เกิน SLA': j.sla?.overdue ? 'ใช่' : 'ไม่', 'Location': j.location ?? '' })),
  })), `service_center_dc_${todayBkk()}.xlsx`)

  return (
    <div className="page">
      <QueueHeader
        title="ส่วนงาน DC"
        sub="เข้ารับจากสาขา → รับเข้า Location → ส่งมอบให้ VD → รับคืนจาก VD → ส่งคืนกลับสาขา"
        right={<DateRange from={range.from} to={range.to} onChange={(from, to) => setRange({ from, to })} onExport={exportAll} />}
      />
      <OverdueSummary items={data.overdue.filter(o => !done[o.id])} onGo={t => setTab(t)} />
      <KpiGrid items={TABS.map(t => ({ tab: t.key, label: t.kpi, count: pending(t.key), over: overCount(t.key) }))} active={tab} onPick={setTab} />
      <TabBar tabs={TABS.map(t => ({ key: t.key, label: t.label, count: pending(t.key) }))} active={tab} onPick={setTab} />
      {readOnly && <p className="hint"><span className="badge b-amber">โหมดดูอย่างเดียว</span></p>}
      {loading && <EmptyCard text="กำลังโหลด…" />}

      {!loading && tab === 'pickup' && (
        <>
          <div className="filter-bar">
            <select className="sel" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
              <option value="">ทุกสาขา</option>
              {branches.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
            </select>
          </div>
          {pickupRows.length === 0 ? <EmptyCard /> : (
            <div className="tcard"><div className="tbl-wrap"><table className="tbl">
              <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s1} /><Th k="branch" label="สาขา" {...s1} /><Th k="customer" label="ลูกค้า" {...s1} /><Th k="product" label="สินค้า" {...s1} /><Th k="hours" label="รอมาแล้ว" {...s1} /><th>สถานะ / Action</th></tr></thead>
              <tbody>{s1.sorted.map(j => {
                const sh = shipBadge(j, 'out')
                return (
                  <tr key={j.id} className={rowCls(j)}>
                    <td><JobIdCell job={j} onOpen={() => setOpenId(j.id)} showDate /></td><td>{j.branch.name}</td><td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}</td><td><SlaCell job={j} /></td>
                    <td>{sh || done[j.id] ? <span className="badge b-green">แจ้งคนรถแล้ว — รอ GR ส่งมอบ</span> : (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className="btn" disabled={readOnly || busy !== null} onClick={() => dispatch(j, 'PRINT', 'สาขา → คลัง DC')}>Print เอกสารให้คนรถ</button>
                        <button className="btn" disabled={readOnly || busy !== null} onClick={() => dispatch(j, 'LINK', 'สาขา → คลัง DC')}>ส่ง Link ให้คนรถ</button>
                      </div>
                    )}</td>
                  </tr>
                )
              })}</tbody>
            </table></div></div>
          )}
        </>
      )}

      {!loading && tab === 'receiveDC' && (list('receiveDC').length === 0 ? <EmptyCard /> : (
        <div className="tcard"><div className="tbl-wrap"><table className="tbl">
          <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s2} /><Th k="branch" label="สาขาต้นทาง" {...s2} /><Th k="customer" label="ลูกค้า" {...s2} /><Th k="product" label="สินค้า" {...s2} /><Th k="hours" label="เวลาที่ค้าง" {...s2} /><th>เลขที่ Location (DC-00-A)</th><th>สถานะ</th></tr></thead>
          <tbody>{s2.sorted.map(j => {
            const locVal = inp.loc(j.id)
            const valid = isValidDcLoc(locVal)
            return (
              <tr key={j.id} className={rowCls(j)}>
                <td><JobIdCell job={j} onOpen={() => setOpenId(j.id)} /></td><td>{j.branch.name}</td><td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}</td><td><SlaCell job={j} /></td>
                <td>{done[j.id] ? locVal : <input className="inp inp-sm" style={{ width: 130 }} placeholder="เช่น DC-01-A" value={locVal} onChange={e => inp.setLoc(j.id, e.target.value)} disabled={readOnly} />}</td>
                <td>{actionBtn(j, 'ยืนยันรับเข้า Location', !valid, () => run(j, 'dc_receive_outbound', { location: locVal.trim().toUpperCase() }, 'รับเข้าแล้ว'), !valid ? 'Location ต้องเป็นรูปแบบ DC-00-A (เช่น DC-01-A)' : undefined)}</td>
              </tr>
            )
          })}</tbody>
        </table></div></div>
      ))}

      {!loading && tab === 'handoffVD' && (list('handoffVD').length === 0 ? <EmptyCard /> : (
        <div className="tcard"><div className="tbl-wrap"><table className="tbl">
          <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s3} /><Th k="customer" label="ลูกค้า" {...s3} /><Th k="product" label="สินค้า" {...s3} /><Th k="vd" label="VD ที่มารับ" {...s3} /><th>สถานะรถ VD</th><Th k="hours" label="เวลาที่ค้าง" {...s3} /><th>ถ่ายภาพ</th><th>สถานะ</th></tr></thead>
          <tbody>{s3.sorted.map(j => {
            const dispatched = j.outboundShipment?.legType === 'DC_TO_VD' && j.outboundShipment.status !== 'PENDING_DISPATCH'
            const hasPhoto = inp.photos(j.id).length > 0
            return (
              <tr key={j.id} className={rowCls(j)}>
                <td><JobIdCell job={j} onOpen={() => setOpenId(j.id)} /></td><td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}</td>
                <td>{j.vendor ? `${j.vendor.centerCode} ${j.vendor.name}` : '-'}{j.location && <div className="sub-mute">Location {j.location}</div>}</td>
                <td>{dispatched ? <span className="badge b-amber">VD ส่งรถแล้ว</span> : <span className="badge b-gray">รอ VD ส่งรถ</span>}</td>
                <td><SlaCell job={j} /></td>
                <td>{done[j.id] ? '✓' : <PhotoButton photos={inp.photos(j.id)} onChange={p => inp.setPhotos(j.id, p)} disabled={readOnly} />}</td>
                <td>{actionBtn(j, 'ยืนยันส่งมอบ + Clear Location', !dispatched || !hasPhoto, () => run(j, 'dc_handoff_vd', { photos: inp.photos(j.id) }, 'ส่งมอบแล้ว — Location clear'), !dispatched ? 'รอ VD ส่งรถมารับ' : !hasPhoto ? 'ต้องถ่ายภาพก่อน' : undefined)}</td>
              </tr>
            )
          })}</tbody>
        </table></div></div>
      ))}

      {!loading && tab === 'returnFromVD' && (list('returnFromVD').length === 0 ? <EmptyCard /> : (
        <div className="tcard"><div className="tbl-wrap"><table className="tbl">
          <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s4} /><Th k="customer" label="ลูกค้า" {...s4} /><Th k="product" label="สินค้า" {...s4} /><Th k="vd" label="VD ที่ส่งคืนมา" {...s4} /><Th k="hours" label="เวลาที่ค้าง" {...s4} /><th>ถ่ายภาพ</th><th>สถานะ</th></tr></thead>
          <tbody>{s4.sorted.map(j => {
            const hasPhoto = inp.photos(j.id).length > 0
            return (
              <tr key={j.id} className={rowCls(j)}>
                <td><JobIdCell job={j} onOpen={() => setOpenId(j.id)} /></td><td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}</td>
                <td>{j.vendor ? `${j.vendor.centerCode} ${j.vendor.name}` : '-'}</td><td><SlaCell job={j} /></td>
                <td>{done[j.id] ? '✓' : <PhotoButton photos={inp.photos(j.id)} onChange={p => inp.setPhotos(j.id, p)} disabled={readOnly} />}</td>
                <td>{actionBtn(j, 'ยืนยันรับคืนจาก VD', !hasPhoto, () => run(j, 'dc_receive_inbound', { photos: inp.photos(j.id) }, 'รับคืนแล้ว'), !hasPhoto ? 'ต้องถ่ายภาพก่อน' : undefined)}</td>
              </tr>
            )
          })}</tbody>
        </table></div></div>
      ))}

      {!loading && tab === 'dispatchBranch' && (list('dispatchBranch').length === 0 ? <EmptyCard /> : (
        <div className="tcard"><div className="tbl-wrap"><table className="tbl">
          <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s5} /><Th k="branch" label="สาขาปลายทาง" {...s5} /><Th k="customer" label="ลูกค้า" {...s5} /><Th k="product" label="สินค้า" {...s5} /><Th k="hours" label="เวลาที่ค้าง" {...s5} /><th>สถานะ / Action</th></tr></thead>
          <tbody>{s5.sorted.map(j => {
            const sh = shipBadge(j, 'in')
            const dispatched = sh && j.inboundShipment?.legType === 'DC_TO_BRANCH'
            return (
              <tr key={j.id} className={rowCls(j)}>
                <td><JobIdCell job={j} onOpen={() => setOpenId(j.id)} /></td><td>{j.branch.name}</td><td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}</td><td><SlaCell job={j} /></td>
                <td>{done[j.id] ? <span className="badge b-green">ส่งคืนกลับสาขาแล้ว — รอ GR รับที่สาขา</span> : !dispatched ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn" disabled={readOnly || busy !== null} onClick={() => dispatch(j, 'PRINT', 'คลัง DC → สาขา')}>Print เอกสารให้คนรถ</button>
                    <button className="btn" disabled={readOnly || busy !== null} onClick={() => dispatch(j, 'LINK', 'คลัง DC → สาขา')}>ส่ง Link ให้คนรถ</button>
                  </div>
                ) : (
                  <button className="btn btn-primary" disabled={readOnly || busy !== null} onClick={async () => {
                    const r = await run(j, 'dc_dispatch_confirm', {}, 'ส่งคืนกลับสาขาแล้ว — รอ GR รับที่สาขา')
                    if (r) setLabel({ title: 'ใบปะหน้ากล่อง (ขาคืน)', subtitle: 'จากคลัง DC', jobNo: j.jobNo, rows: [['สาขาปลายทาง', j.branch.name], ['สินค้า', j.productName]] })
                  }}>ยืนยัน: จัดส่งออกจาก DC แล้ว</button>
                )}</td>
              </tr>
            )
          })}</tbody>
        </table></div></div>
      ))}

      <DriverDoc doc={driverDoc} onClose={() => setDriverDoc(null)} />
      <PrintLabel data={label} onClose={() => setLabel(null)} />
      <JobDetailModal jobId={openId} role={role} onClose={() => setOpenId(null)} onChanged={() => reload(true)} />
    </div>
  )
}
