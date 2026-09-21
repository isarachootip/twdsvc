'use client'

import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts'
import {
  TrendingUp, TrendingDown, AlertTriangle, ShieldCheck,
  Building2, Users, PieChart as PieIcon, Award, FileText, RefreshCw,
} from 'lucide-react'

/* eslint-disable @typescript-eslint/no-explicit-any */
type ExecData = any

export default function ExecClient() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [data, setData] = useState<ExecData | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const loadData = async (selectedPeriod: string) => {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(`/api/reports/executive?period=${selectedPeriod}`)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const json = await res.json()
      setData(json)
    } catch (e: any) {
      setErr(e.message || 'ไม่สามารถโหลดข้อมูลผู้บริหารได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(period)
  }, [period])

  const fmtBahtSatang = (satang: number | null | undefined) => {
    if (satang == null) return '-'
    const baht = Math.round(satang / 100)
    return `฿${baht.toLocaleString('th-TH')}`
  }

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Executive Summary Dashboard</h1>
          <p className="text-xs" style={{ color: 'var(--text-2)' }}>
            รายงานสรุปผลการดำเนินงานระดับผู้บริหาร (C-Level Executive View) · {data?.periodLabel ?? 'กำลังโหลด...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden bg-white text-xs">
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 font-medium ${period === '7d' ? 'bg-red-600 text-white' : 'text-gray-600'}`}
            >
              7 วัน
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 font-medium ${period === '30d' ? 'bg-red-600 text-white' : 'text-gray-600'}`}
            >
              เดือนนี้
            </button>
            <button
              onClick={() => setPeriod('90d')}
              className={`px-3 py-1.5 font-medium ${period === '90d' ? 'bg-red-600 text-white' : 'text-gray-600'}`}
            >
              ไตรมาสนี้
            </button>
            <button
              onClick={() => setPeriod('1y')}
              className={`px-3 py-1.5 font-medium ${period === '1y' ? 'bg-red-600 text-white' : 'text-gray-600'}`}
            >
              ทั้งปี (YTD)
            </button>
          </div>
          <button
            onClick={() => loadData(period)}
            className="p-1.5 rounded-lg border text-xs bg-white hover:bg-gray-50 text-gray-700"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 bg-white hover:bg-gray-50"
            style={{ borderColor: 'var(--border)' }}
          >
            <FileText size={14} /> พิมพ์รายงาน (PDF)
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
          กำลังประมวลผลข้อมูลระดับผู้บริหาร...
        </div>
      )}

      {data && (
        <>
          {/* Gold-accented Executive Summary Card */}
          <div
            className="card p-4 border-l-4 shadow-sm"
            style={{ borderLeftColor: 'var(--gold)', background: 'var(--surface)' }}
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
              <span>👑 บทวิเคราะห์สรุปผลการดำเนินงานอัตโนมัติ (Executive AI Insights)</span>
            </div>
            <p className="text-sm mt-1.5 text-gray-800 leading-relaxed font-medium">
              {data.summary}
            </p>
          </div>

          {/* Financial KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card p-4">
              <div className="text-xs text-gray-500 font-medium">รายได้ค่าซ่อมรวม (Revenue)</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {fmtBahtSatang(data.fin?.revenue)}
              </div>
              <div className="text-xs text-green-600 font-medium mt-0.5 flex items-center gap-1">
                <TrendingUp size={13} /> {data.fin?.revenueGrowth ?? '+0.0%'} เทียบงวดก่อน
              </div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-gray-500 font-medium">กำไรขั้นต้น (GP ฿)</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {fmtBahtSatang(data.fin?.gp)}
              </div>
              <div className="text-xs text-green-600 font-medium mt-0.5 flex items-center gap-1">
                <TrendingUp size={13} /> {data.fin?.gpGrowth ?? '+0.0%'} เทียบงวดก่อน
              </div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-gray-500 font-medium">อัตรากำไรขั้นต้น (GP %)</div>
              <div className="text-2xl font-bold text-green-700 mt-1">
                {data.fin?.margin ? `${data.fin.margin}%` : '0.0%'}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-0.5">
                เป้าหมายบริษัท: 18.0%
              </div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-gray-500 font-medium">มูลค่าเฉลี่ยต่องาน (Avg Ticket)</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {fmtBahtSatang(data.fin?.avgTicket)}
              </div>
              <div className="text-xs text-green-600 font-medium mt-0.5 flex items-center gap-1">
                <TrendingUp size={13} /> {data.fin?.avgTicketGrowth ?? '+0.0%'}
              </div>
            </div>
          </div>

          {/* Charts Row 1: Finance Trend + Backlog Aging */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="card lg:col-span-8 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900">แนวโน้มรายได้และอัตรากำไรขั้นต้น</h3>
                <span className="text-xs text-gray-400">บาท / % GP</span>
              </div>
              <div className="h-64">
                {data.trend && data.trend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                      <Tooltip formatter={(value: any, name?: any) => (String(name ?? '').includes('GP %') ? [`${value}%`, String(name ?? '')] : [`฿${Number(value).toLocaleString()}`, String(name ?? '')])} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar yAxisId="left" dataKey="revenue" fill="#C8102E" name="รายได้รวม (฿)" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="gp" fill="#BA7517" name="กำไรขั้นต้น (฿)" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="gpPct" stroke="#1D9E75" strokeWidth={2.5} name="GP %" dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">ยังไม่มีข้อมูลแนวโน้มรายได้</div>
                )}
              </div>
            </div>

            <div className="card lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-gray-900">Backlog Aging</h3>
                <span className="text-xs text-gray-400">อายุงานค้างซ่อม</span>
              </div>
              <div className="h-44">
                {data.ops?.backlog && data.ops.backlog.some((b: any) => b.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.ops.backlog}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data.ops.backlog.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`${val} งาน`, 'จำนวน']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">ไม่มีงานค้างซ่อมในระบบ</div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(data.ops?.backlog ?? []).map((b: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 text-gray-600">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                    <span className="truncate">{b.name}: <b>{b.value}</b></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Branch Ranking + Vendor Concentration */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="card lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Building2 size={16} className="text-red-700" />
                  <h3 className="font-bold text-sm text-gray-900">ผลการดำเนินงานแยกตามสาขา (Branch Performance)</h3>
                </div>
                <span className="text-xs text-gray-400">เรียงตามรายได้</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-500 border-b">
                    <tr>
                      <th className="py-2 px-2.5 font-medium">สาขา</th>
                      <th className="py-2 px-2 font-medium text-right">งาน</th>
                      <th className="py-2 px-2 font-medium text-right">รายได้</th>
                      <th className="py-2 px-2 font-medium text-right">SLA %</th>
                      <th className="py-2 px-2 font-medium text-center">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-700">
                    {(data.branches ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-gray-400">ยังไม่มีข้อมูลผลงานสาขาในช่วงนี้</td>
                      </tr>
                    ) : (
                      data.branches.map((b: any, i: number) => (
                        <tr key={i} className={b.top ? 'bg-green-50/40' : b.bottom ? 'bg-red-50/40' : ''}>
                          <td className="py-2.5 px-2.5 font-medium">{b.name}</td>
                          <td className="py-2.5 px-2 text-right">{b.jobs}</td>
                          <td className="py-2.5 px-2 text-right font-semibold text-gray-900">{fmtBahtSatang(b.revenue)}</td>
                          <td className="py-2.5 px-2 text-right font-medium">{b.sla}%</td>
                          <td className="py-2.5 px-2 text-center">
                            {b.top ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                                อันดับ 1
                              </span>
                            ) : b.bottom && data.branches.length > 2 ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                เฝ้าระวัง
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <PieIcon size={16} className="text-amber-700" />
                  <h3 className="font-bold text-sm text-gray-900">Vendor Concentration Risk</h3>
                </div>
                <span className="text-xs text-gray-400">สัดส่วนปริมาณงาน</span>
              </div>
              <div className="h-44">
                {data.vdConcentration && data.vdConcentration.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.vdConcentration}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={65}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {data.vdConcentration.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color || '#C8102E'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`${val}%`, 'สัดส่วน']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-xs">ไม่มีข้อมูล Vendor</div>
                )}
              </div>
              <div className="space-y-1.5">
                {(data.vdConcentration ?? []).map((vd: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: vd.color }} />
                      <span className="text-gray-700 font-medium">{vd.name}</span>
                    </div>
                    <span className="font-bold text-gray-900">{vd.value}%</span>
                  </div>
                ))}
              </div>
              {data.concentrationRisk && (
                <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                  <AlertTriangle size={15} className="flex-shrink-0" />
                  <span>ความเสี่ยงการกระจุกตัวเกิน 60%: ควรพิจารณาขยายเครือข่าย VD ศูนย์ซ่อมเสริม</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Customer Experience Trends */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">Customer Experience & Conversion Trends</h3>
              <span className="text-xs text-gray-400">ความพึงพอใจ, อนุมัติซ่อม, Trade-in</span>
            </div>
            <div className="h-56">
              {data.cx?.trend && data.cx.trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.cx.trend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="approvalPct" stroke="#185FA5" strokeWidth={2} name="อนุมัติซ่อม (%)" />
                    <Line type="monotone" dataKey="tradeinPct" stroke="#BA7517" strokeWidth={2} name="Trade-in Conv. (%)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-xs">ยังไม่มีข้อมูล CX Trend</div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t text-center">
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">CSAT เฉลี่ย</div>
                <div className="text-lg font-bold text-gray-900">{data.cx?.csat ? `${data.cx.csat} / 5.0` : '-'}</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">อัตราอนุมัติซ่อม</div>
                <div className="text-lg font-bold text-blue-700">{data.cx?.approvalRate ?? 0}%</div>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <div className="text-xs text-gray-500">Trade-in Conversion</div>
                <div className="text-lg font-bold text-amber-700">{data.cx?.tradeinConv ?? 0}%</div>
              </div>
            </div>
          </div>

          {/* Attention Items */}
          <div className="card space-y-3">
            <h3 className="font-bold text-sm text-gray-900">ประเด็นที่ต้องพิจารณา (Executive Attention Items)</h3>
            <div className="divide-y text-xs">
              {(data.attention ?? []).length === 0 ? (
                <div className="py-3 text-center text-gray-400">ไม่มีประเด็นที่ต้องติดตามในขณะนี้</div>
              ) : (
                data.attention.map((a: any, i: number) => {
                  const isHigh = a.level === 'HIGH' || a.level === 'high'
                  const isMed = a.level === 'MEDIUM' || a.level === 'medium'
                  return (
                    <div key={i} className="py-2.5 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-gray-900">{a.t}</div>
                        <div className="text-gray-500 mt-0.5">{a.s}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded font-semibold text-[10px] flex-shrink-0 ${
                          isHigh
                            ? 'bg-red-100 text-red-800'
                            : isMed
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {isHigh ? 'ความเสี่ยงสูง' : isMed ? 'ปานกลาง' : 'ติดตาม'}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
