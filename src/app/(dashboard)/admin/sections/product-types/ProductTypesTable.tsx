'use client'

import React from 'react'
import { Edit3, Trash2 } from 'lucide-react'
import type { AdminProductTypeRow } from './product-type-admin.types'

interface ProductTypesTableProps {
  rows: AdminProductTypeRow[]
  togglingId: number | null
  onEdit: (row: AdminProductTypeRow) => void
  onToggleActive: (row: AdminProductTypeRow) => void
  onDelete: (row: AdminProductTypeRow) => void
}

export function ProductTypesTable({
  rows,
  togglingId,
  onEdit,
  onToggleActive,
  onDelete,
}: ProductTypesTableProps) {
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-slate-500">
        ไม่พบรายการประเภทสินค้าตามตัวกรองที่เลือก
      </div>
    )
  }

  return (
    <div className="tbl-wrap">
      <table className="tbl compact text-xs">
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>ประเภทสินค้า / คำจับคู่ SKU</th>
            <th>รูปแบบบริการ</th>
            <th className="text-right">ค่าเปิดเครื่อง (ขั้นต่ำ / แนะนำ)</th>
            <th className="text-right">GP% (ขั้นต่ำ / แนะนำ)</th>
            <th className="text-right">Vendor ที่รับ</th>
            <th className="text-right">ใบงานสะสม</th>
            <th>สถานะ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const hasLinks = row.vendorCount > 0 || row.jobCount > 0
            return (
              <tr key={row.id}>
                <td className="text-slate-500 font-mono">{row.sortOrder}</td>
                <td>
                  <div className="font-semibold text-slate-900">{row.name}</div>
                  {row.skuKeywords ? (
                    <div className="text-[11px] text-slate-500 truncate max-w-[280px]" title={row.skuKeywords}>
                      SKU Mapping: {row.skuKeywords}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400">ยังไม่ได้ผูกคำค้น SKU เพิ่มเติม</div>
                  )}
                </td>
                <td>
                  <span
                    className={`inline-flex items-center gap-1.5 font-semibold ${
                      row.serviceType === 'CARRY_IN' ? 'text-red-700' : 'text-sky-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        row.serviceType === 'CARRY_IN' ? 'bg-red-600' : 'bg-sky-600'
                      }`}
                    />
                    {row.serviceType === 'CARRY_IN' ? '2.1 Carry-in' : '2.2 On-site'}
                  </span>
                </td>
                <td className="text-right text-slate-700">
                  ฿{row.minInspectionFee.toLocaleString()} /{' '}
                  <b className="text-slate-900">฿{row.recommendedFee.toLocaleString()}</b>
                </td>
                <td className="text-right text-slate-700">
                  {row.minGpPct}% / <b className="text-slate-900">{row.defaultGpPct}%</b>
                </td>
                <td className="text-right font-semibold text-slate-800">
                  {row.vendorCount.toLocaleString()} ราย
                </td>
                <td className="text-right font-semibold text-slate-800">
                  {row.jobCount.toLocaleString()} งาน
                </td>
                <td>
                  <button
                    type="button"
                    disabled={togglingId === row.id}
                    onClick={() => onToggleActive(row)}
                    className={`inline-flex items-center gap-1.5 font-semibold cursor-pointer bg-transparent border-0 p-0 ${
                      row.active ? 'text-emerald-700 hover:text-emerald-800' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="คลิกเพื่อสลับเปิด/ปิดใช้งาน"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        row.active ? 'bg-emerald-600' : 'bg-slate-400'
                      }`}
                    />
                    {row.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </button>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="btn btn-secondary text-xs py-1 px-2 inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      className={`btn btn-secondary text-xs py-1 px-2 ${
                        hasLinks ? 'text-slate-400' : 'text-rose-600'
                      }`}
                      title={
                        hasLinks
                          ? 'มีคู่ค้าหรือใบงานผูกอยู่ แนะนำให้ปิดใช้งานแทนการลบ'
                          : 'ลบประเภทสินค้า'
                      }
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
