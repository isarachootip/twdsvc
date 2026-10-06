'use client'

import { Eye, Package, CheckCircle2, XCircle } from 'lucide-react'
import type { CommodityItem } from './types'

interface ProductTableProps {
  items: CommodityItem[]
  loading: boolean
  onSelect: (item: CommodityItem) => void
}

function fmtPrice(val: string | number | null | undefined): string {
  if (val === null || val === undefined || val === '') return '-'
  const num = Number(val)
  if (isNaN(num)) return '-'
  return `฿${num.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function ProductTable({ items, loading, onSelect }: ProductTableProps) {
  if (loading) {
    return (
      <div className="bg-white border rounded-xl overflow-hidden shadow-xs" style={{ borderColor: 'var(--border)' }}>
        <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">กำลังค้นหาและดึงข้อมูลสินค้า...</span>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border rounded-xl p-12 text-center shadow-xs" style={{ borderColor: 'var(--border)' }}>
        <Package className="mx-auto text-gray-300 mb-3" size={40} />
        <p className="text-gray-700 font-medium text-base mb-1">ไม่พบข้อมูลสินค้า</p>
        <p className="text-gray-400 text-sm">ลองปรับคำค้นหา หรือเปลี่ยนตัวกรอง Brand / หมวดหมู่</p>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-xs" style={{ borderColor: 'var(--border)' }}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b text-xs text-gray-600 font-semibold uppercase tracking-wider" style={{ borderColor: 'var(--border)' }}>
              <th className="py-3 px-4 w-[140px]">SKU / Barcode</th>
              <th className="py-3 px-4 min-w-[240px]">ชื่อสินค้า (Product Name)</th>
              <th className="py-3 px-4 w-[140px]">แบรนด์ (Brand)</th>
              <th className="py-3 px-4 w-[160px]">หมวดสินค้า (Dept)</th>
              <th className="py-3 px-4 text-right w-[110px]">ราคาขาย</th>
              <th className="py-3 px-4 text-center w-[100px]">สถานะ</th>
              <th className="py-3 px-4 text-center w-[90px]">รายละเอียด</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(p => (
              <tr
                key={p.sku}
                onClick={() => onSelect(p)}
                className="hover:bg-red-50/30 cursor-pointer transition-colors"
              >
                {/* SKU & Barcode */}
                <td className="py-3 px-4 align-top">
                  <div className="font-semibold text-gray-900 font-mono text-[13px]">{p.sku}</div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">{p.barcode || p.ibc || '-'}</div>
                </td>

                {/* Product Name & Model */}
                <td className="py-3 px-4 align-top">
                  <div className="font-medium text-gray-900 leading-snug line-clamp-2">{p.name}</div>
                  {p.model && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      รุ่น: <span className="text-gray-700">{p.model}</span>
                    </div>
                  )}
                </td>

                {/* Brand */}
                <td className="py-3 px-4 align-top">
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded font-medium">
                    {p.brand}
                  </span>
                </td>

                {/* Dept & Class */}
                <td className="py-3 px-4 align-top">
                  <div className="text-xs text-gray-800 font-medium truncate max-w-[150px]">{p.deptName || '-'}</div>
                  {p.className && (
                    <div className="text-[11px] text-gray-500 truncate max-w-[150px] mt-0.5">{p.className}</div>
                  )}
                </td>

                {/* Price */}
                <td className="py-3 px-4 align-top text-right font-medium">
                  <div className="text-gray-900 font-mono">{fmtPrice(p.skuPrice || p.posprice || p.norprice)}</div>
                  {p.unitName && <div className="text-[11px] text-gray-500 font-normal">/{p.unitName}</div>}
                </td>

                {/* Status Badge */}
                <td className="py-3 px-4 align-top text-center">
                  {p.active ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      <CheckCircle2 size={12} />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                      <XCircle size={12} />
                      In-active
                    </span>
                  )}
                </td>

                {/* View Details Button */}
                <td className="py-3 px-4 align-top text-center" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onSelect(p)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                    title="ดูข้อมูลครบ 32 Fields"
                  >
                    <Eye size={13} />
                    <span>ดู</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
