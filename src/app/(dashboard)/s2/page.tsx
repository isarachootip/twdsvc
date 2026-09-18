'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, X, Printer, CheckCircle2, ChevronDown, Package } from 'lucide-react'
import StageBadge from '@/components/ui/StageBadge'
import RadioCardGroup from '@/components/ui/RadioCardGroup'
import { JobStage, Channel } from '@prisma/client'

// ─── Types ────────────────────────────────────────────────────────────────────

interface VendorCenter {
  id: string
  code: string
  deliveryMethod: string
  vendorParent: { name: string; code: string }
}

interface StockItem {
  id: string
  sku: string
  productName: string
  quantity: number
  symptom: string
}

interface JobItemRecord {
  id: string
  sku: string | null
  productName: string
  quantity: number
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

// ─── Print Sticker Modal ────────────────────────────────────────────────────

function StickerModal({
  job,
  onClose,
}: {
  job: StockJob
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 no-print">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
              พิมพ์สติ๊กเกอร์สินค้า
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>
              {job.jobNo} — {job.items.length} รายการ
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: 'var(--red)' }}
            >
              <Printer size={16} />
              พิมพ์
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-2)' }}
            >
              <X size={16} />
              ปิด
            </button>
          </div>
        </div>

        {/* Sticker preview (A4 4-col grid) */}
        <div className="overflow-y-auto p-6 flex-1">
          <div id="sticker-print-area" className="grid grid-cols-4 gap-3">
            {job.items.map((item, idx) =>
              Array.from({ length: item.quantity }).map((_, qIdx) => (
                <div
                  key={`${idx}-${qIdx}`}
                  className="border-2 rounded-lg p-2 flex flex-col items-center text-center"
                  style={{
                    width: '144px',
                    height: '144px',
                    borderColor: 'var(--border-strong)',
                    fontSize: '10px',
                  }}
                >
                  <div
                    className="font-bold text-xs mb-1 w-full text-center truncate"
                    style={{ color: 'var(--red)', fontSize: '11px' }}
                  >
                    {job.jobNo}
                  </div>
                  <div
                    className="font-mono text-xs mb-1 truncate w-full"
                    style={{ color: 'var(--text)', fontSize: '10px' }}
                  >
                    SKU: {item.sku ?? '-'}
                  </div>
                  <div
                    className="flex-1 flex items-center justify-center text-center leading-tight"
                    style={{ color: 'var(--text)', fontSize: '10px', overflowWrap: 'break-word' }}
                  >
                    {item.productName}
                  </div>
                  <div
                    className="mt-1 font-medium"
                    style={{ color: 'var(--text-2)', fontSize: '10px' }}
                  >
                    จำนวน: {qIdx + 1}/{item.quantity}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Print-only A4 layout */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #sticker-print-area-wrapper { display: block !important; }
        }
      `}</style>
      <div
        id="sticker-print-area-wrapper"
        style={{ display: 'none' }}
        className="print-only"
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '20px' }}>
          {job.items.map((item, idx) =>
            Array.from({ length: item.quantity }).map((_, qIdx) => (
              <div
                key={`p-${idx}-${qIdx}`}
                style={{
                  width: '144px',
                  height: '144px',
                  border: '2px solid #333',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  fontSize: '10px',
                  fontFamily: 'Sarabun, sans-serif',
                }}
              >
                <div style={{ fontWeight: 700, color: '#C8102E', fontSize: '11px', marginBottom: '4px' }}>
                  {job.jobNo}
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', marginBottom: '4px' }}>
                  SKU: {item.sku ?? '-'}
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.productName}
                </div>
                <div style={{ marginTop: '4px', color: '#6B6459', fontSize: '10px' }}>
                  จำนวน: {qIdx + 1}/{item.quantity}
                </div>
              </div>
            ))
          )}
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
      .then(setCenters)
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
      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
        เลือกศูนย์ซ่อม <span className="text-red-500">*</span>
      </label>
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery('') }}
        className="w-full flex items-center justify-between px-3 py-2.5 border rounded-xl text-sm text-left"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--surface)',
          color: value ? 'var(--text)' : 'var(--text-mute)',
        }}
      >
        <span>
          {value ? `${value.code} — ${value.vendorParent.name}` : 'เลือก VD Center...'}
        </span>
        <ChevronDown size={16} style={{ color: 'var(--text-mute)' }} />
      </button>

      {open && (
        <div
          className="absolute z-20 mt-1 w-full rounded-xl shadow-lg border overflow-hidden"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="p-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหารหัส / ชื่อ VD..."
              className="w-full px-3 py-1.5 text-sm border rounded-lg outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-4 py-3 text-sm text-center" style={{ color: 'var(--text-mute)' }}>
                ไม่พบข้อมูล
              </li>
            )}
            {filtered.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => { onChange(c); setOpen(false) }}
                >
                  <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
                    {c.code}
                  </span>
                  <span style={{ color: 'var(--text)' }}>{c.vendorParent.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function S2Page() {
  const [vendorCenter, setVendorCenter] = useState<VendorCenter | null>(null)
  const [receiverName, setReceiverName] = useState('')
  const [channel, setChannel] = useState<'DC' | 'DSD'>('DC')
  const [items, setItems] = useState<StockItem[]>([
    { id: crypto.randomUUID(), sku: '', productName: '', quantity: 1, symptom: '' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [printJob, setPrintJob] = useState<StockJob | null>(null)

  // History
  const [history, setHistory] = useState<StockJob[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadHistory = useCallback(() => {
    setHistoryLoading(true)
    fetch('/api/jobs?type=STOCK&limit=30')
      .then((r) => r.json())
      .then((d) => setHistory(d.jobs ?? []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), sku: '', productName: '', quantity: 1, symptom: '' },
    ])

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id))

  const updateItem = (id: string, field: keyof Omit<StockItem, 'id'>, val: string | number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: val } : i)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!vendorCenter) { setError('กรุณาเลือกศูนย์ซ่อม'); return }
    if (!receiverName.trim()) { setError('กรุณากรอกชื่อผู้รับเรื่อง'); return }
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
          vendorCenterId: vendorCenter.id,
          receiverName,
          channel,
          items: items.map(({ sku, productName, quantity, symptom }) => ({
            sku, productName, quantity, symptom,
          })),
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'เกิดข้อผิดพลาด')
        return
      }

      const job: StockJob = await res.json()
      setPrintJob(job)

      // Reset form
      setVendorCenter(null)
      setReceiverName('')
      setChannel('DC')
      setItems([{ id: crypto.randomUUID(), sku: '', productName: '', quantity: 1, symptom: '' }])
      loadHistory()
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseJob = async (jobId: string) => {
    if (!confirm('ยืนยันการปิดงานนี้?')) return
    await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CLOSE' }),
    })
    loadHistory()
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          เปิดใบแจ้งซ่อมสต็อก (S2)
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          Stock Branch Repair — งานสต็อกไม่มีขั้นตอนการเงินและใบเสนอราคา
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: VD Info */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: 'var(--red)' }}
            >
              1
            </span>
            <h2 className="font-semibold" style={{ color: 'var(--text)' }}>ข้อมูล VD</h2>
          </div>

          <VendorCombobox value={vendorCenter} onChange={setVendorCenter} />

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
              ผู้รับเรื่อง (VD Contact) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="ชื่อผู้รับเรื่องที่ศูนย์ซ่อม"
              className="w-full px-3 py-2.5 border rounded-xl text-sm outline-none focus:ring-2"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
              }}
            />
          </div>
        </div>

        {/* Section 2: Items */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: 'var(--red)' }}
              >
                2
              </span>
              <h2 className="font-semibold" style={{ color: 'var(--text)' }}>รายการสินค้า</h2>
            </div>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium"
              style={{ color: 'var(--blue)', background: 'var(--blue-tint)' }}
            >
              <Plus size={15} /> เพิ่ม SKU
            </button>
          </div>

          {/* Item rows */}
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="border rounded-xl p-3 space-y-2"
                style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                    รายการที่ {idx + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 rounded-lg hover:bg-red-50 transition-colors"
                      style={{ color: 'var(--coral)' }}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                      SKU *
                    </label>
                    <input
                      value={item.sku}
                      onChange={(e) => updateItem(item.id, 'sku', e.target.value)}
                      placeholder="เช่น AB-12345"
                      className="w-full px-2.5 py-2 border rounded-lg text-sm outline-none focus:ring-1"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                      ชื่อสินค้า *
                    </label>
                    <input
                      value={item.productName}
                      onChange={(e) => updateItem(item.id, 'productName', e.target.value)}
                      placeholder="ชื่อสินค้า"
                      className="w-full px-2.5 py-2 border rounded-lg text-sm outline-none focus:ring-1"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                      จำนวน *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, Number(e.target.value)))}
                      className="w-full px-2.5 py-2 border rounded-lg text-sm outline-none focus:ring-1"
                      style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-2)' }}>
                    อาการ / รายละเอียด
                  </label>
                  <textarea
                    rows={2}
                    value={item.symptom}
                    onChange={(e) => updateItem(item.id, 'symptom', e.target.value)}
                    placeholder="อธิบายอาการหรือปัญหา..."
                    className="w-full px-2.5 py-2 border rounded-lg text-sm outline-none resize-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Channel selector */}
          <RadioCardGroup
            label="ช่องทางขนส่ง"
            value={channel}
            onChange={(v) => setChannel(v as 'DC' | 'DSD')}
            options={[
              { value: 'DC', label: 'DC', sublabel: 'ผ่านศูนย์กระจาย' },
              { value: 'DSD', label: 'DSD', sublabel: 'ส่งตรงสาขา-VD' },
            ]}
          />

          {/* Note */}
          <div
            className="flex items-start gap-2 p-3 rounded-xl text-sm"
            style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}
          >
            <Package size={16} className="mt-0.5 shrink-0" />
            <span>งานสต็อกไม่มีขั้นตอนการเงินและใบเสนอราคา</span>
          </div>

          {/* Error */}
          {error && (
            <div
              className="p-3 rounded-xl text-sm"
              style={{ background: 'var(--red-tint)', color: 'var(--red-dark)' }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-opacity disabled:opacity-60"
            style={{ background: 'var(--red)' }}
          >
            {loading ? 'กำลังบันทึก...' : 'เปิดใบแจ้งซ่อมสต็อก'}
          </button>
        </div>
      </form>

      {/* History Table */}
      <div className="card">
        <h2 className="font-semibold mb-4" style={{ color: 'var(--text)' }}>
          ประวัติงานสต็อก
        </h2>
        {historyLoading ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text-mute)' }}>
            กำลังโหลด...
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: 'var(--text-mute)' }}>
            ยังไม่มีรายการ
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                  {['เลขงาน', 'VD', 'ช่องทาง', 'สถานะ', 'วันที่เปิด', 'รายการสินค้า', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-2.5 px-3 font-medium text-xs"
                        style={{ color: 'var(--text-2)' }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {history.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <td className="py-2.5 px-3 font-mono text-xs font-medium" style={{ color: 'var(--text)' }}>
                      {job.jobNo}
                    </td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text)' }}>
                      {job.vendorCenter
                        ? `${job.vendorCenter.code} (${job.vendorCenter.vendorParent.name})`
                        : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: job.channel === 'DC' ? 'var(--blue-tint)' : 'var(--green-tint)',
                          color: job.channel === 'DC' ? 'var(--blue)' : 'var(--green)',
                        }}
                      >
                        {job.channel ?? '-'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <StageBadge stage={job.stage} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text-2)' }}>
                      {formatDate(job.openedAt)}
                    </td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text-2)' }}>
                      {job.items.length > 0
                        ? `${job.items.length} รายการ (${job.items.reduce((s, i) => s + i.quantity, 0)} ชิ้น)`
                        : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setPrintJob(job)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium"
                          style={{ background: 'var(--blue-tint)', color: 'var(--blue)' }}
                        >
                          <Printer size={12} />
                          สติ๊กเกอร์
                        </button>
                        {!['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED', 'CANCELLED'].includes(job.stage) && (
                          <button
                            onClick={() => handleCloseJob(job.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium"
                            style={{ background: 'var(--green-tint)', color: 'var(--green)' }}
                          >
                            <CheckCircle2 size={12} />
                            ปิดงาน
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

      {/* Sticker Modal */}
      {printJob && <StickerModal job={printJob} onClose={() => setPrintJob(null)} />}
    </div>
  )
}
