'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, X, Printer, CheckCircle2, ChevronDown, Package,
  Search, AlertCircle, ArrowUpDown
} from 'lucide-react'
import StageBadge from '@/components/ui/StageBadge'
import RadioCardGroup from '@/components/ui/RadioCardGroup'
import { useMe } from '@/components/ui/useMe'
import { JobStage, Channel } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VendorCenter {
  id: string
  code: string
  deliveryMethod: string
  vendorParent: { name: string; code: string }
}

interface StockItemInput {
  id: string
  sku: string
  productName: string
  quantity: number
  holdStockNo: string
  symptom: string
}

interface JobItemRecord {
  id: string
  sku: string | null
  productName: string
  quantity: number
  holdStockNo: string | null
  symptom: string | null
}

interface StockJob {
  id: string
  jobNo: string
  stage: JobStage
  channel: Channel | null
  openedAt: string
  receiverName: string | null
  vendorCenter: { code: string; vendorParent: { name: string } } | null
  items: JobItemRecord[]
}

// ─── Print Sticker Modal (2x2 inch on A4 sheet) ──────────────────────────────

function StickerModal({
  job,
  onClose,
}: {
  job: StockJob
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h2 className="font-semibold text-lg text-[#2B2723]">
              ใบแปะสินค้า ขนาด 2×2 นิ้ว — พิมพ์ลงกระดาษ A4
            </h2>
            <p className="text-xs text-[#6B6459]">
              เลขที่งาน: <b>{job.jobNo}</b> · {job.items.length} รายการ · รวม {job.items.reduce((s, i) => s + i.quantity, 0)} ชิ้น
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow"
              style={{ background: 'var(--red)' }}
            >
              <Printer size={16} />
              พิมพ์ (Print)
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm border hover:bg-gray-50 transition-colors"
              style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
            >
              <X size={16} />
              ปิด
            </button>
          </div>
        </div>

        {/* Sticker preview (A4 4-col grid) */}
        <div className="overflow-y-auto p-6 flex-1 bg-gray-50">
          <div id="sticker-print-area" className="grid grid-cols-4 gap-3 bg-white p-6 rounded-xl border shadow-sm">
            {job.items.map((item, idx) =>
              Array.from({ length: item.quantity }).map((_, qIdx) => (
                <div
                  key={`${idx}-${qIdx}`}
                  className="border-2 border-dashed border-[#999] rounded-lg p-2.5 flex flex-col items-center justify-between text-center bg-white"
                  style={{
                    width: '144px',
                    height: '144px',
                    fontFamily: 'Sarabun, sans-serif',
                  }}
                >
                  <div className="w-12 h-12 border border-[#333] flex items-center justify-center text-2xl text-[#555] bg-gray-50">
                    ▦
                  </div>
                  <div className="w-full">
                    <div className="font-bold text-[11px] text-[#C8102E] truncate font-mono">
                      {job.jobNo}
                    </div>
                    <div className="font-mono text-[9px] text-[#333] truncate">
                      SKU: {item.sku || '-'} {item.quantity > 1 ? `(${qIdx + 1}/${item.quantity})` : ''}
                    </div>
                    {item.holdStockNo && (
                      <div className="text-[9px] text-[#185FA5] font-mono truncate">
                        Hold: {item.holdStockNo}
                      </div>
                    )}
                    <div className="text-[9px] text-[#2B2723] truncate leading-tight">
                      {item.productName}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Vendor Center Combobox ─────────────────────────────────────────────────

function VendorCombobox({
  value,
  onChange,
}: {
  value: VendorCenter | null
  onChange: (v: VendorCenter | null) => void
}) {
  const [centers, setCenters] = useState<VendorCenter[]>([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/vendor-centers')
      .then((r) => r.json())
      .then((d) => setCenters(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = centers.filter(
    (c) =>
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.vendorParent.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
        เลือกศูนย์ซ่อมปลายทาง (VD Center) <span className="text-red-500">*</span>
      </label>
      <button
        type="button"
        onClick={() => {
          setOpen(!open)
          setQuery('')
        }}
        className="w-full flex items-center justify-between px-3 py-2.5 border rounded-xl text-sm text-left bg-white"
        style={{
          borderColor: 'var(--border)',
          color: value ? 'var(--text)' : 'var(--text-mute)',
        }}
      >
        <span>
          {value ? `${value.code} — ${value.vendorParent.name}` : 'เลือก VD ปลายทาง (เช่น VD-0088)...'}
        </span>
        <ChevronDown size={16} style={{ color: 'var(--text-mute)' }} />
      </button>

      {open && (
        <div
          className="absolute z-20 mt-1 w-full rounded-xl shadow-lg border overflow-hidden bg-white"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="p-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหารหัส หรือชื่อ VD..."
              className="w-full px-3 py-1.5 text-xs border rounded-lg outline-none bg-gray-50"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-xs text-center text-[#9A9384]">ไม่พบศูนย์บริการ</li>
            ) : (
              filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
                    onClick={() => {
                      onChange(c)
                      setOpen(false)
                    }}
                  >
                    <span
                      className="font-mono text-[11px] px-1.5 py-0.5 rounded font-bold"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
                    >
                      {c.code}
                    </span>
                    <span style={{ color: 'var(--text)' }}>{c.vendorParent.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function S2Page() {
  const me = useMe()
  const isAdmin = me?.user?.role === 'ADMIN'
  const [branchId, setBranchId] = useState('')
  const [sites, setSites] = useState<Array<{ id: string; code: string; name: string; type: string }>>([])
  const [vendorCenter, setVendorCenter] = useState<VendorCenter | null>(null)
  const [receiverName, setReceiverName] = useState('')
  const [channel, setChannel] = useState<'DC' | 'DSD'>('DC')

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/sites')
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d)) {
            const branches = d.filter((s) => s.type === 'BRANCH')
            setSites(branches)
            if (branches.length > 0 && !branchId) {
              setBranchId(branches[0].id)
            }
          }
        })
        .catch(() => {})
    }
  }, [isAdmin, branchId])

  // Multi-SKU Items capturing holdStockNo (F17-T04)
  const [items, setItems] = useState<StockItemInput[]>([
    { id: crypto.randomUUID(), sku: '', productName: '', quantity: 1, holdStockNo: '', symptom: '' },
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [printJob, setPrintJob] = useState<StockJob | null>(null)

  // History & Filters
  const [history, setHistory] = useState<StockJob[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [search, setSearch] = useState('')

  const loadHistory = useCallback(() => {
    setHistoryLoading(true)
    fetch('/api/jobs?type=STOCK&limit=50')
      .then((r) => r.json())
      .then((d) => setHistory(d.jobs ?? []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sku: '', productName: '', quantity: 1, holdStockNo: '', symptom: '' },
    ])

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id))

  const updateItem = (id: string, field: keyof Omit<StockItemInput, 'id'>, val: string | number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: val } : i)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!vendorCenter) {
      setError('กรุณาเลือกศูนย์ซ่อม VD ปลายทาง')
      return
    }
    if (!receiverName.trim()) {
      setError('กรุณากรอกชื่อผู้รับเรื่อง (เจ้าหน้าที่ VD ที่ยินยอมให้ส่งซ่อม)')
      return
    }
    if (items.some((i) => !i.sku.trim() || !i.productName.trim())) {
      setError('กรุณากรอก SKU และชื่อสินค้าทุกรายการ')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/jobs/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: isAdmin && branchId ? branchId : undefined,
          vendorCenterId: vendorCenter.id,
          receiverName,
          channel,
          items: items.map(({ sku, productName, quantity, holdStockNo, symptom }) => ({
            sku,
            productName,
            quantity,
            holdStockNo: holdStockNo || null,
            symptom: symptom || '',
          })),
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'เกิดข้อผิดพลาดในการเปิดงาน')
        return
      }

      const job: StockJob = await res.json()
      setPrintJob(job)

      // Reset form
      setVendorCenter(null)
      setReceiverName('')
      setChannel('DC')
      setItems([{ id: crypto.randomUUID(), sku: '', productName: '', quantity: 1, holdStockNo: '', symptom: '' }])
      loadHistory()
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  // Fix Bug C8: Close S2 Stock Repair via cs_close (without customer payment gate)
  const handleCloseJob = async (jobId: string) => {
    if (!confirm('ยืนยันการปิดงานสต็อกสาขานี้? (สินค้าส่งคืนถึงสต็อกสาขาเรียบร้อย)')) return
    try {
      // First attempt PATCH /api/jobs/[id] with action: 'cs_close' or 'CLOSE'
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cs_close' }),
      })

      if (!res.ok) {
        // Fallback to /api/jobs/[id]/action
        await fetch(`/api/jobs/${jobId}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cs_close' }),
        })
      }
      loadHistory()
    } catch {
      alert('เกิดข้อผิดพลาดในการปิดงาน')
    }
  }

  const filteredJobs = history.filter((j) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      j.jobNo.toLowerCase().includes(q) ||
      (j.vendorCenter?.code.toLowerCase() || '').includes(q) ||
      (j.vendorCenter?.vendorParent.name.toLowerCase() || '').includes(q) ||
      j.items.some((it) => (it.sku?.toLowerCase() || '').includes(q) || it.productName.toLowerCase().includes(q))
    )
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            เปิดใบแจ้งซ่อมสต็อกสาขา (S2)
          </h1>
          <span className="text-xs bg-[#E6F1FB] text-[#185FA5] px-2.5 py-1 rounded-full font-medium">
            สิทธิ์: S2 / GR
          </span>
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          ไม่ต้องกรอกข้อมูลลูกค้า ไม่มีการเสนอราคาเก็บเงิน ข้ามขั้นตอนการเงินทั้งหมด
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: VD Info */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: 'var(--red)' }}
            >
              1
            </span>
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              ส่วนที่ 1 — ข้อมูล VD ปลายทาง
            </h2>
          </div>

          {isAdmin && sites.length > 0 && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
                สาขาต้นทาง (ผู้ดูแลระบบเลือกสาขาที่เปิดงาน)
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-[#C8102E] bg-white"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <VendorCombobox value={vendorCenter} onChange={setVendorCenter} />

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text)' }}>
              ผู้รับเรื่อง (เจ้าหน้าที่ VD ที่ยินยอมให้ส่งซ่อม) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="เช่น ช่างวิชัย หรือ คุณสมชาย"
              className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:border-[#C8102E] bg-white"
              style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
            />
          </div>
        </div>

        {/* Section 2: Items Multi-SKU Grid */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: 'var(--red)' }}
              >
                2
              </span>
              <h2 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                ส่วนที่ 2 — รายการสินค้า (Multi-SKU)
              </h2>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-semibold transition-colors"
              style={{ color: 'var(--blue)', background: 'var(--blue-tint)' }}
            >
              <Plus size={14} /> เพิ่ม SKU
            </button>
          </div>

          {/* Line Header */}
          <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-[#6B6459] px-2 hidden sm:grid">
            <span className="col-span-2">SKU สินค้า *</span>
            <span className="col-span-3">ชื่อสินค้า *</span>
            <span className="col-span-1">จำนวน</span>
            <span className="col-span-2">เลขที่ Hold stock</span>
            <span className="col-span-3">อาการเสีย</span>
            <span className="col-span-1 text-center">ลบ</span>
          </div>

          {/* Line items list */}
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 border rounded-xl items-center bg-[#FAF7F2]"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="sm:col-span-2">
                  <input
                    value={item.sku}
                    onChange={(e) => updateItem(item.id, 'sku', e.target.value)}
                    placeholder="เช่น SKU-88213"
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none bg-white font-mono"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    required
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    value={item.productName}
                    onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                    placeholder="ชื่อสินค้า เช่น สว่านไฟฟ้า Bosch"
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none bg-white"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    required
                  />
                </div>
                <div className="sm:col-span-1">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                    className="w-full px-2 py-1.5 text-xs border rounded-lg outline-none bg-white text-center font-mono"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    value={item.holdStockNo}
                    onChange={(e) => updateItem(item.id, 'holdStockNo', e.target.value)}
                    placeholder="เช่น HD-99201"
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none bg-white font-mono"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    value={item.symptom}
                    onChange={(e) => updateItem(item.id, 'symptom', e.target.value)}
                    placeholder="อาการเสีย เช่น สตาร์ทไม่ติด"
                    className="w-full px-2.5 py-1.5 text-xs border rounded-lg outline-none bg-white"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                  />
                </div>
                <div className="sm:col-span-1 flex justify-center">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Delivery Channel Radio Cards */}
          <RadioCardGroup
            label="วิธีจัดส่ง"
            value={channel}
            onChange={(v) => setChannel(v as 'DC' | 'DSD')}
            options={[
              { value: 'DC', label: 'DC (ผ่านคลังกลาง)', sublabel: 'รถเที่ยวประจำ DC รวมเที่ยวรถ' },
              { value: 'DSD', label: 'VD (DSD)', sublabel: 'จัดส่งตรงไปยังศูนย์ซ่อม VD' },
            ]}
          />

          {/* Note Info */}
          <div
            className="flex items-start gap-2 p-3.5 rounded-xl text-xs leading-relaxed"
            style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}
          >
            <Package size={16} className="mt-0.5 shrink-0 text-[#185FA5]" />
            <span>
              งานสต็อกสาขาไม่มีค่าดำเนินการ ค่าขนส่ง หรือค่าเปิดเครื่อง และไม่มีขั้นตอนเสนอราคา/อนุมัติ/ชำระเงิน — ข้ามขั้นตอนการเงินทั้งหมด
            </span>
          </div>

          {error && (
            <div
              className="p-3 rounded-xl text-xs flex items-center gap-2"
              style={{ background: 'var(--red-tint)', color: 'var(--red-dark)' }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white text-sm shadow hover:bg-[#9C0C22] transition-colors disabled:opacity-60"
            style={{ background: 'var(--red)' }}
          >
            {loading ? 'กำลังเปิดงาน...' : 'เปิดใบแจ้งซ่อมสต็อกสาขา'}
          </button>
        </div>
      </form>

      {/* History Table */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>
            งานสต็อกสาขาที่เปิดไว้
          </h2>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-[#9A9384]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหา: เลขที่งาน / SKU / VD..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#D2C9B8] rounded-xl outline-none focus:border-[#C8102E]"
            />
          </div>
        </div>

        {historyLoading ? (
          <div className="py-8 text-center text-xs text-[#9A9384]">กำลังโหลดรายการงานสต็อก...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#9A9384]">ยังไม่มีงานสต็อกสาขา</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E4DED2] text-[#6B6459]">
                  <th className="text-left py-2.5 px-3 font-semibold">เลขที่งาน</th>
                  <th className="text-left py-2.5 px-3 font-semibold">รหัส VD</th>
                  <th className="text-left py-2.5 px-3 font-semibold">ชื่อ VD</th>
                  <th className="text-left py-2.5 px-3 font-semibold">ช่องทาง</th>
                  <th className="text-left py-2.5 px-3 font-semibold">สถานะ</th>
                  <th className="text-left py-2.5 px-3 font-semibold">วันที่เปิด</th>
                  <th className="text-left py-2.5 px-3 font-semibold">รายการสินค้า</th>
                  <th className="text-center py-2.5 px-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="border-b border-[#F3EEE6] hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#2B2723]">{job.jobNo}</td>
                    <td className="py-2.5 px-3 font-mono text-[#6B6459]">{job.vendorCenter?.code ?? '-'}</td>
                    <td className="py-2.5 px-3 text-[#2B2723]">{job.vendorCenter?.vendorParent.name ?? '-'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs font-semibold ${
                        job.channel === 'DC' ? 'text-[#185FA5]' : 'text-[#1D9E75]'
                      }`}>
                        {job.channel ?? '-'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <StageBadge stage={job.stage} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-[#6B6459]">
                      {new Date(job.openedAt).toLocaleDateString('th-TH')}
                    </td>
                    <td className="py-2.5 px-3 text-[#2B2723]">
                      {job.items.map((it) => `${it.sku || it.productName} ×${it.quantity}`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPrintJob(job)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium text-[#185FA5] bg-[#E6F1FB] hover:opacity-90 transition-opacity"
                        >
                          <Printer size={12} /> สติ๊กเกอร์
                        </button>
                        {!['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED', 'CANCELLED'].includes(job.stage) && (
                          <button
                            type="button"
                            onClick={() => handleCloseJob(job.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium text-[#1D9E75] bg-[#E1F5EE] hover:opacity-90 transition-opacity"
                          >
                            <CheckCircle2 size={12} /> ปิดงาน
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2x2 inch Sticker Print Modal */}
      {printJob && <StickerModal job={printJob} onClose={() => setPrintJob(null)} />}
    </div>
  )
}
