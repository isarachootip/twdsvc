'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ResponsiveContainer, ComposedChart, Bar, Line, LineChart, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Clock, AlertTriangle,
  Award, ShieldAlert, Package, CheckCircle2, RefreshCw, ChevronRight,
} from 'lucide-react'

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnalyticsData = any

const PIPELINE_STAGES = [
  {
    key: 'INTAKE',
    label: 'INTAKE',
    sub: 'รับเครื่องเข้า',
    color: '#C8102E',
    bg: '#FBE7E9',
    stages: 'PENDING_VENDOR_ASSIGNMENT,CS_OPENED,GR_RECEIVED,GR_PACKED,OUTBOUND_TO_DC,AT_DC_OUTBOUND,OUTBOUND_TO_VD,VD_INSPECTING',
  },
  {
    key: 'WAITING_APPROVAL',
    label: 'WAITING APPROVAL',
    sub: 'รอลูกค้าอนุมัติ',
    color: '#BA7517',
    bg: '#FAEEDA',
    stages: 'WAITING_APPROVAL',
  },
  {
    key: 'REPAIR_IN_PROGRESS',
    label: 'REPAIR IN-PROGRESS',
    sub: 'ช่างกำลังซ่อม',
    color: '#7F77DD',
    bg: '#EEEDFE',
    stages: 'REPAIRING',
  },
  {
    key: 'QA_LOGISTICS',
    label: 'QA & LOGISTICS',
    sub: 'ส่งคืนตามสายส่ง',
    color: '#185FA5',
    bg: '#E6F1FB',
    stages: 'RETURN_PACKING,INBOUND_TO_DC,AT_DC_INBOUND,INBOUND_TO_BRANCH,GR_RETURN_RECEIVED',
  },
  {
    key: 'READY_FOR_PICKUP',
    label: 'READY FOR PICKUP',
    sub: 'พร้อมส่งมอบลูกค้า',
    color: '#1D9E75',
    bg: '#E1F5EE',
    stages: 'READY_FOR_PICKUP',
  },
]

export default function AnalyticsClient() {
  const router = useRouter()
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly')
  const [selectedBranch, setSelectedBranch] = useState('ALL')
  const [branches, setBranches] = useState<Array<{ id: string; name: string; nickname?: string }>>([])
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  // Load branches
  useEffect(() => {
    fetch('/api/admin/sites')
      .then(res => (res.ok ? res.json() : []))
      .then(list => {
        if (Array.isArray(list)) {
          setBranches(list.filter((s: any) => s.type === 'BRANCH'))
        }
      })
      .catch(() => {})
  }, [])

  // Load analytics data
  const loadData = async () => {
    setLoading(true)
    setErr(null)
    try {
      const q = new URLSearchParams({ period })
      if (selectedBranch && selectedBranch !== 'ALL') {
        q.set('branchId', selectedBranch)
      }
      const res = await fetch(`/api/reports/overview?${q}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (e: any) {
      setErr(e.message || 'ไม่สามารถโหลดข้อมูล Analytics ได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [period, selectedBranch])

  const fmtBaht = (n: number | null | undefined) => {
    if (n == null) return '-'
    const baht = Math.round(Number(n))
    return `฿${baht.toLocaleString('th-TH')}`
  }

  const fmtSatang = (satang: number | null | undefined) => {
    if (satang == null) return '-'
    const baht = Math.round(Number(satang) / 100)
    return `฿${baht.toLocaleString('th-TH')}`
  }

  return (
    <div className="space-y-4">
      {/* Top row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Dashboard Overview</h1>
          <p className="text-xs" style={{ color: 'var(--text-2)' }}>
            ภาพรวมการดำเนินงานศูนย์บริการซ่อมสินค้า — {data?.periodLabel ?? 'อัปเดตล่าสุดวันนี้'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedBranch}
            onChange={e => setSelectedBranch(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-xs bg-white text-gray-700"
          >
            <option value="ALL">ทุกสาขา (All Branches)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <div className="flex border rounded-lg overflow-hidden bg-white text-xs">
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 font-medium ${period === 'weekly' ? 'bg-red-600 text-white' : 'text-gray-600'}`}
            >
              รายสัปดาห์
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 font-medium ${period === 'monthly' ? 'bg-red-600 text-white' : 'text-gray-600'}`}
            >
              รายเดือน
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`px-3 py-1.5 font-medium ${period === 'yearly' ? 'bg-red-600 text-white' : 'text-gray-600'}`}
            >
              รายปี
            </button>
          </div>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg border text-xs bg-white hover:bg-gray-50 text-gray-700"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {err && (
        <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          เกิดข้อผิดพลาด: {err}
        </div>
      )}

      {loading && !data && (
        <div className="card p-8 text-center text-gray-500 text-sm">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-red-600" />
          กำลังประมวลผลข้อมูลการดำเนินงาน...
        </div>
      )}

      {data && (
        <>
          {/* 4 Sparkline / Gradient Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card p-4 bg-gradient-to-b from-red-50/50 to-red-100/30 border-red-200">
              <div className="text-xs text-gray-500 font-medium">งานทั้งหมดในระบบ (ACTIVE JOBS)</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{data.kpi?.active ?? 0} งาน</div>
              <div className="text-xs text-green-700 font-medium mt-0.5 flex items-center gap-1">
                <TrendingUp size={13} /> {data.kpi?.activeTrend ?? '-'}
              </div>
              <div className="h-9 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(data.spark?.in ?? []).map((v: number) => ({ v }))}>
                    <Area type="monotone" dataKey="v" stroke="#C8102E" fill="#C8102E" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card p-4 bg-gradient-to-b from-amber-50/50 to-amber-100/30 border-amber-200">
              <div className="text-xs text-gray-500 font-medium">รอลูกค้าอนุมัติราคา (PENDING APPROVAL)</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{data.kpi?.pending ?? 0} งาน</div>
              <div className="text-xs text-amber-700 font-medium mt-0.5 flex items-center gap-1">
                <Clock size={13} /> {data.kpi?.pending > 0 ? '⚠ ต้องติดตามใบเสนอราคา' : '✓ ไม่มีงานค้าง'}
              </div>
              <div className="h-9 mt-2 flex items-center">
                <div className="w-full bg-amber-100 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, ((data.kpi?.pending ?? 0) / Math.max(1, data.kpi?.active ?? 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="card p-4 bg-gradient-to-b from-red-50/70 to-red-100/50 border-red-300">
              <div className="text-xs text-gray-500 font-medium">งานเกิน SLA วิกฤติ (SLA CRITICAL)</div>
              <div className="text-2xl font-bold text-red-700 mt-1">{data.kpi?.slaCritical ?? 0} งาน</div>
              <div className="text-xs text-red-700 font-medium mt-0.5 flex items-center gap-1">
                <AlertTriangle size={13} /> {data.kpi?.slaCritical > 0 ? 'เร่งดำเนินการแก้ไขด่วน' : '✓ อยู่ในเกณฑ์ปกติ'}
              </div>
              <div className="h-9 mt-2 flex items-center">
                <div className="w-full bg-red-100 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, ((data.kpi?.slaCritical ?? 0) / Math.max(1, data.kpi?.active ?? 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="card p-4 bg-gradient-to-b from-green-50/50 to-green-100/30 border-green-200">
              <div className="text-xs text-gray-500 font-medium">กำไรขั้นต้น (GROSS PROFIT)</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {data.kpi?.profit != null ? fmtSatang(data.kpi.profit) : 'ไม่เปิดเผย'}
              </div>
              <div className="text-xs text-green-700 font-medium mt-0.5 flex items-center gap-1">
                <TrendingUp size={13} /> {data.kpi?.profitTrend ?? '-'}
              </div>
              <div className="h-9 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(data.spark?.revenue ?? []).map((v: number) => ({ v }))}>
                    <Area type="monotone" dataKey="v" stroke="#1D9E75" fill="#1D9E75" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Operational Pipeline Tracker */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">
                Operational Pipeline (งานซ่อมตามสายกระบวนการ 5 ขั้นตอน)
              </h3>
              <span className="text-xs text-gray-400">คลิกที่แต่ละขั้นตอนเพื่อดูรายการงาน</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {PIPELINE_STAGES.map((s, idx) => {
                const count = data.pipeline ? (data.pipeline[s.key] ?? 0) : 0
                return (
                  <button
                    key={s.key}
                    onClick={() => router.push(`/jobs?stages=${s.stages}`)}
                    className="p-3 rounded-xl border text-center transition-all hover:shadow-md hover:scale-[1.02] flex flex-col items-center justify-center cursor-pointer"
                    style={{ backgroundColor: s.bg, borderColor: `${s.color}30` }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-extrabold mb-1"
                      style={{ backgroundColor: '#ffffff', color: s.color }}
                    >
                      {count}
                    </div>
                    <div className="text-[11px] font-bold" style={{ color: s.color }}>
                      {idx + 1}. {s.label}
                    </div>
                    <div className="text-[10px] text-gray-600 font-medium">
                      {s.sub}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Row 1: Finance Chart + Daily Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="card lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900">แนวโน้มรายได้และต้นทุนดำเนินงาน</h3>
                <span className="text-xs text-gray-400">บาท</span>
              </div>
              <div className="h-64">
                {data.financeData && data.financeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.financeData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => [`฿${Number(v).toLocaleString()}`, '']} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="revenue" fill="#185FA5" name="รายได้รวม (฿)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cost" fill="#6B6459" name="ต้นทุน (฿)" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="profit" stroke="#1D9E75" strokeWidth={2.5} name="กำไรขั้นต้น (฿)" dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">ไม่มีสิทธิ์ดูข้อมูลต้นทุน/การเงิน</div>
                )}
              </div>
            </div>

            <div className="card lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900">ปริมาณงานซ่อมรับเข้า vs ปิดงาน</h3>
                <span className="text-xs text-gray-400">จำนวนงาน</span>
              </div>
              <div className="h-64">
                {data.trendData && data.trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="jobs" stroke="#C8102E" strokeWidth={2.5} name="รับเข้า (งาน)" dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="done" stroke="#1D9E75" strokeWidth={2} name="ปิดงาน (งาน)" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">ยังไม่มีข้อมูลแนวโน้มงาน</div>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: GP Breakdown + Waiting Parts Alert */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="card lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900">สัดส่วนกำไรขั้นต้น (GP Breakdown)</h3>
                <span className="text-xs text-gray-400">แยกตามหมวด</span>
              </div>
              <div className="h-48">
                {data.gpBreakdown && data.gpBreakdown.some((b: any) => b.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.gpBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data.gpBreakdown.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => [`฿${Number(v).toLocaleString()}`, 'มูลค่า']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">ไม่มีข้อมูลสัดส่วนกำไร</div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {(data.gpBreakdown ?? []).map((b: any, i: number) => (
                  <div key={i} className="p-2 bg-gray-50 rounded">
                    <div className="flex items-center justify-center gap-1 text-gray-600 mb-0.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                      <span>{b.name}</span>
                    </div>
                    <div className="font-bold text-gray-900">{fmtBaht(b.value)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Package size={16} className="text-amber-700" />
                  <h3 className="font-bold text-sm text-gray-900">งานที่อยู่ระหว่างรออะไหล่ซ่อม (Waiting Parts)</h3>
                </div>
                <span className="text-xs text-amber-700 font-semibold">{(data.waitingParts ?? []).length} รายการ</span>
              </div>
              <div className="overflow-x-auto max-h-56 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 border-b sticky top-0">
                    <tr>
                      <th className="py-2 px-2.5 font-medium">เลขที่งาน</th>
                      <th className="py-2 px-2 font-medium">สินค้า</th>
                      <th className="py-2 px-2 font-medium">อะไหล่ที่รอ</th>
                      <th className="py-2 px-2 font-medium text-right">รอมาแล้ว</th>
                      <th className="py-2 px-2 font-medium text-right">มูลค่างาน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-700">
                    {(data.waitingParts ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-gray-400">ไม่มีงานค้างรออะไหล่ในขณะนี้</td>
                      </tr>
                    ) : (
                      data.waitingParts.map((w: any) => (
                        <tr key={w.id} className="hover:bg-gray-50">
                          <td className="py-2 px-2.5 font-semibold text-blue-700">
                            <Link href={`/jobs/${w.id}`}>{w.jobNo}</Link>
                          </td>
                          <td className="py-2 px-2 max-w-[150px] truncate">{w.productName}</td>
                          <td className="py-2 px-2 text-amber-800 font-medium">{w.parts || w.partName}</td>
                          <td className="py-2 px-2 text-right">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              {w.waitingDays} วัน
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-medium">{fmtSatang(w.quoteTotal)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Row 3: SLA Violations Alert Table */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-red-700" />
                <h3 className="font-bold text-sm text-gray-900">งานที่เกินกำหนด SLA วิกฤติ (SLA Violations Tracker)</h3>
              </div>
              <span className="text-xs text-red-700 font-semibold">{(data.slaViolations ?? []).length} รายการ</span>
            </div>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 border-b sticky top-0">
                  <tr>
                    <th className="py-2 px-2.5 font-medium">เลขที่งาน</th>
                    <th className="py-2 px-2 font-medium">ลูกค้า</th>
                    <th className="py-2 px-2 font-medium">สาขา / ศูนย์ซ่อม</th>
                    <th className="py-2 px-2 font-medium">ขั้นตอนที่ติด</th>
                    <th className="py-2 px-2 font-medium">ผู้รับผิดชอบ</th>
                    <th className="py-2 px-2 font-medium text-right">เกินเวลา</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {(data.slaViolations ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-gray-400">✓ ไม่มีงานที่เกินกำหนด SLA ในขณะนี้</td>
                    </tr>
                  ) : (
                    data.slaViolations.map((v: any) => (
                      <tr key={v.id} className="hover:bg-red-50/40">
                        <td className="py-2 px-2.5 font-semibold text-red-700">
                          <Link href={`/jobs/${v.id}`}>{v.jobNo}</Link>
                        </td>
                        <td className="py-2 px-2">{v.customerName ?? '-'}</td>
                        <td className="py-2 px-2">{v.place}</td>
                        <td className="py-2 px-2 font-medium">{v.stepName}</td>
                        <td className="py-2 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800">
                            {v.owner}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                            +{v.overHours} ชม.
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Row 4: Vendor Performance Rankings */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Award size={16} className="text-red-700" />
                <h3 className="font-bold text-sm text-gray-900">อันดับผลงานศูนย์บริการซ่อมภายนอก (Vendor Rankings)</h3>
              </div>
              <div className="text-xs text-gray-500">
                SLA เฉลี่ย: <b>{data.vdSummary?.avgSla ?? 0}%</b> · ส่งมอบตรงเวลา: <b>{data.vdSummary?.avgOnTime ?? 0}%</b>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-500 border-b">
                  <tr>
                    <th className="py-2 px-2.5 font-medium">อันดับ</th>
                    <th className="py-2 px-2 font-medium">ศูนย์บริการ (VD)</th>
                    <th className="py-2 px-2 font-medium text-right">จำนวนงาน</th>
                    <th className="py-2 px-2 font-medium text-right">มูลค่ารวม</th>
                    <th className="py-2 px-2 font-medium text-right">ส่งมอบตรงเวลา</th>
                    <th className="py-2 px-2 font-medium text-right">SLA Compliance</th>
                    <th className="py-2 px-2 font-medium text-right">ล่าช้าเฉลี่ย</th>
                    <th className="py-2 px-2 font-medium text-center">CSAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {(data.vdRanking ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-gray-400">ยังไม่มีข้อมูลผลงานศูนย์บริการ</td>
                    </tr>
                  ) : (
                    data.vdRanking.map((v: any, idx: number) => (
                      <tr key={idx} className={v.top ? 'bg-green-50/40' : v.bottom ? 'bg-red-50/40' : ''}>
                        <td className="py-2 px-2.5 font-bold text-gray-900">
                          {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : idx + 1}
                        </td>
                        <td className="py-2 px-2 font-medium">{v.name || v.vd}</td>
                        <td className="py-2 px-2 text-right">{v.jobs} งาน</td>
                        <td className="py-2 px-2 text-right font-semibold text-gray-900">{fmtSatang(v.revenue)}</td>
                        <td className="py-2 px-2 text-right font-medium text-green-700">{v.onTimePct}%</td>
                        <td className="py-2 px-2 text-right font-medium">{v.slaPct}%</td>
                        <td className="py-2 px-2 text-right text-gray-500">{v.avgOverdueHours} ชม.</td>
                        <td className="py-2 px-2 text-center font-bold text-amber-700">★ {v.csat}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions matching prototype */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/cs/new"
              className="card p-3 flex items-center justify-between hover:border-red-600 transition-colors group cursor-pointer"
            >
              <div>
                <div className="font-bold text-xs text-gray-900 group-hover:text-red-600">CS เปิดงานใหม่</div>
                <div className="text-[10px] text-gray-500">รับเครื่องซ่อมจากลูกค้า</div>
              </div>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-red-600" />
            </Link>
            <Link
              href="/jobs"
              className="card p-3 flex items-center justify-between hover:border-red-600 transition-colors group cursor-pointer"
            >
              <div>
                <div className="font-bold text-xs text-gray-900 group-hover:text-red-600">งานซ่อมทั้งหมด</div>
                <div className="text-[10px] text-gray-500">ค้นหาและติดตามสถานะ</div>
              </div>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-red-600" />
            </Link>
            <Link
              href="/vd"
              className="card p-3 flex items-center justify-between hover:border-red-600 transition-colors group cursor-pointer"
            >
              <div>
                <div className="font-bold text-xs text-gray-900 group-hover:text-red-600">คิวงานช่าง VD</div>
                <div className="text-[10px] text-gray-500">ตรวจสอบและเสนอราคา</div>
              </div>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-red-600" />
            </Link>
            <Link
              href="/reports/vd-payment"
              className="card p-3 flex items-center justify-between hover:border-red-600 transition-colors group cursor-pointer"
            >
              <div>
                <div className="font-bold text-xs text-gray-900 group-hover:text-red-600">รายงานจ่ายเงิน VD</div>
                <div className="text-[10px] text-gray-500">รอบจ่ายเงินและหัก GP</div>
              </div>
              <ChevronRight size={16} className="text-gray-400 group-hover:text-red-600" />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
