'use client'

import { useMemo, useRef, useState } from 'react'
import { OverdueSummary, KpiGrid, TabBar, SlaCell, JobIdCell, QueueHeader, EmptyCard } from '@/components/ui/Queue'
import PhotoButton from '@/components/ui/PhotoButton'
import PrintLabel, { type LabelData } from '@/components/ui/PrintLabel'
import JobDetailModal from '@/components/jobs/JobDetail'
import { useSort, Th } from '@/components/ui/Sortable'
import { useQueue, useRowInputs } from '@/components/ui/useQueue'
import { useToast } from '@/components/ui/Toast'
import { CHANNEL_LABELS } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'

const TABS = [
  { key: 'receive', label: 'รับจาก CS', kpi: 'รอรับจาก CS' },
  { key: 'pack', label: 'Pack สินค้า', kpi: 'รอ Pack' },
  { key: 'handoff', label: 'ส่งมอบขนส่ง', kpi: 'รอส่งมอบขนส่ง' },
  { key: 'return', label: 'รับคืนจาก VD/DC/3PL', kpi: 'รอรับคืนจาก VD/DC/3PL' },
  { key: 'deliverCS', label: 'รอส่งมอบ CS', kpi: 'รอส่งมอบ CS' },
]

const SORT = {
  id: (j: JobView) => j.jobNo, customer: (j: JobView) => j.customerName ?? '', product: (j: JobView) => j.productName,
  branch: (j: JobView) => j.branch.name, hours: (j: JobView) => j.sla?.hoursInStep ?? 0, channel: (j: JobView) => j.channel ?? '',
}

const isValidGrLoc = (loc: string) => /^[A-Z]-\d{2}-\d{2}$/i.test(loc.trim())

function truckStatus(j: JobView) {
  const s = j.outboundShipment
  if (!s || s.status === 'PENDING_DISPATCH') return { ready: false, badge: <span className="badge b-gray">รอจัดรถ</span> }
  if (s.carrier === 'TPL') return { ready: true, badge: <span className="badge b-coral">Booked #{s.trackingNo}</span> }
  if (s.status === 'DISPATCHED') return { ready: true, badge: <span className="badge b-amber">แจ้งคนรถแล้ว</span> }
  return { ready: true, badge: <span className="badge b-green">ขนส่งรับแล้ว</span> }
}

export default function GrClient({ role }: { role: string }) {
  const [tab, setTab] = useState('receive')
  const { data, loading, reload, run, done, busy } = useQueue('GR')
  const inp = useRowInputs()
  const [label, setLabel] = useState<LabelData | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<string | null>(null)
  const [scan, setScan] = useState('')
  const scanRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const readOnly = role !== 'GR' && role !== 'ADMIN'

  const list = (k: string) => data.tabs[k] ?? []
  const pending = (k: string) => list(k).filter(j => !done[j.id]).length
  const overCount = (k: string) => list(k).filter(j => !done[j.id] && j.sla?.overdue).length

  const onScan = (e: React.FormEvent) => {
    e.preventDefault()
    const q = scan.trim().toLowerCase()
    if (!q) return
    for (const t of TABS) {
      const j = list(t.key).find(x => x.jobNo.toLowerCase() === q)
      if (j) {
        setTab(t.key)
        setHighlight(j.id)
        setTimeout(() => document.getElementById(`row-${j.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
        setScan('')
        return
      }
    }
    toast('ไม่พบเลขงานนี้ในคิว GR', 'error')
  }

  const doneBadge = (j: JobView) => <span className="badge b-green">{done[j.id]}</span>
  const rowCls = (j: JobView) => `${done[j.id] ? 'done-row' : ''} ${highlight === j.id ? 'highlight' : ''}`

  const receive = useSort(list('receive'), SORT)
  const pack = useSort(list('pack'), SORT)
  const ret = useSort(list('return'), SORT)
  const dcs = useSort(list('deliverCS'), SORT)

  const handoffGroups = useMemo(() => [
    { ch: 'DC', cls: 'dc', title: 'DC (ฝากส่ง)', badge: 'b-blue' },
    { ch: 'DSD', cls: 'vd', title: 'DSD (VD เข้ารับที่สาขา)', badge: 'b-teal' },
    { ch: 'TPL', cls: 'tpl', title: '3PL (ขนส่งภายนอก)', badge: 'b-coral' },
  ], [])

  const actBtn = (j: JobView, text: string, disabled: boolean, onClick: () => void, reason?: string) => (
    done[j.id] ? doneBadge(j) : (
      <button className="btn btn-primary" disabled={disabled || readOnly || busy !== null} title={disabled ? reason : undefined} onClick={onClick}>{text}</button>
    )
  )

  return (
    <div className="page">
      <QueueHeader
        title="ส่วนงาน GR"
        sub="รับสินค้าจาก CS → Pack และพิมพ์ใบปะหน้า → ส่งมอบขนส่ง → รับของซ่อมคืน → ส่งมอบ CS"
        right={<button className="btn" onClick={() => reload()}>↻ รีเฟรช</button>}
      />
      <OverdueSummary items={data.overdue.filter(o => !done[o.id])} onGo={(t, id) => { setTab(t); setHighlight(id) }} />
      <KpiGrid items={TABS.map(t => ({ tab: t.key, label: t.kpi, count: pending(t.key), over: overCount(t.key) }))} active={tab} onPick={setTab} />
      <TabBar tabs={TABS.map(t => ({ key: t.key, label: t.label, count: pending(t.key) }))} active={tab} onPick={setTab} />

      <form className="filter-bar" onSubmit={onScan}>
        <input ref={scanRef} className="inp" style={{ flex: 1, maxWidth: 460 }} value={scan} onChange={e => setScan(e.target.value)} placeholder="สแกน QR / คีย์เลขใบแจ้งซ่อม แล้วกด Enter เพื่อหางาน" />
        {readOnly && <span className="badge b-amber">โหมดดูอย่างเดียว</span>}
      </form>

      {loading && <EmptyCard text="กำลังโหลด…" />}

      {!loading && tab === 'receive' && (list('receive').length === 0 ? <EmptyCard /> : (
        <div className="tcard"><div className="tbl-wrap"><table className="tbl">
          <thead><tr>
            <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...receive} /><Th k="customer" label="ลูกค้า" {...receive} /><Th k="product" label="สินค้า" {...receive} />
            <Th k="branch" label="สาขา" {...receive} /><Th k="hours" label="รอมาแล้ว" {...receive} /><th>ถ่ายภาพ</th><th>เลขที่ Location (A-00-00)</th><th>สถานะ</th>
          </tr></thead>
          <tbody>{receive.sorted.map(j => {
            const locVal = inp.loc(j.id)
            const validLoc = isValidGrLoc(locVal)
            const hasPhoto = inp.photos(j.id).length > 0
            const canSubmit = hasPhoto && validLoc
            const reason = !hasPhoto ? 'ต้องถ่ายภาพก่อน' : !validLoc ? 'Location ต้องเป็นรูปแบบ A-00-00 (เช่น A-05-02)' : undefined
            return (
              <tr key={j.id} id={`row-${j.id}`} className={rowCls(j)}>
                <td><JobIdCell job={j} onOpen={() => setOpenId(j.id)} /></td><td>{j.customerName ?? (j.type === 'STOCK' ? 'สต็อกสาขา' : '-')}</td><td>{j.productName}</td><td>{j.branch.name}</td>
                <td><SlaCell job={j} /></td>
                <td>{done[j.id] ? '✓' : <PhotoButton photos={inp.photos(j.id)} onChange={p => inp.setPhotos(j.id, p)} disabled={readOnly} />}</td>
                <td>{done[j.id] ? locVal : <input className="inp inp-sm" style={{ width: 120 }} value={locVal} placeholder="เช่น A-05-02" onChange={e => inp.setLoc(j.id, e.target.value)} disabled={readOnly} />}</td>
                <td>{j.intakeUnpaid && !done[j.id] ? <span className="badge b-amber">รอชำระค่าดำเนินการ</span> : actBtn(j, 'ยืนยันรับสินค้า', !canSubmit, () => run(j, 'gr_receive', { photos: inp.photos(j.id), location: locVal.trim().toUpperCase() }, 'รับแล้ว'), reason)}</td>
              </tr>
            )
          })}</tbody>
        </table></div></div>
      ))}

      {!loading && tab === 'pack' && (list('pack').length === 0 ? <EmptyCard /> : (
        <div className="tcard"><div className="tbl-wrap"><table className="tbl">
          <thead><tr>
            <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...pack} /><Th k="customer" label="ลูกค้า" {...pack} /><Th k="product" label="สินค้า" {...pack} />
            <Th k="channel" label="ช่องทาง" {...pack} /><Th k="hours" label="เวลาที่ค้าง" {...pack} /><th>Location เดิม</th><th>Location ใหม่ (A-00-00)</th><th>ถ่ายภาพ</th><th>สถานะ</th>
          </tr></thead>
          <tbody>{pack.sorted.map(j => {
            const locVal = inp.loc(j.id)
            const validLoc = isValidGrLoc(locVal)
            const hasPhoto = inp.photos(j.id).length > 0
            const canSubmit = hasPhoto && validLoc
            const reason = !hasPhoto ? 'ต้องถ่ายภาพก่อน' : !validLoc ? 'Location ใหม่ต้องเป็นรูปแบบ A-00-00 (เช่น B-01-04)' : undefined
            return (
              <tr key={j.id} id={`row-${j.id}`} className={rowCls(j)}>
                <td><JobIdCell job={j} onOpen={() => setOpenId(j.id)} /></td><td>{j.customerName ?? (j.type === 'STOCK' ? 'สต็อกสาขา' : '-')}</td><td>{j.productName}</td>
                <td><span className="badge b-blue">{j.channel ? CHANNEL_LABELS[j.channel] : '-'}</span></td>
                <td><SlaCell job={j} /></td>
                <td>{j.location ?? '-'}</td>
                <td>{done[j.id] ? locVal : <input className="inp inp-sm" style={{ width: 120 }} value={locVal} placeholder="เช่น B-01-04" onChange={e => inp.setLoc(j.id, e.target.value)} disabled={readOnly} />}</td>
                <td>{done[j.id] ? '✓' : <PhotoButton photos={inp.photos(j.id)} onChange={p => inp.setPhotos(j.id, p)} disabled={readOnly} />}</td>
                <td>{actBtn(j, 'Pack เสร็จ + พิมพ์ใบปะหน้า', !canSubmit, async () => {
                  const r = await run(j, 'gr_pack', { photos: inp.photos(j.id), location: locVal.trim().toUpperCase() }, 'Pack แล้ว')
                  if (r) setLabel({ title: 'ใบปะหน้ากล่อง (ขาไป)', subtitle: `ปลายทาง: ${j.channel === 'DC' ? 'DC' : j.channel === 'TPL' ? `3PL #${r.trackingNo ?? ''}` : 'VD (DSD)'}`, jobNo: j.jobNo, rows: [['สินค้า', j.productName], ['รหัส VD ปลายทาง', j.vendor ? `${j.vendor.centerCode} ${j.vendor.name}` : '-'], ['สาขาต้นทาง', j.branch.name]] })
                }, reason)}</td>
              </tr>
            )
          })}</tbody>
        </table></div></div>
      ))}

      {!loading && tab === 'handoff' && (
        <div className="tcard">
          {handoffGroups.map(g => {
            const rows = list('handoff').filter(j => j.channel === g.ch)
            return <HandoffSection key={g.ch} g={g} rows={rows} done={done} rowCls={rowCls} inp={inp} readOnly={readOnly} busy={busy}
              onOpen={setOpenId}
              onConfirm={j => run(j, 'gr_handoff', { photos: inp.photos(j.id) }, 'ส่งมอบแล้ว')} />
          })}
        </div>
      )}

      {!loading && tab === 'return' && (list('return').length === 0 ? <EmptyCard /> : (
        <div className="tcard"><div className="tbl-wrap"><table className="tbl">
          <thead><tr>
            <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...ret} /><Th k="customer" label="ลูกค้า" {...ret} /><Th k="product" label="สินค้า" {...ret} />
            <Th k="channel" label="ช่องทางที่ส่งคืนมา" {...ret} /><Th k="hours" label="เวลาที่ค้าง" {...ret} /><th>ถ่ายภาพ</th><th>เลขที่ Location (A-00-00)</th><th>สถานะ</th>
          </tr></thead>
          <tbody>{ret.sorted.map(j => {
            const locVal = inp.loc(j.id)
            const validLoc = isValidGrLoc(locVal)
            const hasPhoto = inp.photos(j.id).length > 0
            const canSubmit = hasPhoto && validLoc
            const reason = !hasPhoto ? 'ต้องถ่ายภาพก่อน' : !validLoc ? 'Location ต้องเป็นรูปแบบ A-00-00 (เช่น C-02-05)' : undefined
            return (
              <tr key={j.id} id={`row-${j.id}`} className={rowCls(j)}>
                <td><JobIdCell job={j} onOpen={() => setOpenId(j.id)} /></td><td>{j.customerName ?? (j.type === 'STOCK' ? 'สต็อกสาขา' : '-')}</td><td>{j.productName}</td>
                <td><span className="badge b-blue">{j.channel ? CHANNEL_LABELS[j.channel] : '-'}</span>{j.inboundShipment?.trackingNo && <div className="sub-mute">#{j.inboundShipment.trackingNo}</div>}</td>
                <td><SlaCell job={j} /></td>
                <td>{done[j.id] ? '✓' : <PhotoButton photos={inp.photos(j.id)} onChange={p => inp.setPhotos(j.id, p)} disabled={readOnly} />}</td>
                <td>{done[j.id] ? locVal : <input className="inp inp-sm" style={{ width: 120 }} value={locVal} placeholder="เช่น C-02-05" onChange={e => inp.setLoc(j.id, e.target.value)} disabled={readOnly} />}</td>
                <td>{actBtn(j, 'ยืนยันรับคืน', !canSubmit, () => run(j, 'gr_receive_return', { photos: inp.photos(j.id), location: locVal.trim().toUpperCase() }, 'รับคืนแล้ว'), reason)}</td>
              </tr>
            )
          })}</tbody>
        </table></div></div>
      ))}

      {!loading && tab === 'deliverCS' && (list('deliverCS').length === 0 ? <EmptyCard text="ไม่มีงานรอส่งมอบ CS" /> : (
        <div className="tcard"><div className="tbl-wrap"><table className="tbl">
          <thead><tr>
            <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...dcs} /><Th k="customer" label="ลูกค้า" {...dcs} /><Th k="product" label="สินค้า" {...dcs} />
            <th>Location</th><Th k="hours" label="เวลาที่ค้าง" {...dcs} /><th>ถ่ายภาพ</th><th>สถานะ</th>
          </tr></thead>
          <tbody>{dcs.sorted.map(j => {
            const hasPhoto = inp.photos(j.id).length > 0
            return (
              <tr key={j.id} id={`row-${j.id}`} className={rowCls(j)}>
                <td><JobIdCell job={j} onOpen={() => setOpenId(j.id)} /></td><td>{j.customerName ?? (j.type === 'STOCK' ? 'สต็อกสาขา' : '-')}</td><td>{j.productName}</td>
                <td>{j.location ?? '-'}</td>
                <td><SlaCell job={j} /></td>
                <td>{done[j.id] ? '✓' : <PhotoButton photos={inp.photos(j.id)} onChange={p => inp.setPhotos(j.id, p)} disabled={readOnly} />}</td>
                <td>{actBtn(j, j.type === 'STOCK' ? 'ส่งมอบให้สาขา (S2)' : 'ส่งมอบให้ CS', !hasPhoto, () => run(j, 'gr_deliver_cs', { photos: inp.photos(j.id) }, 'ส่งมอบ CS แล้ว'), 'ต้องถ่ายภาพก่อน')}</td>
              </tr>
            )
          })}</tbody>
        </table></div></div>
      ))}

      <PrintLabel data={label} onClose={() => setLabel(null)} />
      <JobDetailModal jobId={openId} role={role} onClose={() => setOpenId(null)} onChanged={() => reload(true)} />
    </div>
  )
}

function HandoffSection({ g, rows, done, rowCls, inp, readOnly, busy, onConfirm, onOpen }: {
  g: { ch: string; cls: string; title: string; badge: string }
  rows: JobView[]
  done: Record<string, string>
  rowCls: (j: JobView) => string
  inp: ReturnType<typeof useRowInputs>
  readOnly: boolean
  busy: string | null
  onConfirm: (j: JobView) => void
  onOpen: (id: string) => void
}) {
  const s = useSort(rows, SORT)
  const pendingN = rows.filter(j => !done[j.id]).length
  return (
    <div className={`channel-section ${g.cls}`}>
      <div className="subhead"><span>{g.title}</span><span className={`badge ${g.badge}`}>{pendingN} งานรอส่งมอบ</span></div>
      {rows.length === 0 ? <div className="empty" style={{ padding: 16 }}>ไม่มีงานในช่องทางนี้</div> : (
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr>
            <Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s} /><Th k="customer" label="ลูกค้า" {...s} /><Th k="product" label="สินค้า" {...s} />
            <th>ปลายทาง VD</th><Th k="hours" label="เวลาที่ค้าง" {...s} /><th>สถานะรถ</th><th>ถ่ายภาพ</th><th>สถานะ</th>
          </tr></thead>
          <tbody>{s.sorted.map(j => {
            const t = truckStatus(j)
            const hasPhoto = inp.photos(j.id).length > 0
            const canConfirm = t.ready && hasPhoto
            return (
              <tr key={j.id} id={`row-${j.id}`} className={rowCls(j)}>
                <td><JobIdCell job={j} onOpen={() => onOpen(j.id)} /></td><td>{j.customerName ?? (j.type === 'STOCK' ? 'สต็อกสาขา' : '-')}</td><td>{j.productName}</td>
                <td>{j.vendor ? `${j.vendor.name} (${j.vendor.centerCode})` : '-'}</td>
                <td><SlaCell job={j} /></td>
                <td>{t.badge}</td>
                <td>{done[j.id] ? '✓' : <PhotoButton photos={inp.photos(j.id)} onChange={p => inp.setPhotos(j.id, p)} disabled={readOnly} />}</td>
                <td>{done[j.id] ? <span className="badge b-green">{done[j.id]}</span> : (
                  <button className="btn btn-primary" disabled={!canConfirm || readOnly || busy !== null} title={!t.ready ? 'รอ DC/VD จัดรถเข้ารับก่อน' : !hasPhoto ? 'ต้องถ่ายภาพก่อน' : undefined} onClick={() => onConfirm(j)}>สแกนยืนยันส่งมอบ</button>
                )}</td>
              </tr>
            )
          })}</tbody>
        </table></div>
      )}
    </div>
  )
}
