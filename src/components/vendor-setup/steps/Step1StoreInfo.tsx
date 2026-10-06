'use client'

import React from 'react'
import type { VendorSetupFormData, BranchItemUI } from '../types'
import { BranchCardItem } from './BranchCardItem'
import { Building2, Plus, Info } from 'lucide-react'

interface Step1StoreInfoProps {
  store: VendorSetupFormData['store']
  onUpdateStore: (patch: Partial<VendorSetupFormData['store']>) => void
  onUpdateBranches: (branches: BranchItemUI[]) => void
}

const BUSINESS_TYPES = ['บุคคลธรรมดา', 'ห้างหุ้นส่วนจำกัด', 'บริษัทจำกัด', 'วิสาหกิจชุมชน'] as const

export function Step1StoreInfo({ store, onUpdateStore, onUpdateBranches }: Step1StoreInfoProps) {
  const handleAddBranch = () => {
    if (store.branches.length >= 10) return
    const newId = `b-${Date.now()}`
    const newIdx = store.branches.length + 1
    onUpdateBranches([
      ...store.branches,
      {
        id: newId,
        branchName: `สาขา ${newIdx}`,
        address: '',
        province: 'กรุงเทพมหานคร',
        amphoe: '',
        phone: store.phone,
        photo: null,
        radius: 30,
        vip: false,
        express: false,
      },
    ])
  }

  const handleUpdateBranch = (index: number, patch: Partial<BranchItemUI>) => {
    const updated = store.branches.map((b, i) => (i === index ? { ...b, ...patch } : b))
    onUpdateBranches(updated)
  }

  const handleRemoveBranch = (index: number) => {
    if (store.branches.length <= 1) return
    const updated = store.branches.filter((_, i) => i !== index)
    onUpdateBranches(updated)
  }

  return (
    <div className="space-y-6">
      {/* ข้อมูลบริษัท / ร้านหลัก */}
      <div className="p-5 rounded-2xl border bg-white space-y-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <Building2 className="w-5 h-5" style={{ color: 'var(--red)' }} />
          <h4 className="font-semibold text-base" style={{ color: 'var(--text)' }}>ข้อมูลร้านหลัก / บริษัท</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              ชื่อร้าน / บริษัท <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="inp text-sm"
              placeholder="เช่น ศูนย์ซ่อมแอร์เย็นใจ, บจก. ช่างดีเซอร์วิส"
              value={store.name}
              onChange={e => onUpdateStore({ name: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              ประเภทธุรกิจ <span className="text-red-500">*</span>
            </label>
            <select
              className="inp text-sm"
              value={store.type}
              onChange={e => onUpdateStore({ type: e.target.value as VendorSetupFormData['store']['type'] })}
            >
              <option value="">-- เลือกประเภทธุรกิจ --</option>
              {BUSINESS_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              เลขประจำตัวผู้เสียภาษี (13 หลัก) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              maxLength={13}
              className="inp text-sm"
              placeholder="01055xxxxxxxx"
              value={store.taxId}
              onChange={e => onUpdateStore({ taxId: e.target.value.replace(/\D/g, '') })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                เบอร์โทรหลัก <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className="inp text-sm"
                placeholder="081-xxx-xxxx"
                value={store.phone}
                onChange={e => onUpdateStore({ phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text)' }}>LINE ID</label>
              <input
                type="text"
                className="inp text-sm"
                placeholder="@shopline"
                value={store.lineId}
                onChange={e => onUpdateStore({ lineId: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* สาขา / ที่อยู่ร้าน (สูงสุด 10 สาขา) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
              สาขา / จุดบริการ ({store.branches.length}/10 สาขา)
            </h4>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              ระบุที่อยู่ศูนย์บริการของท่านเพื่อใช้จับคู่กับขนส่ง 3PL และคำนวณพื้นที่บริการ
            </p>
          </div>
          <button
            type="button"
            disabled={store.branches.length >= 10}
            onClick={handleAddBranch}
            className="btn btn-secondary text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> เพิ่มสาขา
          </button>
        </div>

        <div className="space-y-3">
          {store.branches.map((branch, index) => (
            <BranchCardItem
              key={branch.id}
              branch={branch}
              index={index}
              canRemove={store.branches.length > 1}
              onUpdate={patch => handleUpdateBranch(index, patch)}
              onRemove={() => handleRemoveBranch(index)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
