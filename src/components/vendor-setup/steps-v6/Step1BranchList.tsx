'use client'

import React from 'react'
import type { CenterBranchItem } from '../types-v6'
import { ThaiAddressInput } from '../common/ThaiAddressInput'
import { Plus, Trash2 } from 'lucide-react'

interface Step1BranchListProps {
  branches: CenterBranchItem[]
  branchType: string
  onChangeBranchType: (type: 'มีศูนย์บริการหลายสาขา' | 'ศูนย์บริการเดียว') => void
  onChangeBranches: (branches: CenterBranchItem[]) => void
}

export function Step1BranchList({
  branches,
  branchType,
  onChangeBranchType,
  onChangeBranches,
}: Step1BranchListProps) {
  const isMulti = branchType === 'มีศูนย์บริการหลายสาขา'

  const addBranch = () => {
    onChangeBranchType('มีศูนย์บริการหลายสาขา')
    onChangeBranches([
      ...branches,
      {
        line1: '',
        subdistrict: '',
        district: '',
        province: '',
        zip: '',
        phone: '',
        contactName: '',
        note: '',
      },
    ])
  }

  const removeBranch = (idx: number) => {
    if (branches.length <= 1) return
    onChangeBranches(branches.filter((_, i) => i !== idx))
  }

  const updateBranch = (idx: number, patch: Partial<CenterBranchItem>) => {
    const updated = [...branches]
    updated[idx] = { ...updated[idx], ...patch }
    onChangeBranches(updated)
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700">1.3 ข้อมูลศูนย์บริการ (ที่ตั้งจริง)</label>
        <div className="flex gap-4 text-xs">
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="branchType"
              checked={!isMulti}
              onChange={() => {
                onChangeBranchType('ศูนย์บริการเดียว')
                if (branches.length > 1) onChangeBranches([branches[0]])
              }}
              className="accent-red-700"
            />
            <span>ศูนย์บริการเดียว</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name="branchType"
              checked={isMulti}
              onChange={() => onChangeBranchType('มีศูนย์บริการหลายสาขา')}
              className="accent-red-700"
            />
            <span>มีศูนย์บริการหลายสาขา</span>
          </label>
        </div>
      </div>

      <div className="space-y-3">
        {branches.map((b, idx) => (
          <div key={idx} className="p-3.5 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span>สาขาที่ {idx + 1}</span>
              {isMulti && branches.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBranch(idx)}
                  className="text-red-700 hover:text-red-800 flex items-center gap-1 text-[11px]"
                >
                  <Trash2 className="w-3.5 h-3.5" /> ลบสาขา
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="md:col-span-2">
                <input
                  type="text"
                  value={b.line1}
                  onChange={e => updateBranch(idx, { line1: e.target.value })}
                  placeholder="บ้านเลขที่ / หมู่ / ซอย / ถนน *"
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <ThaiAddressInput
                  value={{ subdistrict: b.subdistrict, district: b.district, province: b.province, zip: b.zip }}
                  onChange={addr => updateBranch(idx, addr)}
                  placeholder="ค้นหาตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์ *"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={b.contactName}
                  onChange={e => updateBranch(idx, { contactName: e.target.value })}
                  placeholder="ชื่อผู้ดูแลสาขา *"
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
                  required
                />
              </div>
              <div>
                <input
                  type="tel"
                  value={b.phone}
                  onChange={e => updateBranch(idx, { phone: e.target.value })}
                  placeholder="เบอร์โทรสาขา"
                  className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {isMulti && (
        <button
          type="button"
          onClick={addBranch}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
        >
          <Plus className="w-3.5 h-3.5" /> เพิ่มสาขาศูนย์บริการ
        </button>
      )}
    </div>
  )
}
