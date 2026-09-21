'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Modal from '@/components/ui/Modal'
import QuoteDoc from '@/components/jobs/QuoteDoc'
import LonPreview from '@/components/jobs/LonPreview'
import { useToast } from '@/components/ui/Toast'
import { useMe } from '@/components/ui/useMe'
import { api } from '@/lib/client'
import { fmtBaht } from '@/lib/constants'

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Line { key: number; type: 'PART' | 'LABOR' | 'OTHER'; description: string; unitPrice: string; partWaitDays: string; partWarrantyDays: string }

let seq = 1
const blank = (type: Line['type'] = 'PART'): Line => ({ key: seq++, type, description: '', unitPrice: '', partWaitDays: '', partWarrantyDays: '' })

export default function QuoteForm({ jobId, role }: { jobId: string; role: string }) {
  const router = useRouter()
  const sp = useSearchParams()
  const revise = sp.get('revise') === '1'
  const me = useMe()
  const { toast } = useToast()
  const [job, setJob] = useState<any>(null)
  const [lines, setLines] = useState<Line[]>([blank()])
  const [repairDays, setRepairDays] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<any>(null)
  const [lon, setLon] = useState(false)
  const vat = 0.07

  useEffect(() => {
    api<any>(`/api/jobs/${jobId}`).then(d => {
      setJob(d)
      const q = d.quotes?.find((x: any) => x.status === 'SENT') ?? d.quotes?.[0]
      if (revise && q) {
        const ls = q.lines.filter((l: any) => l.type !== 'INSPECTION_FEE').map((l: any) => ({ key: seq++, type: l.type, description: l.description, unitPrice: String(l.unitPrice * l.quantity), partWaitDays: l.partWaitDays ? String(l.partWaitDays) : '', partWarrantyDays: l.partWarrantyDays ? String(l.partWarrantyDays) : '' }))
        setLines(ls.length ? ls : [blank()])
        setRepairDays(String(q.repairDays))
        setNote(q.vendorNote ?? '')
      }
    }).catch(e => toast(e.message, 'error'))
  }, [jobId, revise, toast])

  const openFee = job?.vendor?.inspectionFee ?? (job?.vendorCenter?.vendorParent ? (job.hasWarranty ? job.vendorCenter.vendorParent.inspectionFeeCovered : job.vendorCenter.vendorParent.inspectionFeeNotCovered) : 0)
  const totals = useMemo(() => {
    const parts = lines.reduce((s, l) => s + (Number(l.unitPrice) || 0), 0)
    const subtotal = openFee + parts
    const vatAmt = Math.floor(subtotal * vat + 0.5)
    return { subtotal, vat: vatAmt, total: subtotal + vatAmt }
  }, [lines, openFee])

  const upd = (key: number, patch: Partial<Line>) => setLines(ls => ls.map(l => (l.key === key ? { ...l, ...patch } : l)))

  const submit = async () => {
    if (!(Number(repairDays) >= 1)) { toast('กรุณาระบุระยะเวลาซ่อมโดยประมาณ (วัน)', 'error'); return }
    if (lines.some(l => Number(l.unitPrice) < 0)) { toast('ราคาต้องไม่ติดลบ', 'error'); return }
    setBusy(true)
    try {
      const r = await api<any>(`/api/jobs/${jobId}/action`, {
        body: {
          action: revise ? 'vd_revise_quote' : 'vd_submit_quote',
          version: job.version,
          repairDays: Number(repairDays),
          vendorNote: note,
          lines: lines.filter(l => l.description.trim() || Number(l.unitPrice) > 0).map(l => ({ type: l.type, description: l.description, unitPrice: Number(l.unitPrice) || 0, quantity: 1, partWaitDays: Number(l.partWaitDays) || 0, partWarrantyDays: Number(l.partWarrantyDays) || 0 })),
        },
      })
      const d = await api<any>(`/api/jobs/${jobId}`)
      setJob(d)
      setSent({ ...r.extra, quote: d.quotes?.[0] })
      if (r.extra?.quoteTotal === 0) toast('ยอดรวม ฿0 — อนุมัติอัตโนมัติ งานย้ายไป "กำลังซ่อม"', 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'ส่งใบเสนอราคาไม่สำเร็จ', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (!job) return <div className="empty">กำลังโหลด…</div>
  const readOnly = role !== 'VD' && role !== 'ADMIN'
  const q = sent?.quote

  return (
    <div style={{ margin: '-20px -24px', minHeight: '100%', background: 'var(--bg)' }}>
      <div style={{ position: 'sticky', top: -20, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 5 }}>
        <button className="btn" onClick={() => router.push('/vd')}>← กลับ</button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{revise ? 'แก้ไขใบเสนอราคา' : 'ประเมิน + เสนอราคา'} — {job.jobNo}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--text-mute)' }}>{job.productName} · {job.brandName}{job.symptom ? ` · อาการ: ${job.symptom}` : ''}</p>
        </div>
        <div style={{ width: 70 }} />
      </div>

      <div style={{ maxWidth: 960, margin: '20px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="pcard" style={{ marginBottom: 0 }}>
            <div className="grid2">
              <div className="field"><label>สถานะประกัน (จากข้อมูลเปิดงาน)</label><input className="inp" readOnly value={job.hasWarranty ? 'มีประกัน' : 'ไม่มีประกัน'} /></div>
              <div className="field"><label>ค่าดำเนินการ (ค่าเปิดเครื่องเพื่อทดสอบ) — Auto ตามที่ VD ลงทะเบียนไว้</label><input className="inp" readOnly value={fmtBaht(openFee)} /></div>
            </div>
          </div>

          <div className="pcard" style={{ marginBottom: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 10px' }}>รายการค่าอะไหล่ / ค่าแรง</p>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 24px', gap: 8, fontSize: 11.5, color: 'var(--text-2)' }}>
              <span>รายการ</span><span>ราคา (ก่อน VAT)</span><span>รออะไหล่ (วัน)</span><span>รับประกัน (วัน)</span><span />
            </div>
            {lines.map(l => (
              <div key={l.key} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 24px', gap: 8, marginTop: 6 }}>
                <input className="inp" placeholder={l.type === 'LABOR' ? 'ค่าแรงช่าง' : 'รายการอะไหล่'} value={l.description} onChange={e => upd(l.key, { description: e.target.value })} />
                <input className="inp" type="number" min={0} placeholder="ราคา" value={l.unitPrice} onChange={e => upd(l.key, { unitPrice: e.target.value })} />
                <input className="inp" type="number" min={0} placeholder={l.type === 'LABOR' ? '-' : 'วัน'} disabled={l.type === 'LABOR'} value={l.partWaitDays} onChange={e => upd(l.key, { partWaitDays: e.target.value })} />
                <input className="inp" type="number" min={0} placeholder={l.type === 'LABOR' ? '-' : 'วัน'} disabled={l.type === 'LABOR'} value={l.partWarrantyDays} onChange={e => upd(l.key, { partWarrantyDays: e.target.value })} />
                <button className="remove-btn" onClick={() => setLines(ls => ls.filter(x => x.key !== l.key))}>✕</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn" onClick={() => setLines(ls => [...ls, blank('PART')])}>+ เพิ่มบรรทัดอะไหล่</button>
              <button className="btn" onClick={() => setLines(ls => [...ls, blank('LABOR')])}>+ เพิ่มค่าแรง</button>
            </div>
          </div>

          <div className="pcard" style={{ marginBottom: 0 }}>
            <div className="grid2">
              <div className="field"><label>ระยะเวลาซ่อมรวมโดยประมาณ (วัน) — ช่างกรอก <span style={{ color: 'var(--red)' }}>*</span></label><input className="inp" type="number" min={1} placeholder="เช่น 3" value={repairDays} onChange={e => setRepairDays(e.target.value)} /></div>
              <div className="field"><label>รับประกันงานซ่อม (วัน) — ตามที่ลงทะเบียนไว้</label><input className="inp" readOnly value={job.vendor?.repairWarrantyDays ?? job.vendorCenter?.vendorParent?.repairWarrantyDays ?? '-'} /></div>
            </div>
            <div className="field" style={{ marginTop: 12 }}><label>หมายเหตุถึงลูกค้า</label><textarea className="inp" placeholder="เช่น ตรวจพบสายไฟชำรุดเพิ่มเติม" value={note} onChange={e => setNote(e.target.value)} /></div>
          </div>
        </div>

        <div className="pcard" style={{ position: 'sticky', top: 90 }}>
          <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 12px' }}>สรุปยอด</p>
          <div className="summary-row"><span>รวมก่อน VAT</span><span>{fmtBaht(totals.subtotal)}</span></div>
          <div className="summary-row"><span>VAT 7%</span><span>{fmtBaht(totals.vat)}</span></div>
          <div className="summary-row total" style={{ fontSize: 16 }}><span>รวมทั้งสิ้น</span><span>{fmtBaht(totals.total)}</span></div>
          <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 16 }} disabled={busy || readOnly || !!sent} onClick={submit}>{busy ? 'กำลังส่ง…' : revise ? 'ส่งใบเสนอราคาฉบับแก้ไข' : 'ส่งใบเสนอราคา'}</button>
          {readOnly && <p className="hint" style={{ marginTop: 8 }}>โหมดดูอย่างเดียว</p>}
        </div>
      </div>

      <Modal open={!!sent && !!q} onClose={() => router.push('/vd')}>
        {q && (
          <>
            <QuoteDoc q={{
              quoteNo: q.quoteNo, jobNo: job.jobNo, customer: job.customerName, product: job.productName,
              branchName: job.branch?.name, branchAddress: job.branch?.address,
              lines: q.lines.map((l: any) => ({ description: l.description, amount: l.unitPrice * l.quantity, partWaitDays: l.partWaitDays, partWarrantyDays: l.partWarrantyDays })),
              subtotal: q.subtotal, vatAmount: q.vatAmount, total: q.total, repairDays: q.repairDays, repairWarrantyDays: q.repairWarrantyDays, vendorNote: q.vendorNote,
            }} />
            <div className="modal-actions no-print">
              <button className="btn" onClick={() => window.print()}>พิมพ์</button>
              {q.total > 0 ? (
                <button className="btn btn-primary" onClick={() => setLon(true)}>ส่งให้ลูกค้าทาง LON</button>
              ) : (
                <button className="btn btn-primary" onClick={() => router.push('/vd')}>กลับไปหน้าคิว</button>
              )}
            </div>
          </>
        )}
      </Modal>
      <LonPreview job={lon ? { id: job.id, jobNo: job.jobNo, productName: job.productName } : null} demo={!!me?.demoMode} onClose={() => router.push('/vd')} onDecided={() => router.push('/vd')} />
    </div>
  )
}
