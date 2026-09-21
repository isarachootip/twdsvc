'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import {
  Download, RefreshCw, Eye, Send, PlusCircle, Trash2, CheckSquare, Square,
  Building2, Store, Search,
} from 'lucide-react'

interface PayoutRow {
  id: string
  jobId: string
  jobNo: string
  vendorParentId: string
  vd: string
  vdCode: string
  vdName: string
  branchId: string
  branch: string
  store: string
  customer: string | null
  customerName: string
  phone: string | null
  customerPhone: string
  product: string
  productName: string
  brand: string
  brandName: string
  closedDate: string
  // Satang amounts
  amount: number
  repairAmount: number
  repairAmountSatang: number
  gp: number
  gpPct: number
  gpAmount: number
  gpAmountSatang: number
  net: number
  netAmount: number
  netAmountSatang: number
  status: 'PENDING' | 'SENT' | 'PAID'
  batchNo: string | null
}

interface Deduction {
  id: string
  vendorParentId: string
  jobNo?: string
  amount: number // Satang
  reason: string
}

interface VdPaymentResponse {
  from: string
  to: string
  cycles: Array<{ key: string; label: string; from: string; to: string }>
  currentCycle: string | null
  rows: PayoutRow[]
  deductions: Deduction[]
  canViewCost: boolean
}

interface GroupSummary {
  key: string
  label: string
  rows: PayoutRow[]
  totalRepairSatang: number
  gpAmountSatang: number
  netSatang: number
  deductionSatang: number
}

export default function VdPaymentClient({ role }: { role: string }) {
  const { toast, confirm } = useToast()
  const [data, setData] = useState<VdPaymentResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCycle, setSelectedCycle] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'vd' | 'store'>('vd')
  const [showGp, setShowGp] = useState(true)
  const [selectedGroupKeys, setSelectedGroupKeys] = useState<Set<string>>(new Set())
  const [detailGroup, setDetailGroup] = useState<GroupSummary | null>(null)
  const [deductionModalOpen, setDeductionModalOpen] = useState(false)
  const [deductionForm, setDeductionForm] = useState({ vendorParentId: '', amount: '', reason: '', jobNo: '' })
  const [vendorsList, setVendorsList] = useState<Array<{ id: string; code: string; name: string }>>([])
  const [submitting, setSubmitting] = useState(false)

  const isAdmin = role === 'ADMIN'

  const loadData = useCallback(async (f?: string, t?: string) => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (f) q.set('from', f)
      if (t) q.set('to', t)
      const res = await fetch(`/api/reports/vd-payment?${q}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: VdPaymentResponse = await res.json()
      setData(json)
      setDateFrom(json.from)
      setDateTo(json.to)
      setSelectedGroupKeys(new Set())
      if (!f && json.currentCycle) {
        setSelectedCycle(json.currentCycle)
      }
    } catch (e: any) {
      toast(e.message || 'โหลดข้อมูลรายงานไม่สำเร็จ', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/admin/vendors')
        .then(r => (r.ok ? r.json() : []))
        .then(list => {
          if (Array.isArray(list)) {
            setVendorsList(list.map((v: any) => ({ id: v.id, code: v.code, name: v.name })))
          }
        })
        .catch(() => {})
    }
  }, [isAdmin])

  const handleCycleChange = (cycleKey: string) => {
    setSelectedCycle(cycleKey)
    const found = data?.cycles.find(c => c.key === cycleKey)
    if (found) {
      setDateFrom(found.from)
      setDateTo(found.to)
      loadData(found.from, found.to)
    }
  }

  // Filter rows by search
  const filteredRows = useMemo(() => {
    const s = search.trim().toLowerCase()
    return (data?.rows ?? []).filter(r => {
      if (!s) return true
      return [
        r.vd, r.vdCode, r.vdName, r.store, r.branch, r.brand, r.jobNo,
        r.phone ?? '', r.customer ?? '', r.product ?? '',
      ].some(val => val.toLowerCase().includes(s))
    })
  }, [data, search])

  // Group by VD or Store
  const groups: GroupSummary[] = useMemo(() => {
    const map = new Map<string, GroupSummary>()

    for (const r of filteredRows) {
      const key = viewMode === 'vd' ? r.vendorParentId : r.branchId
      const label = viewMode === 'vd' ? `${r.vd} ${r.vdName}` : (r.store || r.branch)
      const g = map.get(key) ?? {
        key,
        label,
        rows: [],
        totalRepairSatang: 0,
        gpAmountSatang: 0,
        netSatang: 0,
        deductionSatang: 0,
      }
      g.rows.push(r)
      g.totalRepairSatang += r.amount
      g.gpAmountSatang += r.gpAmount
      g.netSatang += r.net
      map.set(key, g)
    }

    if (viewMode === 'vd') {
      for (const g of map.values()) {
        g.deductionSatang = (data?.deductions ?? [])
          .filter(d => d.vendorParentId === g.key)
          .reduce((s, d) => s + d.amount, 0)
        g.netSatang = Math.max(0, g.netSatang - g.deductionSatang)
      }
    }

    return [...map.values()].sort((a, b) => b.netSatang - a.netSatang)
  }, [filteredRows, viewMode, data])

  const allGroupPaid = (g: GroupSummary) => g.rows.every(r => r.status !== 'PENDING')
  const payableGroups = groups.filter(g => !allGroupPaid(g))
  const selectedGroups = groups.filter(g => selectedGroupKeys.has(g.key) && !allGroupPaid(g))

  const selectedTotalNetSatang = selectedGroups.reduce((sum, g) => {
    const pendingJobsNet = g.rows.filter(r => r.status === 'PENDING').reduce((a, r) => a + r.net, 0)
    return sum + Math.max(0, pendingJobsNet - g.deductionSatang)
  }, 0)

  const toggleSelectGroup = (key: string) => {
    const next = new Set(selectedGroupKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setSelectedGroupKeys(next)
  }

  const toggleSelectAll = () => {
    if (selectedGroupKeys.size === payableGroups.length) {
      setSelectedGroupKeys(new Set())
    } else {
      setSelectedGroupKeys(new Set(payableGroups.map(g => g.key)))
    }
  }

  const fmtBahtSatang = (satang: number) => {
    const baht = Math.round(satang / 100)
    return `฿${baht.toLocaleString('th-TH')}`
  }

  // Batch Payment Submission
  const handleSendPayment = async () => {
    if (!selectedGroups.length) return
    const countJobs = selectedGroups.flatMap(g => g.rows.filter(r => r.status === 'PENDING')).length

    const confirmed = await confirm({
      title: 'ส่งไปทำจ่ายระบบบัญชี (Payout Batch)',
      message: `ยืนยันส่ง ${selectedGroups.length} กลุ่ม (${countJobs} ใบงาน) รวมสุทธิ ${fmtBahtSatang(selectedTotalNetSatang)} ไปทำจ่าย?\nข้อมูลจะถูกส่งเข้าระบบบัญชีและล็อกสถานะเป็น SENT`,
      okText: 'ส่งไปทำจ่าย',
    })
    if (!confirmed) return

    setSubmitting(true)
    try {
      const jobIds = selectedGroups.flatMap(g =>
        g.rows.filter(r => r.status === 'PENDING').map(r => r.id || r.jobId)
      )
      const res = await fetch('/api/reports/vd-payment/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds,
          periodFrom: dateFrom,
          periodTo: dateTo,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'ส่งทำจ่ายไม่สำเร็จ')
      }

      const resJson = await res.json()
      toast(`ส่งไปทำจ่ายสำเร็จ — ${resJson.batchNo} (${resJson.count} ใบงาน รวม ${fmtBahtSatang(resJson.total)})`, 'success')
      loadData(dateFrom, dateTo)
    } catch (e: any) {
      toast(e.message || 'ส่งทำจ่ายไม่สำเร็จ', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Export to Excel ledger
  const handleExportXlsx = () => {
    if (!filteredRows.length) {
      toast('ไม่มีข้อมูลที่จะส่งออก', 'error')
      return
    }

    const exportRows = filteredRows.map((r, i) => ({
      'ลำดับ': i + 1,
      'เลขที่ใบแจ้งซ่อม': r.jobNo,
      'รหัสศูนย์ซ่อม': r.vdCode || r.vd,
      'ชื่อศูนย์ซ่อม': r.vdName,
      'สาขาที่รับเรื่อง': r.store || r.branch,
      'ชื่อลูกค้า': r.customerName || r.customer || '-',
      'เบอร์โทรศัพท์': r.customerPhone || r.phone || '-',
      'ชื่อสินค้า': r.productName || r.product,
      'แบรนด์': r.brandName || r.brand,
      'วันที่ปิดงาน': r.closedDate,
      'ยอดค่าซ่อม (บาท)': Math.round(r.amount / 100),
      'GP %': `${r.gp}%`,
      'หัก GP (บาท)': Math.round(r.gpAmount / 100),
      'ยอดจ่ายสุทธิ (บาท)': Math.round(r.net / 100),
      'สถานะจ่ายเงิน': r.status === 'PAID' ? 'จ่ายแล้ว' : r.status === 'SENT' ? 'ส่งทำจ่ายแล้ว' : 'รอทำจ่าย',
      'เลขที่ Batch': r.batchNo ?? '-',
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'VD_Payout_Ledger')
    XLSX.writeFile(workbook, `VD_Payout_${dateFrom}_${dateTo}.xlsx`)
    toast('ส่งออกไฟล์ Excel เรียบร้อยแล้ว', 'success')
  }

  // Add Vendor Deduction
  const handleAddDeduction = async () => {
    if (!deductionForm.vendorParentId) {
      toast('กรุณาเลือกศูนย์ซ่อม VD', 'error')
      return
    }
    const amountSatang = Math.round(Number(deductionForm.amount) * 100)
    if (amountSatang <= 0) {
      toast('จำนวนเงินต้องมากกว่า 0', 'error')
      return
    }
    if (!deductionForm.reason.trim()) {
      toast('กรุณาระบุเหตุผลการหักเงิน', 'error')
      return
    }

    try {
      const res = await fetch('/api/reports/vd-payment/deductions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorParentId: deductionForm.vendorParentId,
          amount: amountSatang,
          reason: deductionForm.reason,
          jobNo: deductionForm.jobNo || undefined,
        }),
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.error || 'บันทึกไม่สำเร็จ')
      }

      toast('บันทึกรายการหักเงิน VD แล้ว', 'success')
      setDeductionModalOpen(false)
      setDeductionForm({ vendorParentId: '', amount: '', reason: '', jobNo: '' })
      loadData(dateFrom, dateTo)
    } catch (e: any) {
      toast(e.message, 'error')
    }
  }

  // Delete Deduction
  const handleDeleteDeduction = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/vd-payment/deductions?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')
      toast('ลบรายการหักเงินแล้ว', 'success')
      loadData(dateFrom, dateTo)
    } catch (e: any) {
      toast(e.message, 'error')
    }
  }

  const grandTotalRepairSatang = filteredRows.reduce((s, r) => s + r.amount, 0)
  const grandTotalGpSatang = filteredRows.reduce((s, r) => s + r.gpAmount, 0)
  const grandTotalNetSatang = filteredRows.reduce((s, r) => s + r.net, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
            รายงานรอบจ่ายเงินศูนย์บริการภายนอก (Vendor Payout Report)
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-2)' }}>
            คำนวณยอดปิดงานซ่อม หัก GP% ตามสัญญา และสรุปยอดจ่ายสุทธิรอบบิล
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={() => setDeductionModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700"
            >
              <PlusCircle size={14} className="text-red-600" /> + รายการหักเงิน VD
            </button>
          )}
          <button
            onClick={handleExportXlsx}
            className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700"
          >
            <Download size={14} /> Export Excel (บัญชี)
          </button>
          <button
            onClick={() => loadData(dateFrom, dateTo)}
            className="p-1.5 rounded-lg border text-xs bg-white hover:bg-gray-50 text-gray-700"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter and Cycle bar */}
      <div className="card p-3 flex items-center justify-between flex-wrap gap-3 bg-white">
        <div className="flex items-center gap-2 flex-wrap">
          {data?.cycles && data.cycles.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium">รอบบิล:</span>
              <select
                value={selectedCycle}
                onChange={e => handleCycleChange(e.target.value)}
                className="border rounded-lg px-2.5 py-1 text-xs bg-gray-50 text-gray-800"
              >
                {data.cycles.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-medium">ตั้งแต่วันที่:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="border rounded px-2 py-1 text-xs bg-gray-50"
            />
            <span className="text-xs text-gray-500 font-medium">ถึง:</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="border rounded px-2 py-1 text-xs bg-gray-50"
            />
            <button
              onClick={() => loadData(dateFrom, dateTo)}
              className="btn btn-primary px-3 py-1 text-xs"
            >
              ค้นหา
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหา VD, สาขา, ลูกค้า..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="border rounded-lg pl-8 pr-3 py-1 text-xs w-56"
            />
          </div>

          <div className="flex border rounded-lg overflow-hidden bg-white text-xs">
            <button
              onClick={() => setViewMode('vd')}
              className={`px-3 py-1 font-medium flex items-center gap-1 ${viewMode === 'vd' ? 'bg-red-600 text-white' : 'text-gray-600'}`}
            >
              <Building2 size={12} /> แยกตาม VD
            </button>
            <button
              onClick={() => setViewMode('store')}
              className={`px-3 py-1 font-medium flex items-center gap-1 ${viewMode === 'store' ? 'bg-red-600 text-white' : 'text-gray-600'}`}
            >
              <Store size={12} /> แยกตามสาขา
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="card p-3">
          <div className="text-xs text-gray-500 font-medium">ยอดค่าซ่อมทั้งหมด (ก่อน GP)</div>
          <div className="text-xl font-bold text-gray-900 mt-0.5">
            {fmtBahtSatang(grandTotalRepairSatang)}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">{filteredRows.length} ใบงาน</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-gray-500 font-medium">หักส่วนลด GP รวม</div>
          <div className="text-xl font-bold text-amber-700 mt-0.5">
            -{fmtBahtSatang(grandTotalGpSatang)}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">รายได้ส่วนแบ่งไทวัสดุ</div>
        </div>
        <div className="card p-3">
          <div className="text-xs text-gray-500 font-medium">ยอดจ่ายสุทธิรวม (Net Payable)</div>
          <div className="text-xl font-bold text-green-700 mt-0.5">
            {fmtBahtSatang(grandTotalNetSatang)}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">หลังหัก GP และรายการหักเงิน</div>
        </div>
        <div className="card p-3 bg-red-50/40 border-red-200">
          <div className="text-xs text-red-700 font-medium">ยอดที่เลือกส่งทำจ่าย ({selectedGroups.length} กลุ่ม)</div>
          <div className="text-xl font-bold text-red-700 mt-0.5">
            {fmtBahtSatang(selectedTotalNetSatang)}
          </div>
          {isAdmin && (
            <button
              onClick={handleSendPayment}
              disabled={selectedGroups.length === 0 || submitting}
              className="mt-2 w-full btn btn-primary py-1 text-xs flex items-center justify-center gap-1.5"
            >
              <Send size={12} /> {submitting ? 'กำลังส่ง...' : 'ส่งไปทำจ่าย'}
            </button>
          )}
        </div>
      </div>

      {/* Main Table: Group Summaries */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="text-xs text-gray-600 flex items-center gap-1.5 hover:text-gray-900"
            >
              {selectedGroupKeys.size > 0 && selectedGroupKeys.size === payableGroups.length ? (
                <CheckSquare size={16} className="text-red-600" />
              ) : (
                <Square size={16} className="text-gray-400" />
              )}
              <span>เลือกทั้งหมด ({payableGroups.length} รายการที่รอทำจ่าย)</span>
            </button>
            <span className="text-xs text-gray-400">|</span>
            <label className="text-xs text-gray-600 flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showGp}
                onChange={e => setShowGp(e.target.checked)}
                className="rounded text-red-600"
              />
              <span>แสดงคอลัมน์ GP%</span>
            </label>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            ช่วงเวลา: {dateFrom} ถึง {dateTo}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 text-gray-500 border-b">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3 font-medium">
                  {viewMode === 'vd' ? 'ศูนย์บริการซ่อม (VD)' : 'สาขา (Store)'}
                </th>
                <th className="py-2.5 px-3 font-medium text-center">จำนวนงาน</th>
                <th className="py-2.5 px-3 font-medium text-right">ยอดค่าซ่อม</th>
                {showGp && <th className="py-2.5 px-3 font-medium text-right">หัก GP%</th>}
                {viewMode === 'vd' && <th className="py-2.5 px-3 font-medium text-right">รายการหักเงิน</th>}
                <th className="py-2.5 px-3 font-medium text-right">ยอดจ่ายสุทธิ</th>
                <th className="py-2.5 px-3 font-medium text-center">สถานะ</th>
                <th className="py-2.5 px-3 font-medium text-center w-20">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-700">
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={showGp ? 9 : 8} className="py-6 text-center text-gray-400">
                    {loading ? 'กำลังโหลดข้อมูล...' : 'ไม่พบรายการปิดงานซ่อมในช่วงเวลานี้'}
                  </td>
                </tr>
              ) : (
                groups.map(g => {
                  const isPaid = allGroupPaid(g)
                  const isSelected = selectedGroupKeys.has(g.key)
                  const pendingCount = g.rows.filter(r => r.status === 'PENDING').length

                  return (
                    <tr key={g.key} className={`hover:bg-gray-50 ${isSelected ? 'bg-red-50/30' : ''}`}>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isPaid}
                          checked={isSelected}
                          onChange={() => toggleSelectGroup(g.key)}
                          className="rounded text-red-600"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900">
                        {g.label}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-gray-100 font-medium">
                          {g.rows.length} งาน
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {fmtBahtSatang(g.totalRepairSatang)}
                      </td>
                      {showGp && (
                        <td className="py-2.5 px-3 text-right text-amber-800 font-medium">
                          -{fmtBahtSatang(g.gpAmountSatang)}
                        </td>
                      )}
                      {viewMode === 'vd' && (
                        <td className="py-2.5 px-3 text-right text-red-700 font-medium">
                          {g.deductionSatang > 0 ? `-${fmtBahtSatang(g.deductionSatang)}` : '-'}
                        </td>
                      )}
                      <td className="py-2.5 px-3 text-right font-bold text-green-700">
                        {fmtBahtSatang(g.netSatang)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {isPaid ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                            จ่ายแล้ว
                          </span>
                        ) : pendingCount === g.rows.length ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            รอทำจ่าย ({pendingCount})
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            ส่งแล้ว / รอจ่าย
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setDetailGroup(g)}
                          className="p-1 rounded text-gray-500 hover:text-red-700 hover:bg-gray-100"
                          title="ดูรายละเอียดใบงาน"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Deductions List */}
      {isAdmin && data?.deductions && data.deductions.length > 0 && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900">รายการหักเงิน VD ที่รอนำไปใช้รอบนี้</h3>
            <span className="text-xs text-gray-400">{data.deductions.length} รายการ</span>
          </div>
          <div className="divide-y text-xs">
            {data.deductions.map(d => {
              const vdObj = vendorsList.find(v => v.id === d.vendorParentId)
              return (
                <div key={d.id} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-gray-900">
                      {vdObj ? `${vdObj.code} ${vdObj.name}` : d.vendorParentId}:
                    </span>{' '}
                    <span className="text-gray-600">{d.reason}</span>
                    {d.jobNo && <span className="text-blue-600 ml-1">({d.jobNo})</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-700">-{fmtBahtSatang(d.amount)}</span>
                    <button
                      onClick={() => handleDeleteDeduction(d.id)}
                      className="text-gray-400 hover:text-red-700 p-1"
                      title="ลบรายการหักเงิน"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!detailGroup} onClose={() => setDetailGroup(null)}>
        {detailGroup && (
          <div className="space-y-4 max-w-4xl max-h-[80vh] overflow-y-auto p-1">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-base text-gray-900">{detailGroup.label}</h3>
                <p className="text-xs text-gray-500">
                  รายการใบงานที่ปิดซ่อมสำเร็จ ({detailGroup.rows.length} ใบงาน)
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">ยอดสุทธิกลุ่มนี้</div>
                <div className="text-lg font-bold text-green-700">
                  {fmtBahtSatang(detailGroup.netSatang)}
                </div>
              </div>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 border-b">
                <tr>
                  <th className="py-2 px-2">เลขที่งาน</th>
                  <th className="py-2 px-2">สาขา</th>
                  <th className="py-2 px-2">สินค้า / แบรนด์</th>
                  <th className="py-2 px-2">วันที่ปิด</th>
                  <th className="py-2 px-2 text-right">ค่าซ่อม</th>
                  <th className="py-2 px-2 text-right">GP%</th>
                  <th className="py-2 px-2 text-right">หัก GP</th>
                  <th className="py-2 px-2 text-right">สุทธิ</th>
                  <th className="py-2 px-2 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {detailGroup.rows.map(r => (
                  <tr key={r.id}>
                    <td className="py-2 px-2 font-semibold text-blue-700">{r.jobNo}</td>
                    <td className="py-2 px-2">{r.store || r.branch}</td>
                    <td className="py-2 px-2">{r.productName || r.product} ({r.brandName || r.brand})</td>
                    <td className="py-2 px-2 text-gray-500">{r.closedDate}</td>
                    <td className="py-2 px-2 text-right">{fmtBahtSatang(r.amount)}</td>
                    <td className="py-2 px-2 text-right">{r.gp}%</td>
                    <td className="py-2 px-2 text-right text-amber-800">-{fmtBahtSatang(r.gpAmount)}</td>
                    <td className="py-2 px-2 text-right font-bold text-gray-900">{fmtBahtSatang(r.net)}</td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : r.status === 'SENT'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end pt-2 border-t">
              <button onClick={() => setDetailGroup(null)} className="btn btn-outline text-xs px-4">
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Deduction Modal */}
      <Modal open={deductionModalOpen} onClose={() => setDeductionModalOpen(false)}>
        <div className="space-y-3 p-1">
          <h3 className="font-bold text-base text-gray-900">เพิ่มรายการหักเงิน Vendor (Deduction)</h3>
          <p className="text-xs text-gray-500">
            หักเงินกรณี VD ทำงานผิดพลาด ล่าช้า หรือมีค่าปรับตามเงื่อนไขสัญญา
          </p>
          <div className="space-y-2">
            <div>
              <label className="text-xs font-semibold text-gray-700">เลือกศูนย์บริการ VD</label>
              <select
                value={deductionForm.vendorParentId}
                onChange={e => setDeductionForm({ ...deductionForm, vendorParentId: e.target.value })}
                className="w-full border rounded p-1.5 text-xs bg-white mt-0.5"
              >
                <option value="">-- เลือก VD --</option>
                {vendorsList.map(v => (
                  <option key={v.id} value={v.id}>{v.code} - {v.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">จำนวนเงินหัก (บาท)</label>
              <input
                type="number"
                min="1"
                placeholder="เช่น 500"
                value={deductionForm.amount}
                onChange={e => setDeductionForm({ ...deductionForm, amount: e.target.value })}
                className="w-full border rounded p-1.5 text-xs mt-0.5"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">เลขที่ใบแจ้งซ่อมที่เกี่ยวข้อง (ถ้ามี)</label>
              <input
                type="text"
                placeholder="เช่น JB-2609-001"
                value={deductionForm.jobNo}
                onChange={e => setDeductionForm({ ...deductionForm, jobNo: e.target.value })}
                className="w-full border rounded p-1.5 text-xs mt-0.5"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">เหตุผลการหักเงิน</label>
              <textarea
                rows={2}
                placeholder="ระบุเหตุผล เช่น งานตีกลับเนื่องจากซ่อมไม่ผ่าน SLA เกิน 10 วัน..."
                value={deductionForm.reason}
                onChange={e => setDeductionForm({ ...deductionForm, reason: e.target.value })}
                className="w-full border rounded p-1.5 text-xs mt-0.5"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              onClick={() => setDeductionModalOpen(false)}
              className="btn btn-outline text-xs px-3"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleAddDeduction}
              className="btn btn-primary text-xs px-4"
            >
              บันทึกรายการหักเงิน
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
