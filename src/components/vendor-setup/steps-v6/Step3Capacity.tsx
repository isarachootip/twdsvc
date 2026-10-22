'use client'

import React from 'react'
import type { VendorApplicationFormV6 } from '../types-v6'
import { SectionHeader } from '../common/SectionHeader'

interface Step3CapacityProps {
  form: VendorApplicationFormV6
  onChange: (patch: Partial<VendorApplicationFormV6>) => void
}

export function Step3Capacity({ form, onChange }: Step3CapacityProps) {
  return (
    <div className="space-y-5">
      <SectionHeader
        stepNo={3}
        title="ทีมช่างและกำลังการให้บริการ"
        subtitle="ประเมินขีดความสามารถและจำนวนช่างเพื่อรองรับปริมาณงานซ่อมของเครือข่ายไทวัสดุ"
      />

      {/* 3.1 ภาพรวม */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
        <label className="text-xs font-bold text-slate-800">3.1 ภาพรวมทีมช่างทั้งหมด</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-600 mb-1">ช่างประจำทั้งหมด (คน) *</label>
            <input
              type="number"
              min={0}
              value={form.techTotal}
              onChange={e => onChange({ techTotal: Number(e.target.value) || 0 })}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">ช่าง Outsource (คน)</label>
            <input
              type="number"
              min={0}
              value={form.techOut}
              onChange={e => onChange({ techOut: Number(e.target.value) || 0 })}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
            />
          </div>
        </div>
      </div>

      {/* 3.2 On-site ทีมช่าง */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-800">3.2 ขีดความสามารถทีมช่าง On-site</label>
          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">On-site</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-slate-600 mb-1">จำนวนช่าง On-site (คน)</label>
            <input
              type="number"
              min={0}
              value={form.onsTech}
              onChange={e => onChange({ onsTech: Number(e.target.value) || 0 })}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">ทีมที่ออกงานพร้อมกันได้ (ทีม)</label>
            <input
              type="number"
              min={0}
              value={form.onsTeams}
              onChange={e => onChange({ onsTeams: Number(e.target.value) || 0 })}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">ช่าง / ทีมสำรอง (คน)</label>
            <input
              type="number"
              min={0}
              value={form.onsBackup}
              onChange={e => onChange({ onsBackup: Number(e.target.value) || 0 })}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">กำลังรับงานสูงสุด (งาน / วัน)</label>
            <input
              type="number"
              min={0}
              value={form.onsCapDay}
              onChange={e => onChange({ onsCapDay: Number(e.target.value) || 0 })}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-slate-600 mb-1">กำลังรับงานสูงสุด (งาน / เดือน)</label>
            <input
              type="number"
              min={0}
              value={form.onsCapMonth}
              onChange={e => onChange({ onsCapMonth: Number(e.target.value) || 0 })}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
