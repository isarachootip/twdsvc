'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2, Tag, TrendingUp, BarChart2,
  RefreshCcw, ChevronRight, Camera, Search, X, AlertCircle
} from 'lucide-react'
import { useMe } from '@/components/ui/useMe'
import PhoneInput from '@/components/ui/PhoneInput'
import { formatPhone } from '@/lib/phone-utils'

interface KPIs {
  total: number
  used: number
  conversion: number
}

interface Promo {
  id: string
  name: string
  discountPct: number
}

interface SizeCategory {
  id: number
  code: string
  name: string
}

interface EligibleJob {
  id: string
  jobNo: string
  customerName: string | null
  customerPhone: string | null
  productName: string
  brandName: string
  sizeCategoryId: number | null
  stage: string
  decision: string
}

interface TradeInRecord {
  id: string
  tradeInNo: string
  type: string
  customerName: string
  customerPhone: string
  productName: string
  brandName?: string | null
  discountPct: number
  status: string
  createdAt: string
  promotion?: { name: string } | null
}

const APPLIANCE_TYPES = [
  'เครื่องมือช่างไฟฟ้า (Power Tools)',
  'เครื่องใช้ไฟฟ้าในบ้าน (Home Appliances)',
  'ปั๊มน้ำ / อุปกรณ์สวน (Pumps & Garden)',
  'อุปกรณ์ฮาร์ดแวร์ทั่วไป (Hardware Tools)',
]

export default function TradeInPage() {
  const me = useMe()
  const isAdmin = me?.user?.role === 'ADMIN'
  const [branchFilter, setBranchFilter] = useState('')
  const [siteOptions, setSiteOptions] = useState<Array<{ id: string; name: string }>>([])
  const [kpis, setKpis] = useState<KPIs>({ total: 0, used: 0, conversion: 0 })
  const [selectedType, setSelectedType] = useState<1 | 2>(1)
  const [sizes, setSizes] = useState<SizeCategory[]>([])
  const [history, setHistory] = useState<TradeInRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/sites')
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d)) {
            setSiteOptions(d.filter((s) => s.type === 'BRANCH').map((s) => ({ id: s.id, name: s.name })))
          }
        })
        .catch(() => {})
    }
  }, [isAdmin])

  // Type 1 State
  const [t1FirstName, setT1FirstName] = useState('')
  const [t1LastName, setT1LastName] = useState('')
  const [t1Phone, setT1Phone] = useState('')
  const [foundCustomer, setFoundCustomer] = useState<{ customerName: string; jobCount: number } | null>(null)
  const [t1Sku, setT1Sku] = useState('')
  const [t1Product, setT1Product] = useState('')
  const [t1Brand, setT1Brand] = useState('')
  const [t1Symptom, setT1Symptom] = useState('')
  const [t1ApplianceType, setT1ApplianceType] = useState(APPLIANCE_TYPES[0])
  const [t1SizeId, setT1SizeId] = useState<number | null>(null)
  const [t1ConditionChecks, setT1ConditionChecks] = useState({
    powersOn: false,
    bodyIntact: true,
    completeParts: true,
  })
  const [t1Photos, setT1Photos] = useState<string[]>(['', '', '', ''])

  // Type 2 State
  const [eligibleJobs, setEligibleJobs] = useState<EligibleJob[]>([])
  const [selectedJob, setSelectedJob] = useState<EligibleJob | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [activePromo, setActivePromo] = useState<Promo | null>(null)

  // 1. Load Size Categories (Bug C9 fix: CS can read via /api/size-categories or /api/admin/fees)
  const loadSizes = useCallback(() => {
    fetch('/api/size-categories')
      .then(async (r) => {
        if (!r.ok) {
          // Fallback to /api/admin/fees
          const feeRes = await fetch('/api/admin/fees')
          if (!feeRes.ok) throw new Error('Fees fetch failed')
          const feeData = await feeRes.json()
          return feeData.map((f: { sizeCategory: SizeCategory }) => f.sizeCategory)
        }
        return r.json()
      })
      .then((data: SizeCategory[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setSizes(data)
          setT1SizeId(data[0].id)
        } else {
          setSizes([
            { id: 1, code: 'SMALL', name: 'สินค้าขนาดเล็ก' },
            { id: 2, code: 'LARGE', name: 'สินค้าขนาดใหญ่' },
          ])
          setT1SizeId(1)
        }
      })
      .catch(() => {
        setSizes([
          { id: 1, code: 'SMALL', name: 'สินค้าขนาดเล็ก' },
          { id: 2, code: 'LARGE', name: 'สินค้าขนาดใหญ่' },
        ])
        setT1SizeId(1)
      })
  }, [])

  // 2. Load KPIs and History
  const loadKpisAndHistory = useCallback(() => {
    const qs = branchFilter ? `?branchId=${branchFilter}` : ''
    fetch(`/api/tradein/kpis${qs}`)
      .then((r) => r.json())
      .then(setKpis)
      .catch(() => {})

    setHistoryLoading(true)
    fetch(`/api/tradein${qs}`)
      .then((r) => r.json())
      .then((d) => setHistory(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [branchFilter])

  // 3. Load Type 2 Eligible Jobs (rejected customer jobs)
  const loadEligibleJobs = useCallback(() => {
    const qs = branchFilter ? `&branchId=${branchFilter}` : ''
    fetch(`/api/jobs?limit=50${qs}`)
      .then((r) => r.json())
      .then((d) => {
        const jobs: EligibleJob[] = (d.jobs ?? []).filter(
          (j: EligibleJob) =>
            j.decision === 'REJECTED' ||
            j.stage === 'READY_FOR_PICKUP' ||
            j.stage === 'CLOSED_NOT_REPAIRED'
        )
        setEligibleJobs(jobs)
      })
      .catch(() => {})
  }, [branchFilter])

  useEffect(() => {
    loadSizes()
    loadKpisAndHistory()
    loadEligibleJobs()
  }, [loadSizes, loadKpisAndHistory, loadEligibleJobs])

  // Auto-lookup existing customer when 10 digits entered
  useEffect(() => {
    if (t1Phone.length === 10) {
      const timer = setTimeout(() => {
        fetch(`/api/customers/lookup?phone=${t1Phone}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.customerName) {
              setFoundCustomer(data)
            } else {
              setFoundCustomer(null)
            }
          })
          .catch(() => setFoundCustomer(null))
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setFoundCustomer(null)
    }
  }, [t1Phone])

  const handleUseFoundCustomer = () => {
    if (!foundCustomer) return
    const parts = (foundCustomer.customerName || '').trim().split(/\s+/)
    setT1FirstName(parts[0] || '')
    setT1LastName(parts.slice(1).join(' ') || '')
    setFoundCustomer(null)
  }

  // Update promotion preview based on type and size
  const currentSizeId = selectedType === 1 ? t1SizeId : selectedJob?.sizeCategoryId ?? sizes[0]?.id
  useEffect(() => {
    if (!currentSizeId) return
    const typeStr = selectedType === 1 ? 'TYPE1' : 'TYPE2'
    fetch(`/api/promotions?type=${typeStr}&sizeCategoryId=${currentSizeId}`)
      .then((r) => r.json())
      .then((promo: Promo | null) => {
        if (promo) {
          setActivePromo(promo)
        } else {
          // Default business discount percentage rules if no custom promotion active
          const isLarge = sizes.find((s) => s.id === currentSizeId)?.code === 'LARGE'
          const defaultPct = selectedType === 1 ? (isLarge ? 8 : 10) : (isLarge ? 15 : 12)
          setActivePromo({
            id: '',
            name: selectedType === 1 ? 'โปรโมชั่น Trade-in ประจำเดือน' : 'โปรโมชั่นเปลี่ยนสินค้าซ่อมไม่คุ้ม',
            discountPct: defaultPct,
          })
        }
      })
      .catch(() => {
        setActivePromo({
          id: '',
          name: 'โปรโมชั่นมาตรฐาน',
          discountPct: selectedType === 1 ? 10 : 15,
        })
      })
  }, [selectedType, currentSizeId, sizes])

  // Photo upload handler
  const handlePhotoUpload = async (index: number, file: File | undefined) => {
    if (!file) return
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        // Fallback simulate URL
        const mockUrl = URL.createObjectURL(file)
        const updated = [...t1Photos]
        updated[index] = mockUrl
        setT1Photos(updated)
        return
      }
      const j = await res.json()
      const updated = [...t1Photos]
      updated[index] = j.fileUrl
      setT1Photos(updated)
    } catch {
      const mockUrl = URL.createObjectURL(file)
      const updated = [...t1Photos]
      updated[index] = mockUrl
      setT1Photos(updated)
    }
  }

  // Submit Trade-in Creation
  const handleCreateTradeIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const discountPct = activePromo?.discountPct ?? 10
      let payload: Record<string, unknown> = {}

      if (selectedType === 1) {
        if (!t1FirstName.trim() || !t1Phone.trim() || !t1Product.trim()) {
          alert('กรุณากรอกชื่อลูกค้า เบอร์โทรศัพท์ และชื่อสินค้า')
          setSubmitting(false)
          return
        }
        const fullName = [t1FirstName.trim(), t1LastName.trim()].filter(Boolean).join(' ')
        payload = {
          type: 'TYPE1',
          customerName: fullName,
          customerPhone: t1Phone,
          productName: t1Product,
          brandName: t1Brand || '-',
          sizeCategoryId: t1SizeId,
          symptom: t1Symptom || `ประเภท: ${t1ApplianceType}`,
          discountPct,
          promotionId: activePromo?.id || null,
        }
      } else {
        if (!selectedJob) {
          alert('กรุณาเลือกงานซ่อมที่ลูกค้าไม่อนุมัติ')
          setSubmitting(false)
          return
        }
        payload = {
          type: 'TYPE2',
          jobId: selectedJob.id,
          customerName: selectedJob.customerName || 'ลูกค้า',
          customerPhone: selectedJob.customerPhone || '081-xxx-xxxx',
          productName: selectedJob.productName,
          brandName: selectedJob.brandName || '-',
          sizeCategoryId: selectedJob.sizeCategoryId || sizes[0]?.id,
          symptom: 'ลูกค้าเปลี่ยนใจรับส่วนลดซื้อใหม่ (หลังไม่อนุมัติซ่อม)',
          discountPct,
          promotionId: activePromo?.id || null,
        }
      }

      const res = await fetch('/api/tradein', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'สร้างคูปองไม่สำเร็จ')

      setToast(`สร้างคูปอง ${data.tradeInNo} สำเร็จ — ส่วนลด ${discountPct}% ส่งเข้า Wallet แล้ว`)
      loadKpisAndHistory()

      // Reset form
      if (selectedType === 1) {
        setT1FirstName('')
        setT1LastName('')
        setT1Phone('')
        setFoundCustomer(null)
        setT1Product('')
        setT1Brand('')
        setT1Sku('')
        setT1Symptom('')
        setT1Photos(['', '', '', ''])
      } else {
        setSelectedJob(null)
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างคูปอง')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter history
  const filteredHistory = history.filter((item) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      item.tradeInNo.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.customerPhone.includes(q) ||
      item.productName.toLowerCase().includes(q)
    )
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl text-white text-sm font-medium bg-[#1D9E75] animate-fade-in">
          <CheckCircle2 size={20} />
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="ml-2 hover:opacity-80">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              Trade-in / คูปอง
            </h1>
            <span className="text-xs bg-[#E6F1FB] text-[#185FA5] px-2.5 py-1 rounded-full font-medium">
              สิทธิ์: CS & Admin
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            สร้างคูปองส่วนลดซื้อสินค้าใหม่ให้ลูกค้า — รันเลขที่เอกสารรูปแบบ TI-YYMM-XXXXX
          </p>
        </div>

        {isAdmin && siteOptions.length > 0 && (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#D2C9B8]">
            <span className="text-xs font-semibold text-[#6B6459]">สาขา:</span>
            <select
              className="text-xs outline-none bg-transparent font-medium text-[#2B2723]"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="">ทุกสาขา ({siteOptions.length} สาขา)</option>
              {siteOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="rounded-xl p-3 bg-[#E6F1FB] text-[#185FA5]">
            <Tag size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              {kpis.total}
            </div>
            <div className="text-xs text-[#6B6459]">คูปองที่ออกทั้งหมด</div>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="rounded-xl p-3 bg-[#E1F5EE] text-[#1D9E75]">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              {kpis.used}
            </div>
            <div className="text-xs text-[#6B6459]">ใช้งานแล้ว</div>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="rounded-xl p-3 bg-[#FAEEDA] text-[#BA7517]">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              {kpis.conversion}%
            </div>
            <div className="text-xs text-[#6B6459]">อัตราการใช้คูปอง (Conversion)</div>
          </div>
        </div>
      </div>

      {/* Type Selector Tabs */}
      <div className="space-y-2">
        <label className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          เลือกประเภท Trade-in
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSelectedType(1)}
            className={`text-left p-4 rounded-2xl border-2 transition-all ${
              selectedType === 1
                ? 'border-[#C8102E] bg-[#FBE7E9]'
                : 'border-[#E4DED2] bg-white hover:border-[#D2C9B8]'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-sm text-[#2B2723]">ประเภท 1 — หน้างาน (Walk-in)</h3>
              {selectedType === 1 && <CheckCircle2 size={18} className="text-[#C8102E]" />}
            </div>
            <p className="text-xs text-[#6B6459] leading-relaxed">
              ลูกค้าถือสินค้ามา ประเมินแล้วซ่อมไม่คุ้ม แนะนำซื้อใหม่ทันที ไม่ต้องเปิดใบแจ้งซ่อม
            </p>
          </button>
        </div>
      </div>

      {/* Form Card */}
      <div className="card">
        <form onSubmit={handleCreateTradeIn} className="space-y-4">
          {selectedType === 1 ? (
            /* Type 1 Form */
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-base text-[#2B2723]">สร้าง Trade-in ประเภท 1 — หน้างาน</h3>
                <p className="text-xs text-[#6B6459]">กรอกข้อมูลลูกค้า สินค้า และการประเมินเพื่อสร้างคูปอง</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#2B2723] mb-1">
                    ชื่อลูกค้า <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={t1FirstName}
                    onChange={(e) => setT1FirstName(e.target.value)}
                    placeholder="ชื่อ"
                    className="w-full px-3 py-2 border border-[#D2C9B8] rounded-xl text-sm outline-none focus:border-[#C8102E]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#2B2723] mb-1">
                    นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={t1LastName}
                    onChange={(e) => setT1LastName(e.target.value)}
                    placeholder="นามสกุล"
                    className="w-full px-3 py-2 border border-[#D2C9B8] rounded-xl text-sm outline-none focus:border-[#C8102E]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#2B2723] mb-1">
                    เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                  </label>
                  <PhoneInput
                    value={t1Phone}
                    onChange={setT1Phone}
                    placeholder="08xxxxxxxx"
                    className="w-full px-3 py-2 border border-[#D2C9B8] rounded-xl text-sm outline-none focus:border-[#C8102E]"
                    required
                  />
                </div>
              </div>

              {foundCustomer && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#E6F1FB] border border-[#B5D4F4] text-xs text-[#185FA5]">
                  <span>
                    พบลูกค้าเดิม: <b>{foundCustomer.customerName}</b> ({foundCustomer.jobCount} งาน)
                  </span>
                  <button
                    type="button"
                    onClick={handleUseFoundCustomer}
                    className="px-3 py-1 bg-[#185FA5] text-white rounded-lg hover:bg-[#124b82] transition-colors font-medium cursor-pointer"
                  >
                    ใช้ข้อมูลนี้
                  </button>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#2B2723] mb-1">หมวดหมู่เครื่องใช้</label>
                  <select
                    value={t1ApplianceType}
                    onChange={(e) => setT1ApplianceType(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D2C9B8] rounded-xl text-xs outline-none bg-white focus:border-[#C8102E]"
                  >
                    {APPLIANCE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#2B2723] mb-1">
                    ชื่อสินค้า <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={t1Product}
                    onChange={(e) => setT1Product(e.target.value)}
                    placeholder="เช่น สว่านกระแทกไร้สาย"
                    className="w-full px-3 py-2 border border-[#D2C9B8] rounded-xl text-sm outline-none focus:border-[#C8102E]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#2B2723] mb-1">แบรนด์</label>
                  <input
                    value={t1Brand}
                    onChange={(e) => setT1Brand(e.target.value)}
                    placeholder="เช่น BOSCH, MAKITA"
                    className="w-full px-3 py-2 border border-[#D2C9B8] rounded-xl text-sm outline-none focus:border-[#C8102E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#2B2723] mb-1">ขนาดสินค้า (Size Category)</label>
                  <select
                    value={t1SizeId ?? ''}
                    onChange={(e) => setT1SizeId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-[#D2C9B8] rounded-xl text-sm outline-none bg-white focus:border-[#C8102E]"
                  >
                    {sizes.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#2B2723] mb-1">อาการเสียที่ประเมิน</label>
                  <input
                    value={t1Symptom}
                    onChange={(e) => setT1Symptom(e.target.value)}
                    placeholder="เช่น มอเตอร์ไหม้ ไม่คุ้มค่าซ่อม"
                    className="w-full px-3 py-2 border border-[#D2C9B8] rounded-xl text-sm outline-none focus:border-[#C8102E]"
                  />
                </div>
              </div>

              {/* Working Condition Assessment Checklist */}
              <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E4DED2] space-y-2">
                <span className="text-xs font-bold text-[#2B2723]">รายการตรวจสอบสภาพสินค้าก่อนรับ Trade-in</span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={t1ConditionChecks.powersOn}
                      onChange={(e) => setT1ConditionChecks({ ...t1ConditionChecks, powersOn: e.target.checked })}
                      className="rounded text-[#C8102E]"
                    />
                    <span>เครื่องเปิดติด / มอเตอร์ตอบสนอง</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={t1ConditionChecks.bodyIntact}
                      onChange={(e) => setT1ConditionChecks({ ...t1ConditionChecks, bodyIntact: e.target.checked })}
                      className="rounded text-[#C8102E]"
                    />
                    <span>โครงสร้างภายนอกไม่แตกหักรุนแรง</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={t1ConditionChecks.completeParts}
                      onChange={(e) => setT1ConditionChecks({ ...t1ConditionChecks, completeParts: e.target.checked })}
                      className="rounded text-[#C8102E]"
                    />
                    <span>ชิ้นส่วนหลักครบถ้วน</span>
                  </label>
                </div>
              </div>

              {/* 4 Product Photos Grid */}
              <div>
                <label className="block text-xs font-semibold text-[#2B2723] mb-1.5">
                  ภาพถ่ายสภาพสินค้า (4 ด้าน)
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((idx) => (
                    <label
                      key={idx}
                      className="aspect-square border-2 border-dashed border-[#D2C9B8] rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden relative"
                    >
                      {t1Photos[idx] ? (
                        <img src={t1Photos[idx]} alt={`ภาพ ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center text-[#9A9384] space-y-1">
                          <Camera size={20} className="mx-auto" />
                          <span className="text-[11px] block">📷 ภาพที่ {idx + 1}</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(idx, e.target.files?.[0])}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Type 2 Form */
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-base text-[#2B2723]">สร้าง Trade-in ประเภท 2 — หลังบ้าน</h3>
                <p className="text-xs text-[#6B6459]">เลือกงานซ่อมที่ลูกค้าไม่อนุมัติเพื่อดึงข้อมูลเข้าระบบ Trade-in</p>
              </div>

              {/* Eligible Jobs Picker */}
              <div>
                <label className="block text-xs font-medium text-[#2B2723] mb-2">
                  เลือกงานที่ลูกค้าไม่อนุมัติซ่อม
                </label>
                {eligibleJobs.length === 0 ? (
                  <div className="p-4 border border-[#E4DED2] rounded-xl text-center text-xs text-[#9A9384]">
                    ไม่พบรายการงานซ่อมที่ไม่อนุมัติ
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {eligibleJobs.map((job) => {
                      const isSelected = selectedJob?.id === job.id
                      return (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => setSelectedJob(job)}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-[#C8102E] bg-[#FBE7E9]'
                              : 'border-[#E4DED2] bg-white hover:border-[#D2C9B8]'
                          }`}
                        >
                          <div>
                            <div className="font-mono font-bold text-xs text-[#2B2723]">{job.jobNo}</div>
                            <div className="text-xs text-[#6B6459]">
                              {job.customerName ?? 'ลูกค้า'} ({formatPhone(job.customerPhone)}) — {job.productName} ({job.brandName})
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 size={18} className="text-[#C8102E]" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {selectedJob && (
                <div className="grid grid-cols-3 gap-3 bg-[#FAF7F2] p-3 rounded-xl border border-[#E4DED2] text-xs">
                  <div>
                    <span className="text-[#6B6459]">ลูกค้า:</span>
                    <div className="font-semibold text-[#2B2723]">{selectedJob.customerName || '-'}</div>
                  </div>
                  <div>
                    <span className="text-[#6B6459]">สินค้า:</span>
                    <div className="font-semibold text-[#2B2723]">{selectedJob.productName}</div>
                  </div>
                  <div>
                    <span className="text-[#6B6459]">ขนาด:</span>
                    <div className="font-semibold text-[#2B2723]">
                      {sizes.find((s) => s.id === selectedJob.sizeCategoryId)?.name || 'ขนาดมาตรฐาน'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Promotion & Valuation Preview Box */}
          {activePromo && (
            <div className="bg-[#E6F1FB] border border-[#185FA5] p-3.5 rounded-2xl flex items-center gap-3 text-xs text-[#185FA5]">
              <Tag size={20} className="shrink-0" />
              <div>
                <div className="font-bold">
                  ระบบเลือกโปรโมชั่น "{activePromo.name}" — ส่วนลด {activePromo.discountPct}%
                </div>
                <div className="text-[11px] opacity-85">
                  คูปองจะออกเป็นรหัส TI-YYMM-XXXXX ใช้เป็นส่วนลดซื้อสินค้าใหม่ที่เคาน์เตอร์แคชเชียร์ไทวัสดุ
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || (selectedType === 2 && !selectedJob)}
            className="w-full py-3.5 rounded-xl bg-[#C8102E] text-white font-bold text-sm shadow hover:bg-[#9C0C22] transition-colors disabled:opacity-60"
          >
            {submitting ? 'กำลังสร้างคูปอง...' : `สร้างคูปอง Trade-in ประเภท ${selectedType} (ส่วนลด ${activePromo?.discountPct ?? 10}%)`}
          </button>
        </form>
      </div>

      {/* History Table Card */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 size={18} className="text-[#6B6459]" />
            <h2 className="font-bold text-sm text-[#2B2723]">ประวัติการออกคูปอง Trade-in</h2>
          </div>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-2.5 text-[#9A9384]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหา: เลข TI / ชื่อ / เบอร์โทร..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#D2C9B8] rounded-xl outline-none focus:border-[#C8102E]"
            />
          </div>
        </div>

        {historyLoading ? (
          <div className="py-8 text-center text-xs text-[#9A9384]">กำลังโหลดประวัติ...</div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#9A9384]">ไม่พบรายการคูปอง Trade-in</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#E4DED2] text-[#6B6459]">
                  <th className="text-left py-2.5 px-3 font-semibold">เลขที่ Trade-in</th>
                  <th className="text-left py-2.5 px-3 font-semibold">ประเภท</th>
                  <th className="text-left py-2.5 px-3 font-semibold">ลูกค้า</th>
                  <th className="text-left py-2.5 px-3 font-semibold">เบอร์โทร</th>
                  <th className="text-left py-2.5 px-3 font-semibold">สินค้า</th>
                  <th className="text-left py-2.5 px-3 font-semibold">ส่วนลด</th>
                  <th className="text-left py-2.5 px-3 font-semibold">สถานะ</th>
                  <th className="text-left py-2.5 px-3 font-semibold">วันที่ออก</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="border-b border-[#F3EEE6] hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#2B2723]">{item.tradeInNo}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs font-semibold ${
                        item.type === 'TYPE1' ? 'text-[#185FA5]' : 'text-[#BA7517]'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#2B2723]">{item.customerName}</td>
                    <td className="py-2.5 px-3 font-mono text-[#6B6459]">{formatPhone(item.customerPhone)}</td>
                    <td className="py-2.5 px-3 text-[#2B2723]">{item.productName}</td>
                    <td className="py-2.5 px-3 font-bold text-[#1D9E75]">{item.discountPct}%</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs font-medium ${
                        item.status === 'USED' ? 'text-[#1D9E75]' : 'text-[#6B6459]'
                      }`}>
                        {item.status === 'USED' ? 'ใช้แล้ว' : 'ยังไม่ใช้'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#6B6459]">
                      {new Date(item.createdAt).toLocaleDateString('th-TH')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
