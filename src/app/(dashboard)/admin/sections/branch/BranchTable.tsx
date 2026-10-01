'use client'

import React, { useState } from 'react'
import { Eye, Edit3, Trash2, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react'
import { SiteDetailItem } from './branch-types'

interface BranchTableProps {
  sites: SiteDetailItem[]
  onSelectSite: (site: SiteDetailItem) => void
  onEditSite: (site: SiteDetailItem) => void
  onDeleteSite: (site: SiteDetailItem) => void
}

export function BranchTable({ sites, onSelectSite, onEditSite, onDeleteSite }: BranchTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  const totalPages = Math.ceil(sites.length / pageSize) || 1
  const displayedSites = sites.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  if (sites.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-base font-medium text-slate-700">ไม่พบข้อมูลสาขาหรือคลังสินค้า</p>
        <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองที่เลือกไว้</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="py-3 px-3.5 w-20">รหัส</th>
              <th className="py-3 px-3.5">ชื่อสาขา / คลัง</th>
              <th className="py-3 px-3 w-24">ประเภท</th>
              <th className="py-3 px-3.5">ภูมิภาค / จังหวัด</th>
              <th className="py-3 px-3.5">ผู้จัดการเขต (DM)</th>
              <th className="py-3 px-3.5">เบอร์ติดต่อสาขา</th>
              <th className="py-3 px-3 text-center w-24">งานค้างซ่อม</th>
              <th className="py-3 px-3 text-center w-24">สถานะ</th>
              <th className="py-3 px-3.5 text-right w-28">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedSites.map(s => (
              <tr
                key={s.id}
                onClick={() => onSelectSite(s)}
                className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-3.5 font-mono font-bold text-slate-800">
                  {s.code}
                </td>
                <td className="py-3 px-3.5">
                  <div className="font-semibold text-slate-900 group-hover:text-red-600 transition-colors">
                    {s.name}
                  </div>
                  {s.address && (
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{s.address}</div>
                  )}
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      s.type === 'BRANCH'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {s.type === 'BRANCH' ? 'สาขา' : 'คลัง DC'}
                  </span>
                </td>
                <td className="py-3 px-3.5">
                  <div className="text-slate-800 font-medium">{s.province}</div>
                  <div className="text-[11px] text-slate-400">{s.region || 'ไม่ได้ระบุภาค'}</div>
                </td>
                <td className="py-3 px-3.5">
                  <span className="text-slate-700">{s.manager || s.districtManager || '-'}</span>
                </td>
                <td className="py-3 px-3.5">
                  <div className="text-slate-800 font-mono">{s.phone || '-'}</div>
                  {s.storeManagerName && (
                    <div className="text-[11px] text-slate-400">ผจก: {s.storeManagerName}</div>
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  {(s.openJobsCount ?? 0) > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {s.openJobsCount} งาน
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-3 px-3 text-center">
                  {s.active ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      ใช้งาน
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      ปิดใช้งาน
                    </span>
                  )}
                </td>
                <td className="py-3 px-3.5 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onSelectSite(s)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                      title="ดูรายละเอียดเชิงลึก"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEditSite(s)}
                      className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                      title="แก้ไขข้อมูลสาขา"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteSite(s)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      title="ปิดการใช้งานสาขา"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
        <div>
          แสดง {(currentPage - 1) * pageSize + 1} ถึง{' '}
          {Math.min(currentPage * pageSize, sites.length)} จากทั้งหมด {sites.length} รายการ
        </div>
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ก่อนหน้า
          </button>
          <span className="px-2 font-medium text-slate-700">
            {currentPage} / {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ถัดไป
          </button>
        </div>
      </div>
    </div>
  )
}
