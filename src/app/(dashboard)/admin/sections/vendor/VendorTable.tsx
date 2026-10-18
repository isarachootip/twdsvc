'use client'

import React, { useState } from 'react'
import { Edit3, Trash2, AlertCircle, ChevronLeft, ChevronRight, Store } from 'lucide-react'
import { VendorParentRow, NamedOption } from './vendor-types'

interface VendorTableProps {
  vendors: VendorParentRow[]
  brands: NamedOption[]
  onSelectVendor: (vendor: VendorParentRow) => void
  onDeleteVendor: (vendor: VendorParentRow) => void
}

export function VendorTable({
  vendors,
  brands,
  onSelectVendor,
  onDeleteVendor,
}: VendorTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 15

  const totalPages = Math.ceil(vendors.length / pageSize) || 1
  const displayed = vendors.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  if (vendors.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 shadow-xs">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-base font-medium text-slate-700">ไม่พบคู่ค้าที่ตรงตามเงื่อนไข</p>
        <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองที่เลือกไว้</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <th className="py-3 px-3.5 w-24">รหัส VD</th>
              <th className="py-3 px-3.5">ชื่อบริษัท</th>
              <th className="py-3 px-3 w-36">ประเภทศูนย์</th>
              <th className="py-3 px-3.5">แบรนด์ที่ดูแล</th>
              <th className="py-3 px-3 text-center w-28">ศูนย์บริการย่อย</th>
              <th className="py-3 px-3.5 w-36">เงื่อนไขสัญญา</th>
              <th className="py-3 px-3.5 text-right w-28">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayed.map(v => {
              const brandNames = (v.brandIds || [])
                .map(id => brands.find(b => b.id === id)?.name)
                .filter(Boolean)

              return (
                <tr
                  key={v.id || v.code}
                  onClick={() => onSelectVendor(v)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-3.5 font-mono font-bold text-slate-800">
                    {v.code}
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-slate-900 group-hover:text-red-600 transition-colors">
                      {v.name}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1.5 font-semibold ${
                        v.isBrandAuthorized ? 'text-sky-700' : 'text-slate-600'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          v.isBrandAuthorized ? 'bg-sky-500' : 'bg-slate-400'
                        }`}
                      />
                      {v.isBrandAuthorized ? 'ศูนย์แบรนด์ (Auth)' : 'คู่ค้าทั่วไป'}
                    </span>
                  </td>
                  <td className="py-3 px-3.5">
                    {brandNames.length > 0 ? (
                      <div className="text-slate-700">
                        <span className="font-medium text-slate-900">{brandNames.length} แบรนด์</span>
                        <span className="text-[11px] text-slate-400 ml-1.5 line-clamp-1">
                          ({brandNames.slice(0, 3).join(', ')}
                          {brandNames.length > 3 ? '...' : ''})
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-slate-700 font-mono font-medium">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      {v.centers?.length || 0} ศูนย์
                    </span>
                  </td>
                  <td className="py-3 px-3.5 text-[11px] text-slate-600">
                    <div>GP: <span className="font-semibold text-slate-800">{v.defaultGpPct}%</span></div>
                    <div className="text-slate-400">SLA ซ่อม: {v.defaultRepairSlaDays} วัน</div>
                  </td>
                  <td className="py-3 px-3.5 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onSelectVendor(v)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="ดูรายละเอียดและแก้ไข"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteVendor(v)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="ลบคู่ค้านี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            หน้า {currentPage} จาก {totalPages} (ทั้งหมด {vendors.length} บริษัท)
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
