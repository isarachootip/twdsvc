'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, Tag, TrendingUp, BarChart2, RefreshCcw, ChevronRight } from 'lucide-react'
import RadioCardGroup from '@/components/ui/RadioCardGroup'

// ─── Types ────────────────────────────────────────────────────────────────────

interface KPIs { total: number; used: number; conversion: number }
interface Promo { id: string; name: string; discountPct: number }
interface SizeCategory { id: number; code: string; name: string }
interface TradeInJob {
  id: string; jobNo: string; customerName: string | null
  productName: string; sizeCategoryId: number | null; stage: string
}
interface TradeInRecord {
  id: string; tradeInNo: string; type: string; customerName: string
  customerPhone: string; productName: string; discountPct: number
  status: string; createdAt: string; promotion?: { name: string } | null
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white text-sm font-medium"
      style={{ background: 'var(--green)' }}>
      <CheckCircle2 size={18} />
      {message}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="card flex items-center gap-4">
      <div className="rounded-xl p-3" style={{ background: color + '20' }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{value}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>{label}</div>
      </div>
    </div>
  )
}

// ─── Promo Preview ────────────────────────────────────────────────────────────

function PromoPreview({ sizeCategoryId, type }: { sizeCategoryId: number | null; type: string }) {
  const [promo, setPromo] = useState<Promo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!sizeCategoryId) { setPromo(null); return }
    setLoading(true)
    const params = new URLSearchParams({ type, sizeCategoryId: String(sizeCategoryId) })
    fetch(`/api/promotions?${params}`)
      .then((r) => r.json())
      .then(setPromo)
      .catch(() => setPromo(null))
      .finally(() => setLoading(false))
  }, [sizeCategoryId, type])

  if (!sizeCategoryId) return null
  if (loading) return (
    <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--blue-tint)', color: 'var(--blue)' }}>
      กำลังโหลดโปรโมชัน...
    </div>
  )
  if (!promo) return (
    <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--surface-2)', color: 'var(--text-mute)' }}>
      ไม่พบโปรโมชันที่ใช้งานได้สำหรับสินค้าขนาดนี้
    </div>
  )
  return (
    <div className="p-3 rounded-xl text-sm flex items-center gap-2" style={{ background: 'var(--blue-tint)', color: 'var(--blue)' }}>
      <Tag size={15} />
      <span>
        ระบบเลือกโปร <strong>'{promo.name}'</strong> ให้อัตโนมัติ — ส่วนลด{' '}
        <strong>{promo.discountPct}%</strong>
      </span>
    </div>
  )
}

// ─── Type 1 Form ──────────────────────────────────────────────────────────────

function Type1Form({
  sizes,
  onSubmit,
  loading,
}: {
  sizes: SizeCategory[]
  onSubmit: (data: object) => Promise<Promo | null>
  loading: boolean
}) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [productName, setProductName] = useState('')
  const [brandName, setBrandName] = useState('')
  const [symptom, setSymptom] = useState('')
  const [sizeCategoryId, setSizeCategoryId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!customerName || !customerPhone || !productName) {
      setError('กรุณากรอกข้อมูลที่จำเป็น')
      return
    }
    if (!sizeCategoryId) {
      setError('กรุณาเลือกขนาดสินค้า')
      return
    }
    const promo = await onSubmit({ type: 'TYPE1', customerName, customerPhone, productName, brandName, symptom, sizeCategoryId })
    if (promo) {
      setCustomerName(''); setCustomerPhone(''); setProductName('')
      setBrandName(''); setSymptom(''); setSizeCategoryId(null)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
            ชื่อลูกค้า <span className="text-red-500">*</span>
          </label>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
            placeholder="ชื่อ-นามสกุล"
            className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
            เบอร์โทร <span className="text-red-500">*</span>
          </label>
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="08x-xxx-xxxx"
            className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
            ชื่อสินค้า <span className="text-red-500">*</span>
          </label>
          <input value={productName} onChange={(e) => setProductName(e.target.value)}
            placeholder="ชื่อสินค้า"
            className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
            ยี่ห้อ
          </label>
          <input value={brandName} onChange={(e) => setBrandName(e.target.value)}
            placeholder="ยี่ห้อ (ถ้ามี)"
            className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
          อาการ
        </label>
        <textarea rows={2} value={symptom} onChange={(e) => setSymptom(e.target.value)}
          placeholder="อธิบายอาการสินค้า..."
          className="w-full px-3 py-2 border rounded-xl text-sm outline-none resize-none"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
        />
      </div>

      <RadioCardGroup
        label="ขนาดสินค้า"
        required
        value={sizeCategoryId ? String(sizeCategoryId) : ''}
        onChange={(v) => setSizeCategoryId(Number(v))}
        options={sizes.map((s) => ({ value: String(s.id), label: s.code, sublabel: s.name }))}
      />

      <PromoPreview sizeCategoryId={sizeCategoryId} type="TYPE1" />

      {error && (
        <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--red-tint)', color: 'var(--red-dark)' }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-60"
        style={{ background: 'var(--red)' }}>
        {loading ? 'กำลังสร้าง...' : 'สร้างคูปอง TYPE 1'}
      </button>
    </form>
  )
}

// ─── Type 2 Form ──────────────────────────────────────────────────────────────

function Type2Form({
  sizes,
  onSubmit,
  loading,
}: {
  sizes: SizeCategory[]
  onSubmit: (data: object) => Promise<Promo | null>
  loading: boolean
}) {
  const [jobs, setJobs] = useState<TradeInJob[]>([])
  const [selectedJob, setSelectedJob] = useState<TradeInJob | null>(null)
  const [sizeCategoryId, setSizeCategoryId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Fetch eligible jobs (READY_FOR_PICKUP or CLOSED_NOT_REPAIRED with REJECTED decision)
    fetch('/api/jobs?stage=CLOSED_NOT_REPAIRED&limit=50')
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []))
      .catch(() => {})
  }, [])

  const handleSelect = (job: TradeInJob) => {
    setSelectedJob(job)
    if (job.sizeCategoryId) setSizeCategoryId(job.sizeCategoryId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!selectedJob) { setError('กรุณาเลือกงานซ่อม'); return }
    if (!sizeCategoryId) { setError('กรุณาเลือกขนาดสินค้า'); return }
    const promo = await onSubmit({
      type: 'TYPE2',
      jobId: selectedJob.id,
      customerName: selectedJob.customerName ?? 'ลูกค้า',
      customerPhone: '-',
      productName: selectedJob.productName,
      sizeCategoryId,
    })
    if (promo) { setSelectedJob(null); setSizeCategoryId(null) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
          เลือกงานซ่อมที่ลูกค้าไม่อนุมัติ
        </label>
        {jobs.length === 0 ? (
          <div className="py-6 text-center text-sm border rounded-xl" style={{ borderColor: 'var(--border)', color: 'var(--text-mute)' }}>
            ไม่มีงานที่มีสิทธิ์สร้าง Trade-in ขณะนี้
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {jobs.map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => handleSelect(job)}
                className="w-full flex items-center justify-between px-4 py-3 border-2 rounded-xl text-left transition-all"
                style={{
                  borderColor: selectedJob?.id === job.id ? 'var(--red)' : 'var(--border)',
                  background: selectedJob?.id === job.id ? 'var(--red-tint)' : 'var(--surface)',
                }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {job.jobNo}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
                    {job.customerName ?? '-'} — {job.productName}
                  </div>
                </div>
                {selectedJob?.id === job.id && (
                  <CheckCircle2 size={18} style={{ color: 'var(--red)' }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedJob && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-2)' }}>ลูกค้า</label>
              <div className="px-3 py-2 border rounded-xl text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                {selectedJob.customerName ?? '-'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-2)' }}>สินค้า</label>
              <div className="px-3 py-2 border rounded-xl text-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                {selectedJob.productName}
              </div>
            </div>
          </div>

          <RadioCardGroup
            label="ขนาดสินค้า"
            required
            value={sizeCategoryId ? String(sizeCategoryId) : ''}
            onChange={(v) => setSizeCategoryId(Number(v))}
            options={sizes.map((s) => ({ value: String(s.id), label: s.code, sublabel: s.name }))}
          />

          <PromoPreview sizeCategoryId={sizeCategoryId} type="TYPE2" />
        </>
      )}

      {error && (
        <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--red-tint)', color: 'var(--red-dark)' }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={loading || !selectedJob}
        className="w-full py-3 rounded-xl font-semibold text-white text-sm disabled:opacity-60"
        style={{ background: 'var(--red)' }}>
        {loading ? 'กำลังสร้าง...' : 'สร้างคูปอง TYPE 2'}
      </button>
    </form>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function TradeInStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ISSUED: { label: 'ออกแล้ว', cls: 'b-blue' },
    USED: { label: 'ใช้แล้ว', cls: 'b-green' },
    FAILED: { label: 'ล้มเหลว', cls: 'b-red' },
    EXPIRED: { label: 'หมดอายุ', cls: 'b-gray' },
  }
  const { label, cls } = map[status] ?? { label: status, cls: 'b-gray' }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span>
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TradeInPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [tradeInType, setTradeInType] = useState<'TYPE1' | 'TYPE2'>('TYPE1')
  const [sizes, setSizes] = useState<SizeCategory[]>([])
  const [history, setHistory] = useState<TradeInRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [toast, setToast] = useState('')

  const loadData = useCallback(() => {
    Promise.all([
      fetch('/api/tradein/kpis').then((r) => r.json()),
      fetch('/api/tradein').then((r) => r.json()),
    ])
      .then(([k, h]) => {
        setKpis(k)
        setHistory(Array.isArray(h) ? h : [])
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false))

    // Load size categories (reuse fee admin endpoint or create dedicated)
    fetch('/api/admin/fees')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setSizes(d.map((entry: { sizeCategory: SizeCategory }) => entry.sizeCategory))
        }
      })
      .catch(() => setSizes([
        { id: 1, code: 'SMALL', name: 'ขนาดเล็ก' },
        { id: 2, code: 'LARGE', name: 'ขนาดใหญ่' },
      ]))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSubmit = async (data: object): Promise<Promo | null> => {
    setSubmitLoading(true)
    try {
      // First get promo
      const payload = data as { type: string; sizeCategoryId?: number }
      let promoId: string | null = null
      let discountPct = 0

      if (payload.sizeCategoryId) {
        const promoRes = await fetch(`/api/promotions?type=${payload.type}&sizeCategoryId=${payload.sizeCategoryId}`)
        const promo: Promo | null = await promoRes.json()
        promoId = promo?.id ?? null
        discountPct = promo?.discountPct ?? 0
      }

      const res = await fetch('/api/tradein', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, discountPct, promotionId: promoId }),
      })

      if (!res.ok) return null

      const created: TradeInRecord = await res.json()
      setToast(`สร้างคูปอง ${created.tradeInNo} สำเร็จ — ส่วนลด ${discountPct}%`)
      loadData()
      return { id: promoId ?? '', name: '', discountPct }
    } catch {
      return null
    } finally {
      setSubmitLoading(false)
    }
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Trade-in / คูปอง
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          ออกคูปองส่วนลดสำหรับลูกค้าแลกสินค้าชำรุด
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="คูปองที่ออก"
          value={kpis?.total ?? '—'}
          icon={<Tag size={20} />}
          color="var(--blue)"
        />
        <KpiCard
          label="ใช้แล้ว"
          value={kpis?.used ?? '—'}
          icon={<CheckCircle2 size={20} />}
          color="var(--green)"
        />
        <KpiCard
          label="Conversion %"
          value={kpis ? `${kpis.conversion}%` : '—'}
          icon={<TrendingUp size={20} />}
          color="var(--amber)"
        />
      </div>

      {/* Type selector */}
      <div className="card">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>เลือกประเภท Trade-in</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { value: 'TYPE1', label: 'ประเภท 1 หน้างาน', sublabel: 'ลูกค้านำสินค้ามาแลก ณ จุดขาย', icon: <RefreshCcw size={22} /> },
            { value: 'TYPE2', label: 'ประเภท 2 หลังบ้าน', sublabel: 'ผูกกับงานซ่อมที่ลูกค้าไม่อนุมัติ', icon: <ChevronRight size={22} /> },
          ].map((opt) => {
            const selected = tradeInType === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTradeInType(opt.value as 'TYPE1' | 'TYPE2')}
                className="radio-card relative text-left p-5 gap-3 flex flex-row items-start"
                style={{
                  borderColor: selected ? 'var(--red)' : 'var(--border)',
                  background: selected ? 'var(--red-tint)' : 'var(--surface)',
                }}
              >
                {selected && (
                  <span className="absolute top-3 right-3">
                    <CheckCircle2 size={16} style={{ color: 'var(--red)' }} />
                  </span>
                )}
                <span className="mt-0.5" style={{ color: selected ? 'var(--red)' : 'var(--text-2)' }}>
                  {opt.icon}
                </span>
                <div>
                  <div className="text-sm font-semibold" style={{ color: selected ? 'var(--red-dark)' : 'var(--text)' }}>
                    {opt.label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-mute)' }}>
                    {opt.sublabel}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Form */}
        {tradeInType === 'TYPE1' ? (
          <Type1Form sizes={sizes} onSubmit={handleSubmit} loading={submitLoading} />
        ) : (
          <Type2Form sizes={sizes} onSubmit={handleSubmit} loading={submitLoading} />
        )}
      </div>

      {/* History */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={18} style={{ color: 'var(--text-2)' }} />
          <h2 className="font-semibold" style={{ color: 'var(--text)' }}>ประวัติการออกคูปอง</h2>
        </div>
        {historyLoading ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text-mute)' }}>กำลังโหลด...</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text-mute)' }}>ยังไม่มีรายการ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  {['เลขที่ TI', 'ประเภท', 'ลูกค้า', 'เบอร์', 'สินค้า', 'ส่วนลด%', 'สถานะ', 'วันที่'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 font-medium text-xs" style={{ color: 'var(--text-2)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((ti) => (
                  <tr key={ti.id} className="border-b hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--border)' }}>
                    <td className="py-2.5 px-3 font-mono text-xs font-medium" style={{ color: 'var(--text)' }}>{ti.tradeInNo}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: ti.type === 'TYPE1' ? 'var(--blue-tint)' : 'var(--amber-tint)', color: ti.type === 'TYPE1' ? 'var(--blue)' : 'var(--amber)' }}>
                        {ti.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text)' }}>{ti.customerName}</td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text-2)' }}>{ti.customerPhone}</td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text)' }}>{ti.productName}</td>
                    <td className="py-2.5 px-3 text-xs font-medium" style={{ color: 'var(--green)' }}>{ti.discountPct}%</td>
                    <td className="py-2.5 px-3"><TradeInStatusBadge status={ti.status} /></td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text-2)' }}>{formatDate(ti.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}
