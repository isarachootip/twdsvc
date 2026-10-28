'use client'

import React from 'react'
import type { VendorApplicationFormV6 } from '../types-v6'
import { SectionHeader } from '../common/SectionHeader'
import { BrandSelectorInput } from '../common/BrandSelectorInput'
import { OnsiteLockNotice } from '../common/OnsiteLockNotice'
import { Copy } from 'lucide-react'

const CIN_PRODUCT_OPTIONS = [
  'เครื่องใช้ไฟฟ้าขนาดเล็ก', 'เครื่องใช้ไฟฟ้าในครัว', 'เครื่องใช้ไฟฟ้าประปา',
  'เครื่องใช้ไฟฟ้าภายในสวน', 'ปั๊มน้ำ', 'ปั๊มน้ำอัตโนมัติ', 'เครื่องมือช่าง',
]

const ONS_PRODUCT_OPTIONS = [
  'ปั๊มน้ำ', 'เครื่องปรับอากาศ', 'เครื่องซักผ้า', 'ตู้เย็น', 'ตู้แช่',
  'ปั๊มน้ำอัตโนมัติ', 'ทีวี', 'เครื่องใช้ไฟฟ้าขนาดใหญ่',
]

const RECEIVE_METHODS = [
  'รับสินค้าจากสาขา', 'รับสินค้าจาก DC',
  'รับสินค้าจาก 3PL (คิดค่าใช้จ่ายเพิ่ม)', 'รับสินค้าจากสาขา และ รับสินค้าจาก 3PL',
]

interface Step2ProductsServicesProps {
  form: VendorApplicationFormV6
  onChange: (patch: Partial<VendorApplicationFormV6>) => void
}

export function Step2ProductsServices({ form, onChange }: Step2ProductsServicesProps) {
  const hasOnsite = form.onsProducts.length > 0

  const toggleCinProduct = (item: string) => {
    const list = form.cinProducts.includes(item)
      ? form.cinProducts.filter(p => p !== item)
      : [...form.cinProducts, item]
    onChange({ cinProducts: list })
  }

  const toggleOnsProduct = (item: string) => {
    const list = form.onsProducts.includes(item)
      ? form.onsProducts.filter(p => p !== item)
      : [...form.onsProducts, item]

    const details = { ...form.productDetails }
    if (!details[item]) {
      details[item] = { repair: true, replacePart: true, install: false }
    }
    onChange({ onsProducts: list, productDetails: details })
  }

  const copyCinBrandsToOns = () => {
    if (!hasOnsite) return
    onChange({ onsBrands: [...form.cinBrands] })
  }

  const toggleTask = (product: string, task: 'repair' | 'replacePart' | 'install') => {
    const details = { ...form.productDetails }
    const current = details[product] || { repair: true, replacePart: true, install: false }
    details[product] = { ...current, [task]: !current[task] }
    onChange({ productDetails: details })
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        stepNo={2}
        title="ประเภทสินค้าและรูปแบบบริการ"
        subtitle="เลือกกลุ่มสินค้าและแบรนด์ที่พร้อมรับซ่อมทั้งรูปแบบศูนย์รับซ่อม (Carry-in) และช่างเข้าบริการ (On-site)"
      />

      {/* 2.1 Carry-in */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-red-700">2.1 Carry-in (รับสินค้าจากสาขา / DC มาซ่อมที่ศูนย์)</span>
          <span className="text-[11px] font-semibold text-red-700">• Carry-in</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {CIN_PRODUCT_OPTIONS.map(prod => (
            <label key={prod} className="inline-flex items-center gap-2 p-2 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.cinProducts.includes(prod)}
                onChange={() => toggleCinProduct(prod)}
                className="accent-red-700"
              />
              <span>{prod}</span>
            </label>
          ))}
        </div>

        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-semibold text-slate-700">แบรนด์ที่รับซ่อม (Carry-in)</label>
          <BrandSelectorInput
            selectedBrands={form.cinBrands}
            onChange={brands => onChange({ cinBrands: brands })}
            placeholder="ค้นหาและเลือกแบรนด์ Carry-in..."
          />
        </div>

        <div className="pt-2">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">วิธีการรับ-ส่งสินค้า Carry-in</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {RECEIVE_METHODS.map(method => (
              <label key={method} className="inline-flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer">
                <input
                  type="radio"
                  name="cinReceiveMethod"
                  value={method}
                  checked={form.cinReceiveMethod === method}
                  onChange={e => onChange({ cinReceiveMethod: e.target.value })}
                  className="accent-red-700"
                />
                <span>{method}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 2.2 On-site */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">2.2 On-site (ช่างเข้าบริการ ณ สถานที่ลูกค้า)</span>
            <span className="text-[11px] font-semibold text-slate-600">• On-site (Optional)</span>
          </div>
          {!hasOnsite && <OnsiteLockNotice />}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {ONS_PRODUCT_OPTIONS.map(prod => (
            <label key={prod} className="inline-flex items-center gap-2 p-2 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={form.onsProducts.includes(prod)}
                onChange={() => toggleOnsProduct(prod)}
                className="accent-red-700"
              />
              <span>{prod}</span>
            </label>
          ))}
        </div>

        <fieldset disabled={!hasOnsite} className={!hasOnsite ? 'opacity-50 pointer-events-none space-y-3' : 'space-y-3'}>
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">แบรนด์ที่รับซ่อม (On-site)</label>
              {hasOnsite && form.cinBrands.length > 0 && (
                <button
                  type="button"
                  onClick={copyCinBrandsToOns}
                  className="text-[11px] text-amber-700 hover:text-amber-800 flex items-center gap-1 font-semibold"
                >
                  <Copy className="w-3 h-3" /> คัดลอกแบรนด์จาก Carry-in
                </button>
              )}
            </div>
            <BrandSelectorInput
              selectedBrands={hasOnsite ? form.onsBrands : []}
              onChange={brands => onChange({ onsBrands: brands })}
              placeholder="ค้นหาและเลือกแบรนด์ On-site..."
              disabled={!hasOnsite}
            />
          </div>

          {/* 2.3 รายละเอียดงาน On-site */}
          {hasOnsite && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-xs font-bold text-slate-800">2.3 งานที่รับทำตามประเภทสินค้า On-site</label>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {form.onsProducts.map(prod => {
                  const item = form.productDetails[prod] || { repair: true, replacePart: true, install: false }
                  return (
                    <div key={prod} className="p-2.5 flex items-center justify-between text-xs bg-slate-50/50">
                      <span className="font-semibold text-slate-800">{prod}</span>
                      <div className="flex items-center gap-4">
                        {(['repair', 'replacePart', 'install'] as const).map(task => (
                          <label key={task} className="inline-flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item[task]}
                              onChange={() => toggleTask(prod, task)}
                              className="accent-red-700"
                            />
                            <span>{task === 'repair' ? 'ซ่อม' : task === 'replacePart' ? 'เปลี่ยนอะไหล่' : 'ติดตั้ง'}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">หมายเหตุ / ข้อจำกัดในการรับงาน</label>
            <textarea
              disabled={!hasOnsite}
              value={hasOnsite ? form.productNote : ''}
              onChange={e => onChange({ productNote: e.target.value })}
              placeholder="เช่น ไม่รับงานเดินท่อภายนอกอาคารสูง, เฉพาะเครื่องปรับอากาศไม่เกิน 24,000 BTU"
              rows={2}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>
        </fieldset>
      </div>
    </div>
  )
}
