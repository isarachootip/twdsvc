'use client'

import React from 'react'
import { X, Save } from 'lucide-react'
import type { ProductTypeFormDraft } from './product-type-admin.types'

interface ProductTypeFormModalProps {
  draft: ProductTypeFormDraft | null
  saving: boolean
  onChange: (patch: Partial<ProductTypeFormDraft>) => void
  onSave: () => void
  onClose: () => void
}

export function ProductTypeFormModal({
  draft,
  saving,
  onChange,
  onSave,
  onClose,
}: ProductTypeFormModalProps) {
  if (!draft) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {draft.id ? 'แก้ไขประเภทสินค้า (Master)' : 'เพิ่มประเภทสินค้าใหม่ (Master)'}
            </h3>
            <p className="text-xs text-slate-500">
              ใช้แสดงในหน้าสมัครคู่ค้า (Vendor Register) และหน้าเปิดใบแจ้งซ่อม CS
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">รูปแบบบริการ *</label>
            <div className="grid grid-cols-2 gap-2">
              {(['CARRY_IN', 'ON_SITE'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() =>
                    onChange({
                      serviceType: st,
                      ...(!draft.id ? { recommendedFee: st === 'ON_SITE' ? 500 : 300 } : {}),
                    })
                  }
                  className={`btn text-xs justify-center ${
                    draft.serviceType === st ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {st === 'CARRY_IN' ? '2.1 Carry-in (ซ่อมที่ศูนย์)' : '2.2 On-site (เข้าหน้างาน)'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              ชื่อประเภทสินค้า <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              className="inp w-full text-xs"
              placeholder="เช่น เครื่องมือช่าง, เครื่องใช้ไฟฟ้าขนาดเล็ก, ปั๊มน้ำ"
              value={draft.name}
              onChange={e => onChange({ name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ค่าเปิดเครื่องขั้นต่ำ (฿)</label>
              <input
                type="number"
                min={0}
                className="inp w-full text-xs"
                value={draft.minInspectionFee}
                onChange={e => onChange({ minInspectionFee: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ค่าเปิดเครื่องแนะนำ (฿)</label>
              <input
                type="number"
                min={0}
                className="inp w-full text-xs"
                value={draft.recommendedFee}
                onChange={e => onChange({ recommendedFee: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GP ขั้นต่ำ (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.5"
                className="inp w-full text-xs"
                value={draft.minGpPct}
                onChange={e => onChange({ minGpPct: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">GP แนะนำ (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step="0.5"
                className="inp w-full text-xs"
                value={draft.defaultGpPct}
                onChange={e => onChange({ defaultGpPct: Math.max(0, Number(e.target.value) || 0) })}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              คำค้น / หมวดหมู่ SKU ที่ผูกกัน (SKU Dept/Class Mapping)
            </label>
            <textarea
              rows={2}
              className="inp w-full text-xs"
              placeholder="คั่นด้วยจุลภาค เช่น สว่าน, หินเจียร, เลื่อย, power tool"
              value={draft.skuKeywords}
              onChange={e => onChange({ skuKeywords: e.target.value })}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              ระบบใช้คำเหล่านี้จับคู่ประเภทสินค้าให้อัตโนมัติเมื่อพนักงาน CS ค้นหาหรือเลือกรหัส SKU
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center pt-1">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ลำดับการแสดงผล</label>
              <input
                type="number"
                className="inp w-full text-xs"
                value={draft.sortOrder}
                onChange={e => onChange({ sortOrder: Number(e.target.value) || 0 })}
              />
            </div>
            <label className="flex items-center gap-2 pt-5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={e => onChange({ active: e.target.checked })}
                className="accent-red-700 w-4 h-4"
              />
              <span className="font-semibold text-slate-800">เปิดใช้งานในระบบ</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button type="button" onClick={onClose} className="btn btn-secondary text-xs">
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className="btn btn-primary text-xs inline-flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
        </div>
      </div>
    </div>
  )
}
