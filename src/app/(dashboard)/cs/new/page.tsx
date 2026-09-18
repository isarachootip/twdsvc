'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  User, Package, Camera, FileText, CreditCard,
  CheckCircle2, Search, X, ChevronDown,
} from 'lucide-react'
import RadioCardGroup from '@/components/ui/RadioCardGroup'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Brand { id: number; name: string }
interface SizeCategory { id: number; code: string; name: string }
interface Commodity { id: number; sku: string; name: string; brand: string }

// ─── Fee rates (fallback if no size selected) ─────────────────────────────────
const HARDCODED_RATES: Record<string, { operationFee: number; shippingFee3pl: number }> = {
  SMALL: { operationFee: 150, shippingFee3pl: 80 },
  LARGE: { operationFee: 300, shippingFee3pl: 250 },
}

// ─── Bangkok zip → province/district lookup (sample) ─────────────────────────
const ZIP_LOOKUP: Record<string, { province: string; district: string; subdistrict: string }[]> = {
  '10110': [{ province: 'กรุงเทพมหานคร', district: 'พระโขนง', subdistrict: 'บางนา' }],
  '10120': [{ province: 'กรุงเทพมหานคร', district: 'มีนบุรี', subdistrict: 'มีนบุรี' }],
  '10130': [{ province: 'กรุงเทพมหานคร', district: 'ลาดกระบัง', subdistrict: 'ลาดกระบัง' }],
  '10150': [{ province: 'กรุงเทพมหานคร', district: 'คลองเตย', subdistrict: 'คลองเตย' }],
  '10160': [{ province: 'กรุงเทพมหานคร', district: 'ราษฎร์บูรณะ', subdistrict: 'ราษฎร์บูรณะ' }],
  '10170': [{ province: 'กรุงเทพมหานคร', district: 'ธนบุรี', subdistrict: 'บุคคโล' }],
  '10200': [{ province: 'กรุงเทพมหานคร', district: 'บางกอกน้อย', subdistrict: 'บางขุนนนท์' }],
  '10210': [{ province: 'กรุงเทพมหานคร', district: 'ตลิ่งชัน', subdistrict: 'ตลิ่งชัน' }],
  '10220': [{ province: 'กรุงเทพมหานคร', district: 'บางแค', subdistrict: 'บางแค' }],
  '10230': [{ province: 'กรุงเทพมหานคร', district: 'ดอนเมือง', subdistrict: 'ดอนเมือง' }],
  '10240': [{ province: 'กรุงเทพมหานคร', district: 'สายไหม', subdistrict: 'สายไหม' }],
  '10250': [{ province: 'กรุงเทพมหานคร', district: 'ลาดพร้าว', subdistrict: 'ลาดพร้าว' }],
  '10260': [{ province: 'กรุงเทพมหานคร', district: 'วังทองหลาง', subdistrict: 'วังทองหลาง' }],
  '10270': [{ province: 'กรุงเทพมหานคร', district: 'บึงกุ่ม', subdistrict: 'คันนายาว' }],
  '10280': [{ province: 'กรุงเทพมหานคร', district: 'หนองจอก', subdistrict: 'หนองจอก' }],
  '10290': [{ province: 'กรุงเทพมหานคร', district: 'ลาดกระบัง', subdistrict: 'ทับยาว' }],
  '10300': [{ province: 'กรุงเทพมหานคร', district: 'สาทร', subdistrict: 'ยานนาวา' }],
  '10310': [{ province: 'กรุงเทพมหานคร', district: 'บางรัก', subdistrict: 'บางรัก' }],
  '10320': [{ province: 'กรุงเทพมหานคร', district: 'พระนคร', subdistrict: 'พระบรมมหาราชวัง' }],
  '10330': [{ province: 'กรุงเทพมหานคร', district: 'ป้อมปราบศัตรูพ่าย', subdistrict: 'วัดเทพศิรินทร์' }],
  '10400': [{ province: 'กรุงเทพมหานคร', district: 'จตุจักร', subdistrict: 'จตุจักร' }],
  '10500': [{ province: 'กรุงเทพมหานคร', district: 'ดุสิต', subdistrict: 'ดุสิต' }],
  '10600': [{ province: 'กรุงเทพมหานคร', district: 'บางซื่อ', subdistrict: 'บางซื่อ' }],
  '10700': [{ province: 'กรุงเทพมหานคร', district: 'บางกอกน้อย', subdistrict: 'อรุณอมรินทร์' }],
  '10800': [{ province: 'กรุงเทพมหานคร', district: 'ดอนเมือง', subdistrict: 'สีกัน' }],
  '10900': [{ province: 'กรุงเทพมหานคร', district: 'บางเขน', subdistrict: 'บางเขน' }],
}

// ─── Form state ────────────────────────────────────────────────────────────────
interface FormState {
  // Customer
  customerName: string
  customerPhone: string
  customerZip: string
  province: string
  district: string
  subdistrict: string
  customerAddress: string
  taxInvoice: boolean
  taxName: string
  taxId: string
  taxAddr: string
  // Product
  sku: string
  productName: string
  brandId: string
  brandName: string
  symptom: string
  serialNo: string
  hasWarranty: string // 'true'/'false'
  sizeCategoryId: string
  sizeCategoryCode: string
  shippingMethod: string
  // Defect / photos
  defectNote: string
  // Payment
  paymentMethod: string
  posReceiptNo: string
}

const INITIAL_FORM: FormState = {
  customerName: '', customerPhone: '', customerZip: '',
  province: '', district: '', subdistrict: '', customerAddress: '',
  taxInvoice: false, taxName: '', taxId: '', taxAddr: '',
  sku: '', productName: '', brandId: '', brandName: '', symptom: '', serialNo: '',
  hasWarranty: 'false', sizeCategoryId: '', sizeCategoryCode: '', shippingMethod: 'STANDARD',
  defectNote: '', paymentMethod: 'PROMPTPAY_QR', posReceiptNo: '',
}

// ─── Fee calculation (client-side) ────────────────────────────────────────────
function calcFees(form: FormState): { operationFee: number; shippingFee: number; total: number } {
  const code = form.sizeCategoryCode
  if (!code) return { operationFee: 0, shippingFee: 0, total: 0 }
  const rates = HARDCODED_RATES[code] ?? { operationFee: 0, shippingFee3pl: 0 }

  if (form.hasWarranty === 'true' && form.shippingMethod === 'STANDARD') {
    return { operationFee: 0, shippingFee: 0, total: 0 }
  }

  const operationFee = form.hasWarranty === 'true' ? 0 : rates.operationFee
  const shippingFee = form.shippingMethod === 'EXPRESS' ? rates.shippingFee3pl : 0
  return { operationFee, shippingFee, total: operationFee + shippingFee }
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
        <span style={{ color: 'var(--red)' }}>{icon}</span>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium" style={{ color: 'var(--text)' }}>
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Input style ──────────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-red-300'
const inputStyle: React.CSSProperties = { borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }

// ─── Commodity search ─────────────────────────────────────────────────────────
function CommoditySearch({ onSelect }: { onSelect: (c: Commodity) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Commodity[]>([])
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const doSearch = useCallback(async (val: string) => {
    if (!val) { setResults([]); setOpen(false); return }
    const r = await fetch(`/api/commodities?search=${encodeURIComponent(val)}`)
    if (r.ok) {
      const d = await r.json()
      setResults(d)
      setOpen(true)
    }
  }, [])

  const handleChange = (val: string) => {
    setQ(val)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(val), 300)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-mute)' }} />
        <input
          type="text"
          placeholder="ค้นหา SKU หรือชื่อสินค้า..."
          value={q}
          onChange={e => handleChange(e.target.value)}
          className={inputCls + ' pl-9'}
          style={inputStyle}
          onFocus={() => q && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
      </div>
      {open && results.length > 0 && (
        <div
          className="absolute z-20 w-full mt-1 rounded-xl shadow-lg border overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {results.map(c => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => { onSelect(c); setQ(''); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 flex items-start gap-3"
            >
              <span className="font-mono text-xs mt-0.5 shrink-0" style={{ color: 'var(--text-mute)' }}>{c.sku}</span>
              <span className="font-medium" style={{ color: 'var(--text)' }}>{c.name}</span>
              <span className="ml-auto text-xs shrink-0" style={{ color: 'var(--text-mute)' }}>{c.brand}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Photo slot ───────────────────────────────────────────────────────────────
function PhotoSlot({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => onChange(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-full aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:border-red-400 hover:bg-red-50 transition-colors"
        style={{ borderColor: file ? 'var(--green)' : 'var(--border)', background: file ? 'var(--green-tint)' : 'var(--surface)' }}
      >
        {file ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover rounded-xl" />
        ) : (
          <>
            <Camera size={20} style={{ color: 'var(--text-mute)' }} />
            <span className="text-xs" style={{ color: 'var(--text-mute)' }}>{label}</span>
          </>
        )}
      </button>
      {file && (
        <button
          type="button"
          className="mt-1 text-xs w-full text-center"
          style={{ color: 'var(--text-mute)' }}
          onClick={() => onChange(null)}
        >
          ลบ
        </button>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CsNewPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [brands, setBrands] = useState<Brand[]>([])
  const [sizeCategories, setSizeCategories] = useState<SizeCategory[]>([])
  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null, null])
  const [loading, setLoading] = useState(false)
  const [savedJobNo, setSavedJobNo] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  // Fetch dropdowns
  useEffect(() => {
    fetch('/api/brands').then(r => r.json()).then(setBrands).catch(() => {})
    fetch('/api/size-categories').then(r => r.json()).then(setSizeCategories).catch(() => {})
  }, [])

  const set = (key: keyof FormState, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }))

  // Zip code auto-fill
  useEffect(() => {
    if (form.customerZip.length === 5) {
      const results = ZIP_LOOKUP[form.customerZip]
      if (results?.length) {
        setForm(prev => ({
          ...prev,
          province: results[0].province,
          district: results[0].district,
          subdistrict: results[0].subdistrict,
        }))
      }
    }
  }, [form.customerZip])

  const fees = calcFees(form)

  // Validation
  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.customerName.trim()) e.customerName = 'กรุณากรอกชื่อลูกค้า'
    if (!form.customerPhone.trim()) e.customerPhone = 'กรุณากรอกเบอร์โทร'
    if (!form.productName.trim()) e.productName = 'กรุณากรอกชื่อสินค้า'
    if (!form.brandName.trim()) e.brandName = 'กรุณาเลือกยี่ห้อ'
    if (!form.symptom.trim()) e.symptom = 'กรุณากรอกอาการ'
    if (!form.sizeCategoryId) e.sizeCategoryId = 'กรุณาเลือกขนาด'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const body = {
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerAddress: [form.subdistrict, form.district, form.province, form.customerZip, form.customerAddress].filter(Boolean).join(' '),
        customerZip: form.customerZip,
        productName: form.productName,
        brandName: form.brandName,
        brandId: form.brandId ? Number(form.brandId) : undefined,
        symptom: form.symptom,
        serialNo: form.serialNo || undefined,
        hasWarranty: form.hasWarranty === 'true',
        sizeCategoryId: form.sizeCategoryId ? Number(form.sizeCategoryId) : undefined,
        shippingMethod: form.shippingMethod,
        sku: form.sku || undefined,
      }

      const r = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!r.ok) {
        const d = await r.json()
        alert(d.error ?? 'เกิดข้อผิดพลาด')
        return
      }

      const job = await r.json()
      setSavedJobNo(job.jobNo)
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setLoading(false)
    }
  }

  // ─── Success state ────────────────────────────────────────────────────────
  if (savedJobNo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="card max-w-sm w-full text-center space-y-4 py-8 px-6">
          <div className="flex justify-center">
            <CheckCircle2 size={48} style={{ color: 'var(--green)' }} />
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>บันทึกใบแจ้งซ่อมสำเร็จ</p>
            <p className="text-2xl font-bold mt-1 font-mono" style={{ color: 'var(--red)' }}>{savedJobNo}</p>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              🖨️ พิมพ์ใบแจ้งซ่อม
            </button>
            <button
              type="button"
              onClick={() => { setSavedJobNo(null); setForm(INITIAL_FORM); setPhotos([null, null, null, null]) }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--red)' }}
            >
              + เปิดใบแจ้งซ่อมใหม่
            </button>
            <button
              type="button"
              onClick={() => router.push('/cs')}
              className="text-sm"
              style={{ color: 'var(--text-2)' }}
            >
              กลับ CS Queue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Form ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50"
          style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
        >
          ← กลับ
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>เปิดใบแจ้งซ่อม</h1>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>บันทึกข้อมูลลูกค้าและสินค้า</p>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1.5fr 1fr', alignItems: 'start' }}>
        {/* ── LEFT ── */}
        <div className="space-y-4">

          {/* Customer info */}
          <SectionCard icon={<User size={16} />} title="ข้อมูลลูกค้า">
            <div className="grid grid-cols-2 gap-3">
              <Field label="ชื่อ-นามสกุล" required>
                <input
                  className={inputCls}
                  style={{ ...inputStyle, borderColor: errors.customerName ? 'var(--red)' : 'var(--border)' }}
                  value={form.customerName}
                  onChange={e => set('customerName', e.target.value)}
                  placeholder="สมชาย ใจดี"
                />
                {errors.customerName && <p className="text-xs mt-0.5" style={{ color: 'var(--red)' }}>{errors.customerName}</p>}
              </Field>
              <Field label="เบอร์โทรศัพท์" required>
                <input
                  className={inputCls}
                  style={{ ...inputStyle, borderColor: errors.customerPhone ? 'var(--red)' : 'var(--border)' }}
                  value={form.customerPhone}
                  onChange={e => set('customerPhone', e.target.value)}
                  placeholder="08x-xxx-xxxx"
                  type="tel"
                />
                {errors.customerPhone && <p className="text-xs mt-0.5" style={{ color: 'var(--red)' }}>{errors.customerPhone}</p>}
              </Field>
            </div>

            {/* Zip + auto-fill */}
            <div className="grid grid-cols-3 gap-3">
              <Field label="รหัสไปรษณีย์">
                <input
                  className={inputCls}
                  style={inputStyle}
                  value={form.customerZip}
                  onChange={e => set('customerZip', e.target.value.slice(0, 5))}
                  placeholder="10110"
                  maxLength={5}
                />
              </Field>
              <Field label="จังหวัด">
                <input className={inputCls} style={inputStyle} value={form.province} onChange={e => set('province', e.target.value)} placeholder="กรุงเทพมหานคร" />
              </Field>
              <Field label="เขต/อำเภอ">
                <input className={inputCls} style={inputStyle} value={form.district} onChange={e => set('district', e.target.value)} placeholder="เขต" />
              </Field>
            </div>

            <Field label="แขวง/ตำบล">
              <input className={inputCls} style={inputStyle} value={form.subdistrict} onChange={e => set('subdistrict', e.target.value)} placeholder="แขวง" />
            </Field>

            <Field label="ที่อยู่เพิ่มเติม">
              <input className={inputCls} style={inputStyle} value={form.customerAddress} onChange={e => set('customerAddress', e.target.value)} placeholder="บ้านเลขที่ ซอย ถนน" />
            </Field>

            {/* Tax invoice toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.taxInvoice}
                onChange={e => set('taxInvoice', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm" style={{ color: 'var(--text)' }}>ต้องการใบกำกับภาษี</span>
            </label>

            {form.taxInvoice && (
              <div className="space-y-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="ชื่อสำหรับใบกำกับ">
                    <input className={inputCls} style={inputStyle} value={form.taxName} onChange={e => set('taxName', e.target.value)} />
                  </Field>
                  <Field label="เลขผู้เสียภาษี (13 หลัก)">
                    <input className={inputCls} style={inputStyle} value={form.taxId} onChange={e => set('taxId', e.target.value)} maxLength={13} />
                  </Field>
                </div>
                <Field label="ที่อยู่สำหรับใบกำกับ">
                  <input className={inputCls} style={inputStyle} value={form.taxAddr} onChange={e => set('taxAddr', e.target.value)} />
                </Field>
              </div>
            )}
          </SectionCard>

          {/* Product info */}
          <SectionCard icon={<Package size={16} />} title="ข้อมูลสินค้า">
            {/* SKU search */}
            <Field label="ค้นหาสินค้า (SKU)">
              <CommoditySearch
                onSelect={c => setForm(prev => ({
                  ...prev,
                  sku: c.sku,
                  productName: c.name,
                  brandName: c.brand,
                }))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="ชื่อสินค้า" required>
                <input
                  className={inputCls}
                  style={{ ...inputStyle, borderColor: errors.productName ? 'var(--red)' : 'var(--border)' }}
                  value={form.productName}
                  onChange={e => set('productName', e.target.value)}
                  placeholder="เช่น เครื่องซักผ้า 15 กก."
                />
                {errors.productName && <p className="text-xs mt-0.5" style={{ color: 'var(--red)' }}>{errors.productName}</p>}
              </Field>
              <Field label="ยี่ห้อ" required>
                <select
                  className={inputCls}
                  style={{ ...inputStyle, borderColor: errors.brandName ? 'var(--red)' : 'var(--border)' }}
                  value={form.brandId}
                  onChange={e => {
                    const opt = brands.find(b => b.id === Number(e.target.value))
                    setForm(prev => ({ ...prev, brandId: e.target.value, brandName: opt?.name ?? '' }))
                  }}
                >
                  <option value="">-- เลือกยี่ห้อ --</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.brandName && <p className="text-xs mt-0.5" style={{ color: 'var(--red)' }}>{errors.brandName}</p>}
              </Field>
            </div>

            <Field label="หมายเลขซีเรียล">
              <input className={inputCls} style={inputStyle} value={form.serialNo} onChange={e => set('serialNo', e.target.value)} placeholder="SN123456789" />
            </Field>

            <Field label="อาการเสีย" required>
              <textarea
                className={inputCls}
                style={{ ...inputStyle, borderColor: errors.symptom ? 'var(--red)' : 'var(--border)', resize: 'vertical' }}
                value={form.symptom}
                onChange={e => set('symptom', e.target.value)}
                rows={3}
                placeholder="อธิบายอาการเสียโดยละเอียด..."
              />
              {errors.symptom && <p className="text-xs mt-0.5" style={{ color: 'var(--red)' }}>{errors.symptom}</p>}
            </Field>

            {/* Warranty */}
            <RadioCardGroup
              label="ประกัน"
              value={form.hasWarranty}
              onChange={v => set('hasWarranty', v)}
              options={[
                { value: 'true', label: 'มีประกัน', sublabel: 'ยังอยู่ในระยะประกัน' },
                { value: 'false', label: 'ไม่มีประกัน', sublabel: 'หมดประกันหรือไม่มีประกัน' },
              ]}
            />

            {/* Size */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                ขนาดสินค้า <span className="text-red-500">*</span>
              </label>
              {sizeCategories.length > 0 ? (
                <RadioCardGroup
                  value={form.sizeCategoryId}
                  onChange={v => {
                    const cat = sizeCategories.find(c => c.id === Number(v))
                    setForm(prev => ({ ...prev, sizeCategoryId: v, sizeCategoryCode: cat?.code ?? '' }))
                  }}
                  options={sizeCategories.map(c => ({
                    value: String(c.id),
                    label: c.name,
                    sublabel: c.code === 'SMALL' ? 'ค่าดำเนินการ ฿150' : 'ค่าดำเนินการ ฿300',
                  }))}
                />
              ) : (
                <RadioCardGroup
                  value={form.sizeCategoryCode}
                  onChange={v => setForm(prev => ({ ...prev, sizeCategoryCode: v, sizeCategoryId: v === 'SMALL' ? '1' : '2' }))}
                  options={[
                    { value: 'SMALL', label: 'ขนาดเล็ก', sublabel: 'ค่าดำเนินการ ฿150' },
                    { value: 'LARGE', label: 'ขนาดใหญ่', sublabel: 'ค่าดำเนินการ ฿300' },
                  ]}
                />
              )}
              {errors.sizeCategoryId && <p className="text-xs mt-1" style={{ color: 'var(--red)' }}>{errors.sizeCategoryId}</p>}
            </div>

            {/* Shipping method */}
            <RadioCardGroup
              label="ช่องทางจัดส่ง"
              value={form.shippingMethod}
              onChange={v => set('shippingMethod', v)}
              columns={3}
              options={[
                { value: 'STANDARD', label: 'DC มาตรฐาน', sublabel: 'รถ DC รับ-ส่ง' },
                { value: 'DSD', label: 'DSD (VD รับ)', sublabel: 'VD มารับเอง' },
                { value: 'EXPRESS', label: '3PL ส่งด่วน', sublabel: `+฿${form.sizeCategoryCode ? (HARDCODED_RATES[form.sizeCategoryCode]?.shippingFee3pl ?? 0) : '—'}` },
              ]}
            />
          </SectionCard>

          {/* Photos */}
          <SectionCard icon={<Camera size={16} />} title="ภาพถ่ายสินค้า">
            <div className="grid grid-cols-4 gap-3">
              {photos.map((f, i) => (
                <PhotoSlot
                  key={i}
                  label={['ด้านหน้า', 'ด้านหลัง', 'ตำหนิ', 'อื่นๆ'][i]}
                  file={f}
                  onChange={file => setPhotos(prev => { const n = [...prev]; n[i] = file; return n })}
                />
              ))}
            </div>
          </SectionCard>

          {/* Defect note */}
          <SectionCard icon={<FileText size={16} />} title="หมายเหตุตำหนิ">
            <textarea
              className={inputCls}
              style={{ ...inputStyle, resize: 'vertical' }}
              value={form.defectNote}
              onChange={e => set('defectNote', e.target.value)}
              rows={3}
              placeholder="บันทึกตำหนิหรือรอยขีดข่วนที่มีก่อนเข้าซ่อม..."
            />
          </SectionCard>
        </div>

        {/* ── RIGHT (sticky) ── */}
        <div className="sticky top-4 space-y-4">
          {/* Fee summary */}
          <SectionCard icon={<CreditCard size={16} />} title="ค่าใช้จ่าย">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-2)' }}>ค่าดำเนินการ</span>
                <span className="font-medium">฿{fees.operationFee.toLocaleString()}</span>
              </div>
              {form.shippingMethod === 'EXPRESS' && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-2)' }}>ค่าขนส่ง 3PL</span>
                  <span className="font-medium">฿{fees.shippingFee.toLocaleString()}</span>
                </div>
              )}
              <div
                className="flex justify-between text-sm font-bold pt-2 border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <span>รวม</span>
                <span style={{ color: fees.total > 0 ? 'var(--red)' : 'var(--text)' }}>
                  ฿{fees.total.toLocaleString()}
                </span>
              </div>
              {fees.total > 0 && (
                <p className="text-xs" style={{ color: 'var(--text-mute)' }}>
                  * ค่าดำเนินการจะถูกหักออกจากค่าซ่อมเมื่อลูกค้าอนุมัติ
                </p>
              )}
              {fees.total === 0 && form.sizeCategoryCode && (
                <p className="text-xs" style={{ color: 'var(--green)' }}>
                  ✓ สินค้ายังอยู่ในประกัน — ไม่เสียค่าใช้จ่าย
                </p>
              )}
              {!form.sizeCategoryCode && (
                <p className="text-xs" style={{ color: 'var(--text-mute)' }}>
                  กรุณาเลือกขนาดสินค้าเพื่อดูค่าใช้จ่าย
                </p>
              )}
            </div>
          </SectionCard>

          {/* Payment method (only if fee > 0) */}
          {fees.total > 0 && (
            <SectionCard icon={<CreditCard size={16} />} title="วิธีชำระ">
              <RadioCardGroup
                value={form.paymentMethod}
                onChange={v => set('paymentMethod', v)}
                options={[
                  { value: 'PROMPTPAY_QR', label: 'QR พร้อมเพย์', sublabel: 'สแกนจ่ายทันที' },
                  { value: 'CARD_LINK', label: 'บัตร / Link', sublabel: 'ส่งลิงก์ลูกค้า' },
                  { value: 'POS_RECEIPT', label: 'POS เงินสด', sublabel: 'จ่ายที่เครื่อง POS' },
                ]}
              />

              {form.paymentMethod === 'PROMPTPAY_QR' && (
                <button
                  type="button"
                  className="w-full py-2 rounded-xl text-sm font-medium border-2 mt-1"
                  style={{ borderColor: 'var(--blue)', color: 'var(--blue)', background: 'var(--blue-tint)' }}
                >
                  แสดง QR ให้ลูกค้าสแกน
                </button>
              )}

              {form.paymentMethod === 'CARD_LINK' && (
                <button
                  type="button"
                  className="w-full py-2 rounded-xl text-sm font-medium border-2 mt-1"
                  style={{ borderColor: 'var(--blue)', color: 'var(--blue)', background: 'var(--blue-tint)' }}
                >
                  Gen Link ส่ง LON
                </button>
              )}

              {form.paymentMethod === 'POS_RECEIPT' && (
                <Field label="เลขใบเสร็จ POS">
                  <input
                    className={inputCls}
                    style={inputStyle}
                    value={form.posReceiptNo}
                    onChange={e => set('posReceiptNo', e.target.value)}
                    placeholder="เลขใบเสร็จ"
                  />
                </Field>
              )}
            </SectionCard>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-bold text-white shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: 'var(--red)' }}
          >
            {loading ? 'กำลังบันทึก...' : '💾 บันทึก + ส่งข้อมูลให้ลูกค้า'}
          </button>

          <p className="text-xs text-center" style={{ color: 'var(--text-mute)' }}>
            ระบบจะส่ง SMS และลิงก์ติดตามให้ลูกค้าอัตโนมัติ
          </p>
        </div>
      </div>
    </form>
  )
}
