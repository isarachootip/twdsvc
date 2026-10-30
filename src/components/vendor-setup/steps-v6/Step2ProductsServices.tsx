'use client'

import React from 'react'
import type { VendorApplicationFormV6 } from '../types-v6'
import { SectionHeader } from '../common/SectionHeader'
import { BrandSelectorInput } from '../common/BrandSelectorInput'
import { OnsiteLockNotice } from '../common/OnsiteLockNotice'
import { ProductGroupSelectorCard } from './ProductGroupSelectorCard'
import { ProductGroupRateModal } from './ProductGroupRateModal'
import { useStep2ProductGroups } from './useStep2ProductGroups'
import { Copy } from 'lucide-react'

const RECEIVE_METHODS = [
  'รับสินค้าจากสาขา', 'รับสินค้าจาก DC',
  'รับสินค้าจาก 3PL (คิดค่าใช้จ่ายเพิ่ม)', 'รับสินค้าจากสาขา และ รับสินค้าจาก 3PL',
]

interface Step2ProductsServicesProps {
  form: VendorApplicationFormV6
  onChange: (patch: Partial<VendorApplicationFormV6>) => void
}

export function Step2ProductsServices({ form, onChange }: Step2ProductsServicesProps) {
  const {
    cinNames,
    onsNames,
    rates,
    modalState,
    activeMetaList,
    activeExistingNames,
    openModal,
    closeModal,
    handleToggleCheckbox,
    handleSaveRate,
    removeGroupSelection,
  } = useStep2ProductGroups(form, onChange)

  const hasOnsite = form.onsProducts.length > 0

  return (
    <div className="space-y-5">
      <SectionHeader
        stepNo={2}
        title="ประเภทสินค้าและรูปแบบบริการ"
        subtitle="ติ๊กเลือกกลุ่มสินค้าเพื่อระบุค่าเปิดเครื่องขั้นต่ำและส่วนแบ่ง GP% รายกลุ่มสินค้า หรือกด + เพิ่มกลุ่มสินค้า"
      />

      {/* 2.1 Carry-in */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-red-700">2.1 Carry-in (รับสินค้าจากสาขา / DC มาซ่อมที่ศูนย์)</span>
          <span className="text-[11px] font-semibold text-red-700">• คลิกเลือกเพื่อระบุค่าเปิดเครื่อง &amp; GP</span>
        </div>

        <ProductGroupSelectorCard
          serviceType="CARRY_IN"
          availableNames={cinNames}
          selectedNames={form.cinProducts}
          rates={rates}
          onToggleCheckbox={(name, checked) => handleToggleCheckbox('CARRY_IN', name, checked)}
          onEditGroup={name => openModal('CARRY_IN', name, false)}
          onAddCustomClick={() => openModal('CARRY_IN', '', true)}
        />

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

        <ProductGroupSelectorCard
          serviceType="ON_SITE"
          availableNames={onsNames}
          selectedNames={form.onsProducts}
          rates={rates}
          onToggleCheckbox={(name, checked) => handleToggleCheckbox('ON_SITE', name, checked)}
          onEditGroup={name => openModal('ON_SITE', name, false)}
          onAddCustomClick={() => openModal('ON_SITE', '', true)}
        />

        <fieldset disabled={!hasOnsite} className={!hasOnsite ? 'opacity-50 pointer-events-none space-y-3' : 'space-y-3'}>
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">แบรนด์ที่รับซ่อม (On-site)</label>
              {hasOnsite && form.cinBrands.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange({ onsBrands: [...form.cinBrands] })}
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

      <ProductGroupRateModal
        open={modalState.open}
        serviceType={modalState.serviceType}
        isAddingCustom={modalState.isAddingCustom}
        initialGroupName={modalState.groupName}
        existingRate={rates.find(r => r.serviceType === modalState.serviceType && r.groupName === modalState.groupName)}
        masterMeta={activeMetaList.find(m => m.name === modalState.groupName)}
        existingNames={activeExistingNames}
        onSave={handleSaveRate}
        onRemove={name => removeGroupSelection(modalState.serviceType, name)}
        onClose={closeModal}
      />
    </div>
  )
}
