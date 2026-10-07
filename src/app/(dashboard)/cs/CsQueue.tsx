'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TabBar, SlaCell, JobIdCell, EmptyCard } from '@/components/ui/Queue'
import StageBadge from '@/components/ui/StageBadge'
import JobDetailModal from '@/components/jobs/JobDetail'
import PaymentModal from '@/components/jobs/PaymentModal'
import { useSort, Th } from '@/components/ui/Sortable'
import { useQueue } from '@/components/ui/useQueue'
import { useToast } from '@/components/ui/Toast'
import { fmtBaht, fmtPhone, CHANNEL_LABELS } from '@/lib/constants'
import type { JobView } from '@/lib/job-view'

const TABS = [
  { key: 'pickup', label: 'พร้อมรับที่สาขา' },
  { key: 'approval', label: 'รอลูกค้าอนุมัติ' },
  { key: 'opened', label: 'เปิดวันนี้ / รอชำระ' },
]
const SORT = {
  id: (j: JobView) => j.jobNo, customer: (j: JobView) => j.customerName ?? '', product: (j: JobView) => j.productName,
  hours: (j: JobView) => j.sla?.hoursInStep ?? 0, balance: (j: JobView) => j.money?.balance ?? 0, total: (j: JobView) => Number(j.quote?.total ?? 0),
}

export default function CsQueue({ role }: { role: string }) {
  const router = useRouter()
  const [tab, setTab] = useState('pickup')
  const [branchFilter, setBranchFilter] = useState('')
  const [siteOptions, setSiteOptions] = useState<Array<{ id: string; name: string }>>([])
  const { data, loading, reload, run, busy } = useQueue('CS', undefined, branchFilter ? { branchId: branchFilter } : undefined)
  const [sel, setSel] = useState<JobView | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [pay, setPay] = useState<{ job: JobView; kind: 'intake' | 'repair'; amount: number } | null>(null)
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
  const s1 = useSort(list('pickup'), SORT)
  const s2 = useSort(list('approval'), SORT)
  const s3 = useSort(list('opened'), SORT)

  return (
    <div className="page-wide" style={{ maxWidth: 1280 }}>
      <div className="toprow">
        <div>
          <p className="page-title">คิวงาน CS</p>
          <p className="page-sub">ส่งมอบสินค้าให้ลูกค้า · ติดตามการอนุมัติใบเสนอราคา · รับชำระค่าดำเนินการ</p>
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

      <div style={{ display: 'grid', gridTemplateColumns: current ? 'minmax(0,1fr) 380px' : '1fr', gap: 16, alignItems: 'start' }}>
        <div>
          {loading && <EmptyCard text="กำลังโหลด…" />}
          {!loading && tab === 'pickup' && (list('pickup').length === 0 ? <EmptyCard text="ไม่มีงานพร้อมรับที่สาขา" /> : (
            <div className="tcard"><div className="tbl-wrap"><table className="tbl">
              <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s1} /><Th k="customer" label="ลูกค้า" {...s1} /><Th k="product" label="สินค้า" {...s1} /><th>ผลการซ่อม</th><Th k="balance" label="ยอดค้างชำระ" {...s1} /><Th k="hours" label="รอลูกค้ามาแล้ว" {...s1} /></tr></thead>
              <tbody>{s1.sorted.map(j => (
                <tr key={j.id} className={`clickable ${sel?.id === j.id ? 'highlight' : ''}`} onClick={() => setSel(j)}>
                  <td><JobIdCell job={j} showDate /></td>
                  <td>{j.customerName}<div className="sub-mute">{fmtPhone(j.customerPhone)}</div></td>
                  <td>{j.productName}<div className="sub-mute">{j.brandName}</div></td>
                  <td>{j.decision === 'REJECTED' ? <span className="badge b-coral">ไม่อนุมัติซ่อม</span> : <span className="badge b-green">ซ่อมเสร็จ</span>}</td>
                  <td style={{ fontWeight: 600, color: (j.money?.balance ?? 0) > 0 && j.decision !== 'REJECTED' ? 'var(--red-dark)' : 'var(--green)' }}>{j.decision === 'REJECTED' ? '-' : (j.money?.balance ?? 0) > 0 ? fmtBaht(j.money!.balance) : 'ชำระครบ'}</td>
                  <td><SlaCell job={j} /></td>
                </tr>
              ))}</tbody>
            </table></div></div>
          ))}

          {!loading && tab === 'approval' && (list('approval').length === 0 ? <EmptyCard text="ไม่มีงานรอลูกค้าอนุมัติ" /> : (
            <div className="tcard"><div className="tbl-wrap"><table className="tbl">
              <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s2} /><Th k="customer" label="ลูกค้า" {...s2} /><Th k="product" label="สินค้า" {...s2} /><Th k="total" label="ยอดเสนอราคา" {...s2} /><Th k="hours" label="รอมาแล้ว" {...s2} /></tr></thead>
              <tbody>{s2.sorted.map(j => {
                const expired = j.quote?.expiresAt && new Date(j.quote.expiresAt) < new Date()
                return (
                  <tr key={j.id} className={`clickable ${sel?.id === j.id ? 'highlight' : ''}`} onClick={() => setSel(j)}>
                    <td><JobIdCell job={j} /></td>
                    <td>{j.customerName}<div className="sub-mute">{fmtPhone(j.customerPhone)}</div></td>
                    <td>{j.productName}<div className="sub-mute">{j.vendor?.name}</div></td>
                    <td>{fmtBaht(Number(j.quote?.total ?? 0))}{expired && <div><span className="badge b-red">ใบเสนอราคาหมดอายุ — โทรติดตาม</span></div>}</td>
                    <td><SlaCell job={j} /></td>
                  </tr>
                )
              })}</tbody>
            </table></div></div>
          ))}

          {!loading && tab === 'opened' && (list('opened').length === 0 ? <EmptyCard text="ยังไม่มีงานที่เปิดวันนี้" /> : (
            <div className="tcard"><div className="tbl-wrap"><table className="tbl">
              <thead><tr><Th k="id" label="เลขที่ใบแจ้งซ่อม" {...s3} /><Th k="customer" label="ลูกค้า" {...s3} /><Th k="product" label="สินค้า" {...s3} /><th>ช่องทาง</th><th>สถานะ</th><th>ค่าดำเนินการ</th></tr></thead>
              <tbody>{s3.sorted.map(j => (
                <tr key={j.id}>
                  <td><JobIdCell job={j} onOpen={() => setOpenId(j.id)} showDate /></td>
                  <td>{j.customerName}<div className="sub-mute">{fmtPhone(j.customerPhone)}</div></td>
                  <td>{j.productName}<div className="sub-mute">{j.brandName}</div></td>
                  <td>{j.channel ? CHANNEL_LABELS[j.channel] : '-'}</td>
                  <td><StageBadge stage={j.stage} intakeUnpaid={j.intakeUnpaid} /></td>
                  <td>{j.money && j.money.intakeBalance > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                      <span className="badge b-amber">ค้างชำระ {fmtBaht(j.money.intakeBalance)}</span>
                      <button className="btn btn-primary" disabled={readOnly} onClick={() => setPay({ job: j, kind: 'intake', amount: j.money!.intakeBalance })}>รับชำระ</button>
                    </div>
                  ) : <span className="badge b-green">{(j.money?.intakeCharges ?? 0) > 0 ? 'ชำระเงินสำเร็จ' : 'ไม่มีค่าใช้จ่าย'}</span>}</td>
                </tr>
              ))}</tbody>
            </table></div></div>
          ))}
        </div>

        {current && (
          <div className="pcard" style={{ position: 'sticky', top: 0 }}>
            <button className="close-btn" style={{ position: 'static', float: 'right' }} onClick={() => setSel(null)}>✕</button>
            <p className="sub-mute" style={{ margin: 0 }}>เลขที่ใบแจ้งซ่อม</p>
            <h3 style={{ fontSize: 17, margin: '2px 0 8px' }}>{current.jobNo}</h3>
            <div className="info-row"><span className="info-label">ลูกค้า</span><span>{current.customerName} · {fmtPhone(current.customerPhone)}</span></div>
            <div className="info-row"><span className="info-label">สินค้า</span><span>{current.productName} ({current.brandName})</span></div>
            {tab === 'pickup' && <PickupPanel job={current} readOnly={readOnly} busy={busy} onPay={() => setPay({ job: current, kind: 'repair', amount: current.money?.balance ?? 0 })}
              onClose={async (opt) => { const r = await run(current, 'cs_close', { pickupOption: opt }, 'ปิดงานแล้ว'); if (r) setSel(null) }}
              onTradein={() => router.push(`/tradein?type=2&jobId=${current.id}`)} onDetail={() => setOpenId(current.id)} />}
            {tab === 'approval' && <ApprovalPanel job={current} readOnly={readOnly} busy={busy} onDetail={() => setOpenId(current.id)}
              onRecord={async (decision, reason) => { const r = await run(current, 'cs_record_decision', { decision, reason, note: reason }, decision === 'approve' ? 'บันทึก: ลูกค้าอนุมัติ' : 'บันทึก: ลูกค้าไม่อนุมัติ'); if (r) setSel(null) }} />}
          </div>
        )}
      </div>

      <PaymentModal job={pay?.job ?? null} kind={pay?.kind ?? 'repair'} amount={pay?.amount ?? 0} onClose={() => setPay(null)} onPaid={() => { setPay(null); reload() }} />
      <JobDetailModal jobId={openId} role={role} onClose={() => setOpenId(null)} onChanged={() => reload()} />
    </div>
  )
}

function PickupPanel({ job, readOnly, busy, onPay, onClose, onTradein, onDetail }: {
  job: JobView; readOnly: boolean; busy: string | null; onPay: () => void; onClose: (opt: 'REPAIRED' | 'TRADEIN' | 'RETURN_ONLY') => void; onTradein: () => void; onDetail: () => void
}) {
  const [choice, setChoice] = useState<'TRADEIN' | 'RETURN_ONLY' | null>(null)
  const m = job.money
  const { confirm } = useToast()
  if (!m) return null
  if (job.decision !== 'REJECTED') {
    const approved = job.decision === 'APPROVED' || job.decision === 'AUTO_APPROVED'
    return (
      <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <p style={{ fontWeight: 600, fontSize: 13.5, margin: '0 0 6px' }}>{approved ? 'ลูกค้าอนุมัติซ่อม — VD ส่งคืนแล้ว' : 'งานซ่อมเสร็จ (อนุมัติอัตโนมัติ/ในประกัน)'}</p>
        {m.credit !== 0 && <div className="summary-row"><span>ค่าดำเนินการ (หักเป็นส่วนลด)</span><span>{fmtBaht(m.credit)}</span></div>}
        <div className="summary-row"><span>ค่าซ่อม (ตามใบเสนอราคา VD)</span><span>{fmtBaht(m.repair)}</span></div>
        {m.operationFee > 0 && <div className="summary-row"><span>ค่าดำเนินการ{m.intakePaid >= m.intakeCharges ? ' (ชำระแล้ว)' : ''}</span><span>{fmtBaht(m.operationFee)}</span></div>}
        {m.shippingFee > 0 && <div className="summary-row"><span>ค่าขนส่ง 3PL{m.intakePaid >= m.intakeCharges ? ' (ชำระแล้ว)' : ''}</span><span>{fmtBaht(m.shippingFee)}</span></div>}
        <div className="summary-row"><span>ชำระแล้วทั้งหมด</span><span>-{fmtBaht(m.totalPaid)}</span></div>
        <div className="summary-row total"><span>ยอดสุทธิที่ลูกค้าต้องชำระ</span><span>{fmtBaht(Math.max(0, m.balance))}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 13 }}>สถานะการชำระเงิน</span>
          {m.balance > 0 ? <span className="badge b-amber">ค้างชำระ {fmtBaht(m.balance)}</span> : <span className="badge b-green">ชำระเงินสำเร็จ</span>}
        </div>
        <button className="link-btn" style={{ marginTop: 10 }} onClick={onDetail}>↗ ดูใบเสนอราคาฉบับเต็มจาก VD</button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {m.balance > 0 && <button className="btn btn-outline btn-lg" disabled={readOnly} onClick={onPay}>รับชำระ {fmtBaht(m.balance)}</button>}
          <button className="btn btn-primary btn-lg" disabled={readOnly || m.balance > 0 || busy !== null} title={m.balance > 0 ? 'ต้องชำระยอดค้างให้ครบก่อนปิดงาน' : undefined}
            onClick={async () => { if (await confirm({ message: `ยืนยันลูกค้ารับสินค้า ${job.jobNo} และปิดงาน?` })) onClose('REPAIRED') }}>ลูกค้ารับสินค้าแล้ว — ปิดงาน</button>
        </div>
      </div>
    )
  }
  return (
    <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
      <p style={{ fontWeight: 600, fontSize: 13.5, margin: '0 0 6px' }}>ลูกค้าไม่อนุมัติซ่อม</p>
      <div className="summary-row"><span>ค่าใช้จ่ายที่ลูกค้าจะไม่ได้รับคืน</span><span>{fmtBaht(m.intakePaid)}</span></div>
      <div className="note">{m.intakePaid > 0
        ? `ค่าดำเนินการ ${fmtBaht(m.operationFee)}${m.shippingFee ? ` + ค่าขนส่ง 3PL ${fmtBaht(m.shippingFee)}` : ''} ที่ชำระตอนเปิดงาน ไม่สามารถคืนได้`
        : 'กรณีนี้ไม่มีค่าใช้จ่ายที่เรียกเก็บไปตอนเปิดงาน (มีประกัน + ส่งแบบมาตรฐาน)'}</div>
      <p style={{ fontSize: 13, margin: '10px 0 0' }}>ต้องการ Trade-in เพื่อรับส่วนลดซื้อสินค้าใหม่ หรือรับสินค้ากลับอย่างเดียว?</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
        <button className={`btn btn-outline ${choice === 'TRADEIN' ? 'active' : ''}`} disabled={readOnly} onClick={() => { setChoice('TRADEIN'); onTradein() }}>ต้องการ Trade-in ↗ ไปหน้า Gen คูปอง</button>
        <button className={`btn ${choice === 'RETURN_ONLY' ? 'btn-outline' : ''}`} disabled={readOnly} onClick={() => setChoice('RETURN_ONLY')}>รับสินค้ากลับอย่างเดียว</button>
        {choice && <div className="note">{choice === 'RETURN_ONLY' ? 'ลูกค้าเลือกรับสินค้ากลับอย่างเดียว' : 'ออกคูปอง Trade-in แล้ว (ถ้ายังไม่ได้ออก ให้กดปุ่มด้านบน)'}</div>}
        {choice && <button className="btn btn-primary btn-lg" disabled={readOnly || busy !== null} onClick={() => onClose(choice)}>ลูกค้ารับสินค้าแล้ว — ปิดงาน</button>}
      </div>
    </div>
  )
}

function ApprovalPanel({ job, readOnly, busy, onRecord, onDetail }: { job: JobView; readOnly: boolean; busy: string | null; onRecord: (d: 'approve' | 'reject', reason: string) => void; onDetail: () => void }) {
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null)
  const [reason, setReason] = useState('ลูกค้าแจ้งทางโทรศัพท์')
  const expired = useMemo(() => job.quote?.expiresAt && new Date(job.quote.expiresAt) < new Date(), [job])
  return (
    <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
      <div className="summary-row"><span>ใบเสนอราคา</span><span>{job.quote?.quoteNo}</span></div>
      <div className="summary-row total"><span>ยอดเสนอราคา (รวม VAT)</span><span>{fmtBaht(Number(job.quote?.total ?? 0))}</span></div>
      {expired && <div className="note amber">ลิงก์ใบเสนอราคาหมดอายุแล้ว — โทรติดตามลูกค้าและบันทึกผลแทนได้</div>}
      <button className="link-btn" style={{ marginTop: 8 }} onClick={onDetail}>↗ ดูใบเสนอราคาฉบับเต็ม</button>
      <p style={{ fontSize: 13, fontWeight: 500, margin: '12px 0 6px' }}>บันทึกผลแทนลูกค้า</p>
      <div className="radio-row">
        <button className={`radio-opt ${decision === 'approve' ? 'checked' : ''}`} onClick={() => setDecision('approve')}>✓ ลูกค้าอนุมัติซ่อม</button>
        <button className={`radio-opt ${decision === 'reject' ? 'checked' : ''}`} onClick={() => setDecision('reject')}>✕ ไม่อนุมัติ</button>
      </div>
      <div className="field" style={{ marginTop: 10 }}><label>เหตุผล / ช่องทางที่ลูกค้าแจ้ง</label><input className="inp" value={reason} onChange={e => setReason(e.target.value)} /></div>
      <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 12 }} disabled={!decision || !reason.trim() || readOnly || busy !== null} onClick={() => decision && onRecord(decision, reason)}>บันทึกผล</button>
    </div>
  )
}
