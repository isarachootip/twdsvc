'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/ui/Modal'
import StageBadge from '@/components/ui/StageBadge'
import { useToast } from '@/components/ui/Toast'
import QuoteDoc from './QuoteDoc'
import { api, absUrl } from '@/lib/client'
import { CHANNEL_LABELS, OWNER_LABELS, fmtBaht, fmtDate, fmtDateTime, fmtPhone } from '@/lib/constants'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Detail = any

const DOT: Record<string, string> = { done: 'dot-green', done_late: 'dot-green', running: 'dot-amber', paused: 'dot-amber', overdue: 'dot-red', pending: 'dot-gray' }
const PAY_METHOD: Record<string, string> = { PROMPTPAY_QR: 'QR Payment', CARD_LINK: 'Link ตัดบัตรเครดิต', POS_RECEIPT: 'เลขที่ใบเสร็จ POS', CASH: 'เงินสด' }

export function useJobDetail() {
  const [jobId, setJobId] = useState<string | null>(null)
  return { jobId, open: setJobId, close: () => setJobId(null) }
}

export default function JobDetailModal({
  jobId,
  onClose,
  role,
  onChanged,
  standalone = false,
}: {
  jobId: string | null
  onClose?: () => void
  role: string
  onChanged?: () => void
  standalone?: boolean
}) {
  const [d, setD] = useState<Detail | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [showQuote, setShowQuote] = useState(false)
  const [assign, setAssign] = useState<{ centers: any[]; centerId: string; channel: string } | null>(null)
  const { toast, prompt } = useToast()

  const load = useCallback(async () => {
    if (!jobId) return
    setErr(null)
    try {
      setD(await api(`/api/jobs/${jobId}`))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ')
    }
  }, [jobId])

  useEffect(() => { setD(null); setShowQuote(false); setAssign(null); load() }, [load])

  if (!jobId) return null

  const quote = d?.quotes?.find((q: any) => q.status !== 'SUPERSEDED') ?? d?.quotes?.[0]
  const doAction = async (action: string, body: Record<string, unknown>) => {
    try {
      await api(`/api/jobs/${jobId}/action`, { body: { action, version: d?.version, ...body } })
      toast('บันทึกแล้ว ✓', 'success')
      await load()
      onChanged?.()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด', 'error')
    }
  }

  const openAssign = async () => {
    const centers = await api<any[]>('/api/vendor-centers')
    setAssign({ centers, centerId: d?.vendor?.centerId ?? d?.vendorCenterId ?? centers[0]?.id ?? '', channel: d?.channel && d.channel !== 'TPL' ? d.channel : 'DC' })
  }

  const cancelJob = async () => {
    const reason = await prompt({ title: 'ยกเลิกงาน', message: `ยืนยันยกเลิกงาน ${d.jobNo}?`, okText: 'ยกเลิกงาน', input: { label: 'เหตุผลการยกเลิก', required: true } })
    if (reason) doAction('cancel', { reason })
  }

  const info = d?.detail ?? {}
  const m = d?.money
  const closed = d && ['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED', 'CANCELLED'].includes(d.stage)

  // Timeline fallback if d.timeline is not present
  const timeline = d?.timeline ?? (d?.slaClocks ? d.slaClocks.map((c: any) => ({
    code: c.slaStep?.code ?? 'STEP',
    name: c.slaStep?.name ?? 'ขั้นตอน',
    owner: c.slaStep?.ownerDept ?? 'CS',
    slaHours: c.slaStep?.hours ?? 24,
    status: c.breached ? 'overdue' : (c.status === 'STOPPED' ? 'done' : (c.status === 'PAUSED' ? 'paused' : 'running')),
    hours: Math.floor((new Date().getTime() - new Date(c.startedAt).getTime()) / 3600000),
    doneAt: c.stoppedAt,
    doneBy: null,
  })) : [])

  const events = d?.events ?? []

  const content = (
    <>
      {!d && !err && <div className="empty">กำลังโหลด…</div>}
      {err && <div className="empty" style={{ color: 'var(--red-dark)' }}>{err}</div>}
      {d && (
        <>
          {standalone && (
            <div className="mb-4 flex items-center justify-between">
              <Link href="/jobs" className="btn">← กลับไปหน้ารวมงานซ่อม</Link>
            </div>
          )}
          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>เลขที่ใบแจ้งซ่อม</p>
          <h2 style={{ margin: '2px 0 0', fontSize: 20, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className={d.overdue ? 'jobid-over' : ''}>{d.jobNo}</span>
            <StageBadge stage={d.stage} />
            {d.type === 'STOCK' && <span className="badge b-gray">งานสต็อกสาขา</span>}
            {d.overdue && <span className="badge b-red">เกิน SLA ({OWNER_LABELS[d.overdueOwner] ?? d.overdueOwner})</span>}
          </h2>

          <div className="detail-cols">
            <div>
              <h3 style={{ fontSize: 14, margin: '0 0 8px' }}>อัปเดตสถานะแต่ละขั้นตอน</h3>
              {timeline.map((s: any) => (
                <div className="step-item" key={s.code}>
                  <div className={`step-dot ${DOT[s.status] ?? 'dot-gray'}`} />
                  <div>
                    <div className="step-title">{s.name} <span className="sub-mute">({OWNER_LABELS[s.owner] ?? s.owner})</span></div>
                    <div className="step-meta">
                      {s.status === 'pending' && 'รอดำเนินการ'}
                      {s.status === 'running' && `กำลังดำเนินการ — ${s.hours} ชม. จาก SLA ${s.slaHours} ชม.`}
                      {s.status === 'paused' && `หยุดนับเวลา (รออะไหล่) — ใช้ไป ${s.hours} ชม. จาก SLA ${s.slaHours} ชม.`}
                      {s.status === 'overdue' && <span style={{ color: 'var(--red-dark)' }}>เกิน SLA — ค้างมา ${s.hours} ชม. (SLA ${s.slaHours} ชม.)</span>}
                      {(s.status === 'done' || s.status === 'done_late') && (
                        <>เสร็จแล้ว {fmtDateTime(s.doneAt)} ({s.hours} ชม.{s.status === 'done_late' ? <span style={{ color: 'var(--red-dark)' }}> — เกิน SLA</span> : ''}){s.doneBy ? ` — ผู้ทำ: ${s.doneBy}` : ''}</>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <h3 style={{ fontSize: 14, margin: '18px 0 8px' }}>ประวัติการดำเนินการ</h3>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {events.map((e: any) => (
                  <div className="step-item" key={e.id}>
                    <div className="step-dot dot-gray" />
                    <div style={{ flex: 1 }}>
                      <div className="step-title" style={{ fontSize: 13 }}>{e.label ?? e.type}</div>
                      <div className="step-meta">{fmtDateTime(e.createdAt)} — {e.actor ?? e.actorRole ?? '-'}{e.location ? ` · Location ${e.location}` : ''}</div>
                      {e.note && <div className="step-meta">{e.note}</div>}
                      {e.attachments && e.attachments.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                          {e.attachments.map((a: any) => (
                            <a key={a.id} href={a.fileUrl} target="_blank" rel="noreferrer">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={a.fileUrl} alt={a.kind} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 14, margin: '0 0 8px' }}>รายละเอียดใบแจ้งซ่อม</h3>
              {d.type === 'CUSTOMER' ? (
                <>
                  <Row l="ลูกค้า" v={d.customerName ?? '-'} />
                  <Row l="เบอร์โทร" v={d.customerPhone ? (d.customerPhone.includes('x') ? d.customerPhone : fmtPhone(d.customerPhone)) : '-'} />
                  {info.customerAddress !== null && info.customerAddress !== undefined && <Row l="ที่อยู่" v={[info.customerAddress, info.customerZip].filter(Boolean).join(' ') || '-'} />}
                  {info.taxInvoice && <Row l="ออกใบกำกับภาษีในนาม" v={`${info.taxInvoice.name} (${info.taxInvoice.id ?? '-'})`} />}
                </>
              ) : (
                <>
                  <Row l="ประเภท" v="งานสต็อกสาขา (S2)" />
                  <Row l="ผู้รับเรื่องที่ VD" v={d.receiverName ?? '-'} />
                  {d.items?.map((it: any) => <Row key={it.id} l={`${it.sku ?? '-'} × ${it.quantity}`} v={`${it.productName}${it.holdStockNo ? ` (Hold ${it.holdStockNo})` : ''}`} />)}
                </>
              )}
              <Row l="SKU" v={d.sku ?? '-'} />
              <Row l="สินค้า" v={d.productName} />
              <Row l="แบรนด์" v={d.brandName} />
              <Row l="อาการเสีย" v={d.symptom ?? '-'} />
              {info.defectNote && <Row l="ตำหนิ" v={info.defectNote} />}
              {d.type === 'CUSTOMER' && <Row l="สถานะประกัน" v={d.hasWarranty ? 'มีประกัน' : 'ไม่มีประกัน'} />}
              {info.sizeName && <Row l="ขนาดสินค้า" v={info.sizeName} />}
              <Row l="วิธีจัดส่ง" v={d.shippingMethod === 'EXPRESS' ? 'ส่งด่วน (3PL)' : `มาตรฐาน (${d.channel ? CHANNEL_LABELS[d.channel] : '-'})`} />
              <Row l="สาขา" v={d.branch?.name ?? '-'} />
              <Row l="วันที่เปิดใบแจ้งซ่อม" v={fmtDate(d.openedAt)} />
              <Row l="สถานะปัจจุบัน" v={<StageBadge stage={d.stage} />} />
              <Row l="ศูนย์ซ่อม" v={d.vendor ? `${d.vendor.name} (${d.vendor.centerCode}) · ช่องทาง ${d.channel ? CHANNEL_LABELS[d.channel] : '-'}` : (d.vendorCenter ? `${d.vendorCenter.vendorParent?.name} (${d.vendorCenter.code})` : 'ยังไม่ได้กำหนด')} />
              {d.location && <Row l="Location ปัจจุบัน" v={d.location} />}
              {m && d.type === 'CUSTOMER' && (
                <>
                  <Row l="ค่าดำเนินการ" v={fmtBaht(m.operationFee)} />
                  <Row l="ค่าขนส่ง" v={fmtBaht(m.shippingFee)} />
                  <Row l="รวมค่าใช้จ่ายวันเปิดงาน" v={<b>{fmtBaht(m.intakeCharges)}</b>} />
                  <Row l="วิธีชำระเงิน" v={PAY_METHOD[info.paymentMethod] ?? '-'} />
                  {m.repair > 0 && <Row l="ค่าซ่อม (ตามใบเสนอราคา)" v={fmtBaht(m.repair)} />}
                  {m.credit !== 0 && <Row l="ค่าดำเนินการ (หักเป็นส่วนลด)" v={fmtBaht(m.credit)} />}
                  <Row l="ชำระแล้ว" v={fmtBaht(m.totalPaid)} />
                  <Row l="ยอดค้างชำระ" v={<b style={{ color: m.balance > 0 ? 'var(--red-dark)' : 'var(--green)' }}>{m.balance > 0 ? fmtBaht(m.balance) : 'ไม่มี'}</b>} />
                </>
              )}
              {d.type === 'CUSTOMER' && (quote ? (
                <button className="btn" style={{ marginTop: 12, width: '100%' }} onClick={() => setShowQuote(true)}>↗ ดูใบเสนอราคาจาก VD ({quote.quoteNo})</button>
              ) : (
                <div className="info-row" style={{ marginTop: 8 }}><span className="info-label">ใบเสนอราคา</span><span>ยังไม่ถึงขั้นตอนเสนอราคา</span></div>
              ))}

              {d.links && Object.keys(d.links).length > 0 && (
                <div className="note" style={{ marginTop: 12 }}>
                  <b>ลิงก์ลูกค้า</b>
                  {Object.entries(d.links).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 4 }}>
                      <span>{({ TRACKING: 'ติดตามสถานะ', QUOTE: 'ใบเสนอราคา', PAYMENT: 'ชำระเงิน', DRIVER: 'คนรถ', CSAT: 'แบบประเมิน' } as Record<string, string>)[k] ?? k}</span>
                      <button className="link-btn" onClick={() => { navigator.clipboard?.writeText(absUrl(String(v))); toast('คัดลอกลิงก์แล้ว', 'success') }}>คัดลอก</button>
                    </div>
                  ))}
                </div>
              )}

              {role === 'ADMIN' && !closed && (
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  {['PENDING_VENDOR_ASSIGNMENT', 'CS_OPENED', 'GR_RECEIVED'].includes(d.stage) && d.type === 'CUSTOMER' && (
                    <button className="btn btn-primary" onClick={openAssign}>{d.vendor || d.vendorCenter ? 'เปลี่ยนศูนย์ซ่อม (VD)' : 'กำหนดศูนย์ซ่อม (VD)'}</button>
                  )}
                  <button className="btn" style={{ color: 'var(--red-dark)' }} onClick={cancelJob}>ยกเลิกงาน</button>
                </div>
              )}
              {role === 'CS' && ['CS_OPENED', 'PENDING_VENDOR_ASSIGNMENT'].includes(d.stage) && (
                <div style={{ marginTop: 14 }}><button className="btn" style={{ color: 'var(--red-dark)' }} onClick={cancelJob}>ยกเลิกงาน</button></div>
              )}
              {assign && (
                <div className="pcard" style={{ marginTop: 12, marginBottom: 0 }}>
                  <div className="field"><label>ศูนย์ซ่อม</label>
                    <select className="sel" value={assign.centerId} onChange={e => setAssign({ ...assign, centerId: e.target.value })}>
                      {assign.centers.map((c: any) => <option key={c.id} value={c.id}>{c.code} — {c.vendorParent.name} ({c.deliveryMethod === 'DC_DSD' ? 'DC + DSD' : c.deliveryMethod})</option>)}
                    </select>
                  </div>
                  {d.shippingMethod !== 'EXPRESS' && (
                    <div className="field" style={{ marginTop: 8 }}><label>ช่องทาง</label>
                      <div className="radio-row">
                        {['DC', 'DSD'].map(ch => <button key={ch} type="button" className={`radio-opt ${assign.channel === ch ? 'checked' : ''}`} onClick={() => setAssign({ ...assign, channel: ch })}>{ch}</button>)}
                      </div>
                    </div>
                  )}
                  <div className="modal-actions">
                    <button className="btn" onClick={() => setAssign(null)}>ยกเลิก</button>
                    <button className="btn btn-primary" onClick={async () => { await doAction('assign_vendor', { vendorCenterId: assign.centerId, channel: d.shippingMethod === 'EXPRESS' ? 'TPL' : assign.channel }); setAssign(null) }}>บันทึก</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Modal open={showQuote && !!quote} onClose={() => setShowQuote(false)} zIndex={90}>
            {quote && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 16 }}>ใบเสนอราคาซ่อม</h3>
                  <span className="badge b-blue" style={{ marginRight: 28 }}>{d.vendor?.code ?? d.vendorCenter?.code}</span>
                </div>
                <QuoteDoc q={{
                  quoteNo: quote.quoteNo, jobNo: d.jobNo, customer: d.customerName, product: d.productName,
                  branchName: d.branch?.name, branchAddress: d.branch?.address, vendorLabel: d.vendor ? `${d.vendor.name} (${d.vendor.centerCode})` : (d.vendorCenter ? `${d.vendorCenter.vendorParent?.name} (${d.vendorCenter.code})` : null),
                  lines: quote.lines.map((l: any) => ({ description: l.description, amount: l.unitPrice * l.quantity, partWaitDays: l.partWaitDays, partWarrantyDays: l.partWarrantyDays })),
                  subtotal: quote.subtotal, vatAmount: quote.vatAmount, total: quote.total, repairDays: quote.repairDays, repairWarrantyDays: quote.repairWarrantyDays, vendorNote: quote.vendorNote,
                }} />
                <p className="sub-mute" style={{ marginTop: 8 }}>สถานะ: {({ SENT: 'รอลูกค้าตัดสินใจ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ไม่อนุมัติ', SUPERSEDED: 'ถูกแทนที่ด้วยฉบับใหม่', EXPIRED: 'หมดอายุ' } as Record<string, string>)[quote.status] ?? quote.status}</p>
                <div className="modal-actions no-print">
                  <button className="btn" onClick={() => setShowQuote(false)}>ปิดหน้าต่างนี้</button>
                  <button className="btn btn-primary" onClick={() => window.print()}>พิมพ์</button>
                </div>
              </>
            )}
          </Modal>
        </>
      )}
    </>
  )

  if (standalone) {
    return <div className="pcard max-w-6xl mx-auto my-4">{content}</div>
  }

  return (
    <Modal open onClose={onClose ?? (() => {})} size="wide">
      {content}
    </Modal>
  )
}

function Row({ l, v }: { l: string; v: React.ReactNode }) {
  return <div className="info-row"><span className="info-label">{l}</span><span style={{ textAlign: 'right', maxWidth: '62%' }}>{v}</span></div>
}
