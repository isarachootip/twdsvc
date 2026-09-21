'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import AddressFields, { emptyAddress, formatAddress, type Address } from '@/components/ui/AddressFields'
import { PhotoGrid, type Photo } from '@/components/ui/PhotoButton'
import Modal from '@/components/ui/Modal'
import QrImage from '@/components/ui/QrImage'
import StageBadge from '@/components/ui/StageBadge'
import PaymentModal from '@/components/jobs/PaymentModal'
import { useToast } from '@/components/ui/Toast'
import { api, absUrl } from '@/lib/client'
import { fmtBaht, CHANNEL_LABELS } from '@/lib/constants'

import type { JobStage } from '@prisma/client'

interface Brand { id: number; name: string }
interface Size { id: number; code: string; name: string }
interface Commodity { id: number; sku: string; name: string; brand: string }
interface Saved {
  id: string; jobNo: string; stage: JobStage; fees: { operationFee: number; shippingFee: number; total: number }
  routing: { centerCode: string; vendorCode: string; vendorName: string; channel: string } | null
  trackingUrl?: string; payUrl?: string
}

export default function CsNewForm({ role, branchName }: { role: string; branchName: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [brands, setBrands] = useState<Brand[]>([])
  const [sizes, setSizes] = useState<Size[]>([])

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [addr, setAddr] = useState<Address>(emptyAddress)
  const [taxSame, setTaxSame] = useState(true)
  const [tax, setTax] = useState<{ name: string; id: string; addr: Address } | null>(null)
  const [taxModal, setTaxModal] = useState(false)
  const [taxDraft, setTaxDraft] = useState<{ name: string; id: string; addr: Address }>({ name: '', id: '', addr: emptyAddress })
  const [found, setFound] = useState<{ customerName: string; customerAddress: string | null; customerZip: string | null; jobCount: number } | null>(null)

  const [sku, setSku] = useState('')
  const [skuResults, setSkuResults] = useState<Commodity[]>([])
  const [product, setProduct] = useState('')
  const [brandId, setBrandId] = useState('')
  const [symptom, setSymptom] = useState('')
  const [warranty, setWarranty] = useState<'yes' | 'no'>('yes')
  const [allowOutside, setAllowOutside] = useState(false)
  const [sizeId, setSizeId] = useState<number | null>(null)
  const [method, setMethod] = useState<'STANDARD' | 'EXPRESS'>('STANDARD')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [defect, setDefect] = useState('')

  const [fees, setFees] = useState({ operationFee: 0, shippingFee: 0, total: 0 })
  const [pay, setPay] = useState<'PROMPTPAY_QR' | 'CARD_LINK' | 'POS_RECEIPT'>('PROMPTPAY_QR')
  const [pos, setPos] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<Saved | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [paid, setPaid] = useState(false)
  const [lon, setLon] = useState(false)
  const [printDoc, setPrintDoc] = useState(false)
  const skuTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    api<Brand[]>('/api/brands').then(setBrands).catch(() => {})
    api<Size[]>('/api/size-categories').then(s => { setSizes(s); if (s[0]) setSizeId(s[0].id) }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!sizeId) return
    api<typeof fees>('/api/jobs/preview-fees', { body: { sizeCategoryId: sizeId, hasWarranty: warranty === 'yes', shippingMethod: method } })
      .then(f => setFees({ operationFee: f.operationFee, shippingFee: f.shippingFee, total: f.total })).catch(() => {})
  }, [sizeId, warranty, method])

  // ค้นหาลูกค้าเดิมจากเบอร์
  useEffect(() => {
    const d = phone.replace(/\D/g, '')
    setFound(null)
    if (!/^0\d{8,9}$/.test(d)) return
    const t = setTimeout(() => {
      api<typeof found>(`/api/customers/lookup?phone=${d}`).then(r => setFound(r)).catch(() => {})
    }, 400)
    return () => clearTimeout(t)
  }, [phone])

  const onSku = (v: string) => {
    setSku(v)
    clearTimeout(skuTimer.current)
    if (v.trim().length < 2) { setSkuResults([]); return }
    skuTimer.current = setTimeout(() => api<Commodity[]>(`/api/commodities?search=${encodeURIComponent(v)}`).then(setSkuResults).catch(() => {}), 300)
  }
  const pickSku = (c: Commodity) => {
    setSku(c.sku)
    setProduct(c.name)
    const b = brands.find(x => x.name.toLowerCase() === c.brand.toLowerCase())
    if (b) setBrandId(String(b.id))
    setSkuResults([])
  }

  const onTaxCheckbox = (checked: boolean) => {
    if (checked) { setTaxSame(true); setTax(null); return }
    setTaxDraft(tax ?? { name: name, id: '', addr: emptyAddress })
    setTaxSame(false)
    setTaxModal(true)
  }
  const closeTax = (save: boolean) => {
    if (save) {
      if (!taxDraft.name.trim()) { toast('กรุณากรอกชื่อ/บริษัทสำหรับใบกำกับภาษี', 'error'); return }
      if (!/^\d{13}$/.test(taxDraft.id)) { toast('เลขประจำตัวผู้เสียภาษีต้องมี 13 หลัก', 'error'); return }
      setTax(taxDraft)
    } else if (!tax) {
      setTaxSame(true)
    }
    setTaxModal(false)
  }

  const validate = () => {
    if (!name.trim()) return 'กรุณากรอกชื่อ-นามสกุลลูกค้า'
    if (!/^0\d{8,9}$/.test(phone.replace(/\D/g, ''))) return 'กรุณากรอกเบอร์โทรให้ถูกต้อง (เช่น 0812345678)'
    if (!product.trim()) return 'กรุณากรอกชื่อสินค้า'
    if (!brandId) return 'กรุณาเลือกแบรนด์'
    if (!symptom.trim()) return 'กรุณากรอกอาการเสีย'
    if (!sizeId) return 'กรุณาเลือกขนาดสินค้า'
    if (fees.total > 0 && pay === 'POS_RECEIPT' && !pos.trim()) return 'กรุณากรอกเลขที่ใบเสร็จ POS'
    return null
  }

  const save = useCallback(async (): Promise<Saved | null> => {
    if (saved) return saved
    const err = validate()
    if (err) { toast(err, 'error'); return null }
    setSaving(true)
    try {
      const brand = brands.find(b => String(b.id) === brandId)
      const r = await api<Saved>('/api/jobs', {
        body: {
          customerName: name.trim(), customerPhone: phone, customerAddress: formatAddress(addr) || null, customerZip: addr.zip || null,
          ...(tax && !taxSame ? { taxInvoiceName: tax.name, taxInvoiceId: tax.id, taxInvoiceAddr: formatAddress(tax.addr) } : {}),
          sku: sku.trim() || null, productName: product.trim(), brandId: Number(brandId), brandName: brand?.name ?? '',
          symptom: symptom.trim(), hasWarranty: warranty === 'yes', allowNonAuth: warranty === 'no' && allowOutside,
          sizeCategoryId: sizeId, shippingMethod: method, photos, defectNote: defect.trim() || null,
          paymentMethod: fees.total > 0 ? pay : null, posReceiptNo: pay === 'POS_RECEIPT' ? pos.trim() : null,
        },
      })
      setSaved(r)
      setPaid(fees.total === 0 || pay === 'POS_RECEIPT')
      toast(`บันทึกใบแจ้งซ่อม ${r.jobNo} แล้ว`, 'success')
      return r
    } catch (e) {
      toast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ', 'error')
      return null
    } finally {
      setSaving(false)
    }
  }, [saved, name, phone, addr, tax, taxSame, sku, product, brandId, brands, symptom, warranty, allowOutside, sizeId, method, photos, defect, fees.total, pay, pos, toast]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveAndSend = async () => {
    const r = await save()
    if (!r) return
    if (fees.total > 0 && pay !== 'POS_RECEIPT' && !paid) setPayOpen(true)
    else setLon(true)
  }

  const showPayment = async () => {
    const r = await save()
    if (r) setPayOpen(true)
  }

  const reset = () => { window.location.href = '/cs/new' }
  const readOnly = role !== 'CS'
  const brandName = brands.find(b => String(b.id) === brandId)?.name ?? ''
  const sizeName = sizes.find(s => s.id === sizeId)?.name ?? ''

  return (
    <div className="page-wide" style={{ maxWidth: 1180 }}>
      <div className="toprow" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 18px' }}>
        <div>
          <p className="page-title" style={{ fontSize: 17 }}>เปิดใบแจ้งซ่อม {branchName && <span className="sub-mute" style={{ fontSize: 13 }}>· {branchName}</span>}</p>
          <p className="page-sub">บันทึกข้อมูลลูกค้า สินค้า และรับชำระค่าดำเนินการ ณ วันเปิดงาน</p>
        </div>
        <div style={{ fontSize: 13.5 }}>
          เลขที่ใบแจ้งซ่อม: <b>{saved?.jobNo ?? '— (ออกเลขเมื่อบันทึก)'}</b>{' '}
          {saved && <StageBadge stage={saved.stage} />}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
        <div>
          <fieldset disabled={!!saved || readOnly} style={{ border: 'none', padding: 0, margin: 0 }}>
            <div className="pcard">
              <h3>ข้อมูลลูกค้า</h3>
              <p className="hint">ข้อมูลพื้นฐานลูกค้าและที่อยู่สำหรับติดต่อ/ออกใบกำกับภาษี</p>
              <div className="grid2">
                <div className="field"><label>ชื่อ-นามสกุลลูกค้า <span style={{ color: 'var(--red)' }}>*</span></label><input className="inp" placeholder="ชื่อ นามสกุล" value={name} onChange={e => setName(e.target.value)} /></div>
                <div className="field"><label>เบอร์โทรศัพท์ <span style={{ color: 'var(--red)' }}>*</span></label><input className="inp" inputMode="tel" placeholder="08x-xxx-xxxx" value={phone} onChange={e => setPhone(e.target.value)} /></div>
              </div>
              {found && !saved && (
                <div className="note blue" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span>พบลูกค้าเดิม: <b>{found.customerName}</b> ({found.jobCount} งาน){found.customerAddress ? ` · ${found.customerAddress}` : ''}</span>
                  <button type="button" className="btn" onClick={() => { setName(found.customerName); setAddr(a => ({ ...a, street: found.customerAddress ?? a.street, zip: found.customerZip ?? a.zip })); setFound(null) }}>ใช้ข้อมูลนี้</button>
                </div>
              )}
              <div className="divider" />
              <p className="hint" style={{ marginBottom: 8 }}>ที่อยู่ (กรอกรหัสไปรษณีย์เพื่อดึงข้อมูลอัตโนมัติ หรือเลือกจาก dropdown)</p>
              <AddressFields value={addr} onChange={setAddr} />
              <div className="checkbox-row">
                <input type="checkbox" id="tax-same" checked={taxSame} onChange={e => onTaxCheckbox(e.target.checked)} />
                <label htmlFor="tax-same">ใช้ที่อยู่นี้ในการออกใบกำกับภาษี</label>
              </div>
              {!taxSame && tax && (
                <div className="note">ออกใบกำกับภาษีในนาม: <b>{tax.name}</b> (เลขผู้เสียภาษี {tax.id}) — {formatAddress(tax.addr)}{' '}
                  <button type="button" className="link-btn" onClick={() => { setTaxDraft(tax); setTaxModal(true) }}>แก้ไข</button></div>
              )}
            </div>

            <div className="pcard">
              <h3>ข้อมูลสินค้าและการรับประกัน</h3>
              <div className="grid3" style={{ marginTop: 10 }}>
                <div className="field" style={{ position: 'relative' }}><label>SKU (ถ้ามี)</label>
                  <input className="inp" placeholder="ไม่บังคับ" value={sku} onChange={e => onSku(e.target.value)} onBlur={() => setTimeout(() => setSkuResults([]), 200)} />
                  {skuResults.length > 0 && (
                    <div style={{ position: 'absolute', zIndex: 20, left: 0, right: 0, background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 8, marginTop: 2, maxHeight: 220, overflowY: 'auto' }}>
                      {skuResults.map(c => (
                        <button type="button" key={c.id} onMouseDown={() => pickSku(c)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', fontSize: 12.5, border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                          <b>{c.sku}</b> — {c.name} <span className="sub-mute">{c.brand}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="field"><label>ชื่อสินค้า <span style={{ color: 'var(--red)' }}>*</span></label><input className="inp" placeholder="เช่น สว่านไฟฟ้า" value={product} onChange={e => setProduct(e.target.value)} /></div>
                <div className="field"><label>แบรนด์ <span style={{ color: 'var(--red)' }}>*</span></label>
                  <select className="sel" value={brandId} onChange={e => setBrandId(e.target.value)}>
                    <option value="">เลือกแบรนด์</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="field" style={{ marginTop: 12 }}><label>อาการเสีย <span style={{ color: 'var(--red)' }}>*</span></label><input className="inp" placeholder="อธิบายอาการเสีย" value={symptom} onChange={e => setSymptom(e.target.value)} /></div>

              <div className="divider" />
              <p className="hint" style={{ marginBottom: 6 }}>สถานะการรับประกัน</p>
              <div className="radio-row">
                <button type="button" className={`radio-opt ${warranty === 'yes' ? 'checked' : ''}`} onClick={() => setWarranty('yes')}>มีประกัน</button>
                <button type="button" className={`radio-opt ${warranty === 'no' ? 'checked' : ''}`} onClick={() => setWarranty('no')}>ไม่มีประกัน</button>
              </div>
              {warranty === 'no' && (
                <div className="checkbox-row"><input type="checkbox" id="outside" checked={allowOutside} onChange={e => setAllowOutside(e.target.checked)} /><label htmlFor="outside">ไม่มีประกัน — อนุญาตส่งซ่อมช่างนอกได้</label></div>
              )}

              <p className="hint" style={{ margin: '14px 0 6px' }}>ขนาดสินค้า</p>
              <div className="radio-row">
                {sizes.map(s => <button type="button" key={s.id} className={`radio-opt ${sizeId === s.id ? 'checked' : ''}`} onClick={() => setSizeId(s.id)}>{s.name.startsWith('สินค้า') ? s.name : `สินค้า${s.name}`}</button>)}
              </div>

              <p className="hint" style={{ margin: '14px 0 6px' }}>วิธีจัดส่ง</p>
              <div className="radio-row">
                <button type="button" className={`radio-opt ${method === 'STANDARD' ? 'checked' : ''}`} onClick={() => setMethod('STANDARD')}>มาตรฐาน (รอ VD/DC เข้ารับตามรอบ)</button>
                <button type="button" className={`radio-opt ${method === 'EXPRESS' ? 'checked' : ''}`} onClick={() => setMethod('EXPRESS')}>ส่งด่วน (3PL)</button>
              </div>
            </div>

            <div className="pcard">
              <h3>ภาพถ่ายสินค้าและระบุตำหนิ</h3>
              <p className="hint">ถ่ายภาพได้สูงสุด 4 ภาพ</p>
              <PhotoGrid photos={photos} onChange={setPhotos} />
              <div className="field" style={{ marginTop: 12 }}><label>ระบุตำหนิ</label><textarea className="inp" placeholder="เช่น รอยขีดข่วนด้านข้าง, สายไฟหลุดลุ่ย" value={defect} onChange={e => setDefect(e.target.value)} /></div>
            </div>
          </fieldset>
        </div>

        <div style={{ position: 'sticky', top: 0 }}>
          <div className="pcard">
            <h3>ค่าใช้จ่าย ณ วันที่เปิดงานซ่อม</h3>
            <div className="summary-row"><span>ค่าดำเนินการ</span><span>{fmtBaht(fees.operationFee)}</span></div>
            <div className="summary-row"><span>ค่าขนส่ง 3PL (ถ้าเลือก)</span><span>{fmtBaht(fees.shippingFee)}</span></div>
            <div className="summary-row total"><span>รวมค่าใช้จ่ายวันนี้</span><span>{fmtBaht(fees.total)}</span></div>
            <div className="note">กรณีลูกค้าอนุมัติซ่อม ค่าดำเนินการจะนำมาเป็นส่วนลดค่าซ่อมสินค้า</div>
          </div>

          {fees.total > 0 && (
            <div className="pcard">
              <h3>วิธีชำระค่าใช้จ่าย ณ วันที่เปิดงานซ่อม</h3>
              <div className="radio-row" style={{ marginTop: 8 }}>
                <button type="button" disabled={!!saved} className={`radio-opt ${pay === 'PROMPTPAY_QR' ? 'checked' : ''}`} onClick={() => setPay('PROMPTPAY_QR')}>QR Payment</button>
                <button type="button" disabled={!!saved} className={`radio-opt ${pay === 'CARD_LINK' ? 'checked' : ''}`} onClick={() => setPay('CARD_LINK')}>Link ตัดบัตรเครดิต</button>
                <button type="button" disabled={!!saved} className={`radio-opt ${pay === 'POS_RECEIPT' ? 'checked' : ''}`} onClick={() => setPay('POS_RECEIPT')}>เลขที่ใบเสร็จ POS</button>
              </div>
              <div style={{ marginTop: 10 }}>
                {pay === 'PROMPTPAY_QR' && <button type="button" className="btn btn-outline" disabled={saving || readOnly || paid} onClick={showPayment}>แสดง QR ให้ลูกค้าสแกน</button>}
                {pay === 'CARD_LINK' && <button type="button" className="btn btn-outline" disabled={saving || readOnly || paid} onClick={showPayment}>Gen link ตัดบัตรเครดิต ↗</button>}
                {pay === 'POS_RECEIPT' && <input className="inp" style={{ width: '100%' }} placeholder="เลขที่ใบเสร็จ POS (Ref.)" value={pos} disabled={!!saved} onChange={e => setPos(e.target.value)} />}
              </div>
              {saved && <p style={{ marginTop: 10, fontSize: 13 }}>สถานะ: {paid ? <span className="badge b-green">ชำระเงินสำเร็จ</span> : <span className="badge b-amber">รอชำระ {fmtBaht(fees.total)}</span>}</p>}
            </div>
          )}

          <div className="pcard" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!saved ? (
              <button className="btn btn-primary btn-lg" disabled={saving || readOnly} onClick={saveAndSend}>{saving ? 'กำลังบันทึก…' : 'บันทึก + ส่งข้อมูลแจ้งซ่อมให้ลูกค้าทาง LON'}</button>
            ) : (
              <>
                <button className="btn btn-primary btn-lg" onClick={() => setLon(true)}>ส่งข้อมูลแจ้งซ่อมให้ลูกค้าทาง LON</button>
                <button className="btn" onClick={() => setPrintDoc(true)}>พิมพ์ใบแจ้งซ่อม</button>
                {!paid && fees.total > 0 && <button className="btn btn-outline" onClick={() => setPayOpen(true)}>รับชำระค่าดำเนินการ</button>}
                <button className="btn" onClick={reset}>+ เปิดใบแจ้งซ่อมใหม่</button>
                <button className="btn" onClick={() => router.push('/cs')}>กลับคิว CS</button>
              </>
            )}
            {readOnly && <p className="hint">โหมดดูอย่างเดียว (เปิดงานได้เฉพาะ CS)</p>}
          </div>

          {saved && (
            <div className={`note ${saved.routing ? 'blue' : 'amber'}`}>
              {saved.routing
                ? <>ศูนย์ซ่อม: <b>{saved.routing.centerCode} {saved.routing.vendorName}</b> · ช่องทาง {CHANNEL_LABELS[saved.routing.channel] ?? saved.routing.channel}</>
                : <>⚠ ยังไม่พบศูนย์ซ่อมที่รองรับ — ส่งให้ Admin กำหนด</>}
            </div>
          )}
        </div>
      </div>

      <Modal open={taxModal} onClose={() => closeTax(false)}>
        <h3 style={{ margin: '0 0 4px' }}>ที่อยู่สำหรับออกใบกำกับภาษี</h3>
        <p className="hint">รูปแบบเดียวกับที่อยู่ลูกค้าด้านบน กรอกข้อมูลที่แตกต่างจากที่อยู่ลูกค้า</p>
        <div className="grid2">
          <div className="field"><label>ชื่อ / บริษัท (สำหรับใบกำกับภาษี)</label><input className="inp" value={taxDraft.name} onChange={e => setTaxDraft({ ...taxDraft, name: e.target.value })} placeholder="ชื่อผู้ออกใบกำกับ" /></div>
          <div className="field"><label>เลขประจำตัวผู้เสียภาษี</label><input className="inp" inputMode="numeric" maxLength={13} value={taxDraft.id} onChange={e => setTaxDraft({ ...taxDraft, id: e.target.value.replace(/\D/g, '') })} placeholder="13 หลัก" /></div>
        </div>
        <div className="divider" />
        <AddressFields value={taxDraft.addr} onChange={a => setTaxDraft({ ...taxDraft, addr: a })} />
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => closeTax(true)}>บันทึก</button>
          <button className="btn" onClick={() => closeTax(false)}>ยกเลิก</button>
        </div>
      </Modal>

      {saved && payOpen && (
        <PaymentModal job={{ id: saved.id, jobNo: saved.jobNo, version: 0 }} kind="intake" amount={fees.total} initialMethod={pay}
          onClose={() => setPayOpen(false)} onPaid={() => { setPaid(true); setPayOpen(false); setLon(true) }} />
      )}

      <Modal open={lon && !!saved} onClose={() => setLon(false)} size="narrow">
        {saved && (
          <div style={{ margin: '-22px -24px' }}>
            <div style={{ background: 'var(--red)', color: '#fff', padding: '12px 16px', fontSize: 13, fontWeight: 500, borderRadius: '14px 14px 0 0' }}>Line — Thaiwasadu Service Center</div>
            <div style={{ padding: 16, background: 'var(--surface-2)' }}>
              <p style={{ fontSize: 11, color: 'var(--text-mute)', margin: '0 0 6px' }}>ข้อความแจ้งซ่อมที่ส่งให้ลูกค้าทาง LON</p>
              <div style={{ background: 'var(--surface)', borderRadius: 12, padding: '14px 16px', fontSize: 13 }}>
                <p style={{ margin: '0 0 6px' }}>รับเรื่องแจ้งซ่อมเรียบร้อย — <b>{saved.jobNo}</b></p>
                <p style={{ margin: '0 0 4px' }}>สินค้า: {product} ({brandName})</p>
                <p style={{ margin: '0 0 4px' }}>สาขา: {branchName}</p>
                <p style={{ margin: '0 0 10px' }}>ค่าใช้จ่ายวันนี้: {fmtBaht(fees.total)} {fees.total > 0 && (paid ? '(ชำระแล้ว)' : '(รอชำระ)')}</p>
                {saved.trackingUrl && <a href={absUrl(saved.trackingUrl)} target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: 'var(--blue-tint)', color: 'var(--blue)', borderRadius: 8, padding: 10, fontWeight: 500 }}>ติดตามสถานะงานซ่อม ↗</a>}
              </div>
              <p className="sub-mute" style={{ marginTop: 8 }}>* ระบบ LON (LINE OA) จะเชื่อมต่อใน STEP-29 — ปัจจุบันคัดลอกลิงก์ส่งให้ลูกค้าได้</p>
              {saved.trackingUrl && <button className="btn" onClick={() => { navigator.clipboard?.writeText(absUrl(saved.trackingUrl!)); toast('คัดลอกลิงก์ติดตามสถานะแล้ว', 'success') }}>คัดลอกลิงก์ติดตามสถานะ</button>}
            </div>
          </div>
        )}
      </Modal>

      <Modal open={printDoc && !!saved} onClose={() => setPrintDoc(false)}>
        {saved && (
          <>
            <div className="print-area">
              <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                <p style={{ fontWeight: 600, fontSize: 16, margin: 0 }}>ใบแจ้งซ่อม — ศูนย์บริการซ่อมไทวัสดุ</p>
                <p style={{ fontSize: 12, color: 'var(--text-mute)', margin: '2px 0 0' }}>Thaiwasadu Service Center · {branchName}</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
                <div>
                  {[
                    ['เลขที่ใบแจ้งซ่อม', saved.jobNo], ['วันที่', new Date().toLocaleString('th-TH')], ['ลูกค้า', name], ['เบอร์โทร', phone],
                    ['สินค้า', `${product} (${brandName})`], ['SKU', sku || '-'], ['อาการเสีย', symptom], ['ตำหนิ', defect || '-'],
                    ['ประกัน', warranty === 'yes' ? 'มีประกัน' : 'ไม่มีประกัน'], ['ขนาด', sizeName], ['วิธีจัดส่ง', method === 'EXPRESS' ? 'ส่งด่วน (3PL)' : 'มาตรฐาน'],
                    ['ค่าใช้จ่ายวันนี้', `${fmtBaht(fees.total)} ${fees.total > 0 ? (paid ? '(ชำระแล้ว)' : '(รอชำระ)') : ''}`],
                    ['ศูนย์ซ่อม', saved.routing ? `${saved.routing.centerCode} ${saved.routing.vendorName}` : 'รอกำหนด'],
                  ].map(([k, v]) => <div className="info-row" key={k}><span className="info-label">{k}</span><span>{v}</span></div>)}
                </div>
                <div style={{ textAlign: 'center' }}>
                  {saved.trackingUrl && <QrImage value={absUrl(saved.trackingUrl)} size={120} />}
                  <p className="sub-mute">สแกนเพื่อติดตามสถานะ</p>
                </div>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 12 }}>กรณีลูกค้าอนุมัติซ่อม ค่าดำเนินการจะนำมาเป็นส่วนลดค่าซ่อมสินค้า · กรณีไม่อนุมัติซ่อม ค่าดำเนินการที่ชำระแล้วไม่สามารถคืนได้</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, fontSize: 12 }}>
                <span>ลงชื่อลูกค้า ______________________</span><span>ลงชื่อพนักงาน ______________________</span>
              </div>
            </div>
            <div className="modal-actions no-print">
              <button className="btn" onClick={() => setPrintDoc(false)}>ปิด</button>
              <button className="btn btn-primary" onClick={() => window.print()}>พิมพ์ (Print)</button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
