'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Search, Users, ArrowRight, Plus, Wrench, RefreshCw } from 'lucide-react'
import { api } from '@/lib/client'
import { fmtPhone, fmtDate } from '@/lib/constants'
import type { CustomerSummary } from '@/lib/validations/customer'

interface ApiResponse {
  customers: CustomerSummary[]
  total: number
  page: number
  limit: number
}

export default function CustomerDirectoryView({ role }: { role: string }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ApiResponse>({ customers: [], total: 0, page: 1, limit: 20 })
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const fetchCustomers = (search: string, page = 1) => {
    setLoading(true)
    api<ApiResponse>(`/api/customers?q=${encodeURIComponent(search)}&page=${page}&limit=20`)
      .then(res => setData(res))
      .catch(() => setData({ customers: [], total: 0, page: 1, limit: 20 }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchCustomers('')
  }, [])

  const handleSearchChange = (val: string) => {
    setQuery(val)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      fetchCustomers(val, 1)
    }, 350)
  }

  return (
    <div className="page-wide" style={{ maxWidth: 1180 }}>
      {/* Top Header Row */}
      <div className="toprow mb-5 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border bg-white shadow-sm" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-50 text-red-600">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text)' }}>ข้อมูลลูกค้า (Customer 360°)</h1>
            <p className="text-xs text-gray-500">ค้นหาประวัติการรับบริการ รายการสินค้าที่เคยส่งซ่อม และข้อมูลติดต่อลูกค้า</p>
          </div>
        </div>

        {['CS', 'ADMIN'].includes(role) && (
          <Link
            href="/cs/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
          >
            <Plus size={15} />
            <span>เปิดใบแจ้งซ่อมใหม่</span>
          </Link>
        )}
      </div>

      {/* Search Bar & Summary */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[280px] max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="ค้นหาด้วยเบอร์โทร, ชื่อลูกค้า, หรือ Serial Number..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            style={{ borderColor: 'var(--border)' }}
          />
        </div>
        <div className="text-xs text-gray-500">
          พบทั้งหมด <span className="font-semibold text-gray-800">{data.total.toLocaleString()}</span> รายชื่อ
        </div>
      </div>

      {/* Directory Table / Cards */}
      <div className="rounded-xl border bg-white overflow-hidden shadow-sm" style={{ borderColor: 'var(--border)' }}>
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
            <RefreshCw size={20} className="animate-spin text-gray-400" />
            <span>กำลังโหลดข้อมูลลูกค้า...</span>
          </div>
        ) : data.customers.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            {query ? `ไม่พบข้อมูลลูกค้าที่ตรงกับคำค้นหา "${query}"` : 'ยังไม่มีประวัติลูกค้าในระบบ'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b text-gray-600 font-medium" style={{ borderColor: 'var(--border)' }}>
                <tr>
                  <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                  <th className="py-3 px-4">ชื่อลูกค้า</th>
                  <th className="py-3 px-4 text-center">จำนวนงานซ่อม</th>
                  <th className="py-3 px-4 text-center">สินค้าที่เคยซ่อม</th>
                  <th className="py-3 px-4">เข้ารับบริการล่าสุด</th>
                  <th className="py-3 px-4">สาขาล่าสุด</th>
                  <th className="py-3 px-4 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.customers.map(c => (
                  <tr key={c.phone} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-gray-900">
                      {fmtPhone(c.phone)}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {c.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-700 text-[11px]">
                        {c.jobCount} งาน
                      </span>
                      {c.activeJobCount > 0 && (
                        <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full font-medium bg-amber-50 text-amber-700 text-[10px]">
                          กำลังซ่อม {c.activeJobCount}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <Wrench size={12} className="text-gray-400" />
                        {c.productCount} เครื่อง
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {fmtDate(c.lastVisitedAt)}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {c.lastBranchName || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/customers/${c.phone}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-semibold text-[11px] text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <span>ประวัติ 360°</span>
                        <ArrowRight size={13} />
                      </Link>
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
