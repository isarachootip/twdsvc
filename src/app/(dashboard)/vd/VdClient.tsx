'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { OverdueSummary, KpiGrid, TabBar, SlaCell, JobIdCell, QueueHeader, EmptyCard, DateRange } from '@/components/ui/Queue'
import PhotoButton from '@/components/ui/PhotoButton'
import PrintLabel, { type LabelData } from '@/components/ui/PrintLabel'
import DriverDoc from '@/components/ui/DriverDoc'
import JobDetailModal from '@/components/jobs/JobDetail'
import LonPreview from '@/components/jobs/LonPreview'
import { useSort, Th } from '@/components/ui/Sortable'
import { useQueue, useRowInputs } from '@/components/ui/useQueue'
import { useToast } from '@/components/ui/Toast'
import { useMe } from '@/components/ui/useMe'
import { absUrl, exportXlsx, todayBkk } from '@/lib/client'
import { fmtBaht } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'

const TABS = [
  { key: 'receive', label: 'งานรอรับ', kpi: 'งานรอรับ' },
  { key: 'quote', label: 'ประเมิน/เสนอราคา', kpi: 'รอประเมิน/เสนอราคา' },
  { key: 'approval', label: 'รอลูกค้าอนุมัติ', kpi: 'รอลูกค้าอนุมัติ' },
  { key: 'repair', label: 'กำลังซ่อม', kpi: 'กำลังซ่อม' },
  { key: 'return', label: 'Pack และส่งคืน', kpi: 'รอ Pack และส่งคืน' },
]
const RECEIVE_TYPE: Record<string, string> = { DC: 'เข้ารับที่ DC', DSD: 'เข้ารับที่สาขา', TPL: 'รอ 3PL มาส่ง' }
const RETURN_CH: Record<string, string> = { DC: 'DC', DSD: 'สาขา (ผ่าน GR)', TPL: '3PL' }

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
            setCenterOptions(d.map((c: any) => ({ id: c.id, label: `${c.vendorParent?.name ?? c.code} (${c.code})` })))
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

  const dispatch = async (j: JobView, method: 'PRINT' | 'LINK') => {
    const leg = j.stage === 'AT_DC_OUTBOUND' ? 'คลัง DC → ศูนย์ซ่อม VD' : 'สาขา → ศูนย์ซ่อม VD'
    const r = await run(j, 'dispatch_pickup', { method }, 'ส่งรถเข้ารับแล้ว', { silent: true })
    if (!r) return
    if (method === 'LINK' && r.driverUrl) {
      const url = absUrl(String(r.driverUrl))
      try { await navigator.clipboard?.writeText(url) } catch { /* ignore */ }
      setDriverDoc({ job: j, leg, url })
    } else setDriverDoc({ job: j, leg })
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

  const receiveCell = (j: JobView) => {
    if (done[j.id]) return <span className="badge b-green">{done[j.id]}</span>
    const ship = j.outboundShipment
    const shipPending = !ship || ship.status === 'PENDING_DISPATCH'
    if (j.channel === 'TPL') {
      if (j.stage === 'GR_PACKED') return <span className="badge b-blue">Booked 3PL #{ship?.trackingNo} — รอ GR ส่งมอบ</span>
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          <span className="badge b-blue">รอ 3PL นำส่งถึงศูนย์บริการ</span>
          {demo && !readOnly && <button className="btn btn-primary" disabled={busy !== null} onClick={() => run(j, 'tpl_delivered', { note: 'จำลอง API 3PL แจ้งส่งสำเร็จ' }, 'ส่งมอบช่างแล้ว')}>จำลอง: API 3PL แจ้งส่งสำเร็จ</button>}
        </div>
      )
    }
    if (j.stage === 'AT_DC_OUTBOUND' || (j.stage === 'GR_PACKED' && j.channel === 'DSD')) {
      if (shipPending) {
        return (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn" disabled={readOnly || busy !== null} onClick={() => dispatch(j, 'PRINT')}>Print เอกสารให้คนรถ</button>
            <button className="btn" disabled={readOnly || busy !== null} onClick={() => dispatch(j, 'LINK')}>ส่ง Link ให้คนรถ</button>
          </div>
        )
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          <span className="badge b-amber">ส่งรถเข้ารับแล้ว — รอรับของ</span>
          <button className="btn btn-primary" disabled={readOnly || busy !== null} onClick={() => run(j, 'carrier_confirm_pickup', {}, 'คนรถรับของแล้ว')}>คนรถยืนยันรับของ (ขึ้นรถ)</button>
        </div>
      )
    }
    // OUTBOUND_TO_VD
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
        <span className="badge b-teal">ขนส่ง VD รับแล้ว</span>
        <button className="btn btn-primary" disabled={readOnly || busy !== null} onClick={() => run(j, 'vd_receive', {}, 'ส่งมอบช่างแล้ว')}>ส่งมอบช่าง (ถึงศูนย์บริการ VD)</button>
      </div>
    )
  }

  const exportAll = () => exportXlsx(TABS.map(t => ({
    name: t.label.replace('/', ''),
    rows: list(t.key).map(j => ({ 'เลขที่ใบแจ้งซ่อม': j.jobNo, 'ลูกค้า': j.customerName ?? '', 'สินค้า': j.productName, 'สาขา': j.branch.name, 'ช่องทาง': RECEIVE_TYPE[j.channel ?? ''] ?? '', 'ประกัน': j.hasWarranty ? 'มีประกัน' : 'ไม่มีประกัน', 'รอมาแล้ว (ชม.)': j.sla?.hoursInStep ?? '', 'SLA (ชม.)': j.sla?.slaHours ?? '', 'วันที่เปิด': new Date(j.openedAt).toLocaleDateString('th-TH') })),
  })), `service_center_vd_${todayBkk()}.xlsx`)

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
      {readOnly && <p className="hint"><span className="badge b-amber">โหมดดูอย่างเดียว</span></p>}
      {loading && <EmptyCard text="กำลังโหลด…" />}

      {!loading && tab === 'receive' && (
        <>
          <form className="filter-bar" onSubmit={onScan}>
            <select className="sel" value={filter} onChange={e => setFilter(e.target.value)}>
              {['ทั้งหมด', 'เข้ารับที่ DC', 'เข้ารับที่สาขา', 'รอ 3PL มาส่ง'].map(o => <option key={o}>{o}</option>)}
            </select>
            <input className="inp" style={{ flex: 1, minWidth: 280 }} value={scan} onChange={e => setScan(e.target.value)} disabled={readOnly} placeholder="Scan QR หรือคีย์เลขใบแจ้งซ่อม เพื่อยืนยันส่งมอบช่าง แล้วกด Enter" />
          </form>
          {receiveRows.length === 0 ? <EmptyCard /> : (
            <div className="tcard"><div className="tbl-wrap"><table className="tbl">
              <thead><tr>
                <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s1} /><Th k="customer" label="ลูกค้า" {...s1} /><Th k="product" label="สินค้า" {...s1} /><Th k="branch" label="สาขาที่รับ" {...s1} />
                <Th k="channel" label="ประเภทรับเข้า" {...s1} /><Th k="warranty" label="ประกัน" {...s1} /><Th k="hours" label="รอมาแล้ว" {...s1} /><th>สถานะ / Action</th>
              </tr></thead>
              <tbody>{s1.sorted.map(j => (
                <tr key={j.id} className={rowCls(j)}>
                  <td><JobIdCell job={j} onOpen={() => setOpenId(j.id)} showDate /></td>
                  <td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}</td><td>{j.branch.name}</td>
                  <td><span className="badge b-blue">{RECEIVE_TYPE[j.channel ?? ''] ?? '-'}</span></td>
                  <td>{j.type === 'STOCK' ? '-' : j.hasWarranty ? 'มีประกัน' : 'ไม่มีประกัน'}</td>
                  <td><SlaCell job={j} /></td>
                  <td>{receiveCell(j)}</td>
                </tr>
              ))}</tbody>
            </table></div></div>
          )}
        </>
      )}

      {!loading && tab === 'quote' && (list('quote').length === 0 ? <EmptyCard /> : (
        <div className="tcard"><div className="tbl-wrap"><table className="tbl">
          <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s2} /><Th k="customer" label="ลูกค้า" {...s2} /><Th k="product" label="สินค้า" {...s2} /><Th k="warranty" label="ประกัน" {...s2} /><Th k="hours" label="รอมาแล้ว" {...s2} /><th>สถานะ</th></tr></thead>
          <tbody>{s2.sorted.map(j => (
            <tr key={j.id} className={rowCls(j)}>
              <td><JobIdCell job={j} onOpen={() => setOpenId(j.id)} /></td><td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}</td>
              <td>{j.type === 'STOCK' ? 'งานสต็อก' : j.hasWarranty ? 'มีประกัน' : 'ไม่มีประกัน'}</td><td><SlaCell job={j} /></td>
              <td>{done[j.id] ? <span className="badge b-green">{done[j.id]}</span> : j.type === 'STOCK' ? (
                <button className="btn btn-primary" disabled={readOnly || busy !== null} onClick={() => run(j, 'vd_start_repair', {}, 'เริ่มซ่อมแล้ว')}>เริ่มซ่อม</button>
              ) : (
                <button className="btn btn-primary" disabled={readOnly} onClick={() => router.push(`/vd/jobs/${j.id}/quote`)}>ประเมิน + เสนอราคา</button>
              )}</td>
            </tr>
          ))}</tbody>
        </table></div></div>
      ))}

      {!loading && tab === 'approval' && (list('approval').length === 0 ? <EmptyCard /> : (
        <div className="tcard"><div className="tbl-wrap"><table className="tbl">
          <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s3} /><Th k="customer" label="ลูกค้า" {...s3} /><Th k="product" label="สินค้า" {...s3} /><Th k="total" label="ยอดเสนอราคา" {...s3} /><Th k="hours" label="รอมาแล้ว" {...s3} /><th></th></tr></thead>
          <tbody>{s3.sorted.map(j => (
            <tr key={j.id} className={rowCls(j)}>
              <td><JobIdCell job={j} onOpen={() => setOpenId(j.id)} /></td><td>{j.customerName}</td><td>{j.productName}</td>
              <td>{j.quote && 'total' in j.quote ? fmtBaht(Number(j.quote.total)) : '-'}{j.quote && 'expiresAt' in j.quote && j.quote.expiresAt && new Date(j.quote.expiresAt) < new Date() && <div><span className="badge b-red">ลิงก์หมดอายุ</span></div>}</td>
              <td><SlaCell job={j} /></td>
              <td><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="btn" onClick={() => setLon(j)}>ดูหน้า LON ลูกค้า</button>
                <button className="btn" disabled={readOnly} onClick={() => router.push(`/vd/jobs/${j.id}/quote?revise=1`)}>แก้ไขใบเสนอราคา</button>
              </div></td>
            </tr>
          ))}</tbody>
        </table></div></div>
      ))}

      {!loading && tab === 'repair' && (list('repair').length === 0 ? <EmptyCard /> : (
        <div className="tcard"><div className="tbl-wrap"><table className="tbl">
          <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s4} /><Th k="customer" label="ลูกค้า" {...s4} /><Th k="product" label="สินค้า" {...s4} /><Th k="days" label="ระยะเวลาซ่อม (วัน)" {...s4} /><Th k="hours" label="เวลาที่ใช้ไป" {...s4} /><th>รออะไหล่</th><th>สถานะ</th></tr></thead>
          <tbody>{s4.sorted.map(j => (
            <tr key={j.id} className={rowCls(j)}>
              <td><JobIdCell job={j} onOpen={() => setOpenId(j.id)} /></td><td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}</td>
              <td>{j.quote?.repairDays ? `${j.quote.repairDays} วัน` : '-'}</td><td><SlaCell job={j} /></td>
              <td>{!done[j.id] && (j.sla?.paused ? (
                <button className="btn" disabled={readOnly || busy !== null} onClick={() => run(j, 'vd_resume_parts', {}, 'ซ่อมต่อ', { silent: true })}>▶ ซ่อมต่อ</button>
              ) : (
                <button className="btn" disabled={readOnly || busy !== null} onClick={() => run(j, 'vd_pause_parts', {}, 'รออะไหล่', { silent: true })}>⏸ รออะไหล่</button>
              ))}</td>
              <td>{done[j.id] ? <span className="badge b-green">{done[j.id]}</span> : <button className="btn btn-primary" disabled={readOnly || busy !== null} onClick={() => run(j, 'vd_finish_repair', {}, 'ซ่อมเสร็จ')}>ซ่อมเสร็จ</button>}</td>
            </tr>
          ))}</tbody>
        </table></div></div>
      ))}

      {!loading && tab === 'return' && (list('return').length === 0 ? <EmptyCard /> : (
        <div className="tcard"><div className="tbl-wrap"><table className="tbl">
          <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s5} /><Th k="customer" label="ลูกค้า" {...s5} /><Th k="product" label="สินค้า" {...s5} /><Th k="channel" label="ช่องทางส่งคืน" {...s5} /><Th k="hours" label="เวลาที่ค้าง" {...s5} /><th>สถานะ / Action</th></tr></thead>
          <tbody>{s5.sorted.map(j => (
            <tr key={j.id} className={rowCls(j)}>
              <td><JobIdCell job={j} onOpen={() => setOpenId(j.id)} /></td><td>{j.customerName ?? 'สต็อกสาขา'}</td><td>{j.productName}{j.decision === 'REJECTED' && <div><span className="badge b-coral">ลูกค้าไม่อนุมัติซ่อม</span></div>}</td>
              <td><span className="badge b-blue">{RETURN_CH[j.channel ?? ''] ?? '-'}</span></td><td><SlaCell job={j} /></td>
              <td>{done[j.id] ? <span className="badge b-green">{done[j.id]}</span> : j.channel === 'TPL' ? (
                <button className="btn btn-primary" disabled={readOnly || busy !== null} onClick={async () => {
                  const r = await run(j, 'vd_return_pack', {}, 'รอ 3PL มารับ (Auto Book แล้ว)')
                  if (r) setLabel({ title: 'ใบปะหน้ากล่อง (ขาส่งคืน)', subtitle: `จาก ${j.vendor?.code ?? ''} ${j.vendor?.name ?? ''} (Auto Book 3PL #${r.trackingNo ?? ''})`, jobNo: j.jobNo, rows: [['สาขาปลายทาง', j.branch.name], ['ช่องทางส่งคืน', '3PL']] })
                }}>Confirm ซ่อมเสร็จ พร้อมส่งคืน (Auto Book 3PL)</button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                  <PhotoButton photos={inp.photos(j.id)} onChange={p => inp.setPhotos(j.id, p)} disabled={readOnly} />
                  <button className="btn btn-primary" disabled={!inp.photos(j.id).length || readOnly || busy !== null} onClick={async () => {
                    const r = await run(j, 'vd_return_pack', { photos: inp.photos(j.id) }, j.channel === 'DC' ? 'ส่งให้ DC แล้ว — รอ DC รับและส่งต่อสาขา' : 'ส่งมอบ GR แล้ว — รอ GR แจ้งลูกค้า')
                    if (r) setLabel({ title: 'ใบปะหน้ากล่อง (ขาส่งคืน)', subtitle: `จาก ${j.vendor?.code ?? ''} ${j.vendor?.name ?? ''}`, jobNo: j.jobNo, rows: [['สาขาปลายทาง', j.branch.name], ['ช่องทางส่งคืน', j.channel === 'DC' ? 'DC' : 'สาขา (ส่งมอบ GR)']] })
                  }}>{j.channel === 'DC' ? 'Pack เสร็จ + พิมพ์ใบปะหน้า (ส่งให้ DC)' : 'Pack เสร็จ + ส่งมอบให้ GR'}</button>
                </div>
              )}</td>
            </tr>
          ))}</tbody>
        </table></div></div>
      ))}

      <DriverDoc doc={driverDoc} onClose={() => setDriverDoc(null)} />
      <PrintLabel data={label} onClose={() => setLabel(null)} />
      <LonPreview job={lon} demo={demo && !readOnly} onClose={() => setLon(null)} onDecided={() => { setLon(null); reload() }} />
      <JobDetailModal jobId={openId} role={role} onClose={() => setOpenId(null)} onChanged={() => reload(true)} />
    </div>
  )
}
