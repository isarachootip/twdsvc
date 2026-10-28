'use client'

import React from 'react'
import type { VendorApplicationFormV6 } from '../types-v6'
import { SectionHeader } from '../common/SectionHeader'
import { OnsiteLockNotice } from '../common/OnsiteLockNotice'

const DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์', 'วันหยุดนักขัตฤกษ์']
const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '08:30', '09:00', '09:30', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '17:30', '18:00', '19:00', '20:00',
]

interface Step4WorkingHoursProps {
  form: VendorApplicationFormV6
  onChange: (patch: Partial<VendorApplicationFormV6>) => void
}

export function Step4WorkingHours({ form, onChange }: Step4WorkingHoursProps) {
  const hasOnsite = form.onsProducts.length > 0

  const toggleDay = (target: 'cinDays' | 'cinPickDays' | 'onsDays', day: string) => {
    const list = form[target].includes(day)
      ? form[target].filter(d => d !== day)
      : [...form[target], day]
    onChange({ [target]: list })
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        stepNo={4}
        title="วันและเวลาทำการ"
        subtitle="ระบุรอบการเปิดศูนย์บริการและช่วงเวลารับ-ส่งสินค้า เพื่อจัดคิวงานได้อย่างมีประสิทธิภาพ"
      />

      {/* 4.1 Carry-in */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-red-700">4.1 วันและเวลาทำการ Carry-in</label>
          <span className="text-[11px] font-semibold text-red-700">• Carry-in</span>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs text-slate-600 block">วันเปิดรับงานของศูนย์ซ่อม</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {DAYS.map(d => (
              <label key={d} className="inline-flex items-center gap-1.5 p-1.5 border border-slate-100 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.cinDays.includes(d)}
                  onChange={() => toggleDay('cinDays', d)}
                  className="accent-red-700"
                />
                <span>{d}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs pt-1">
          <div>
            <label className="block text-slate-600 mb-1">เวลาเปิดศูนย์ซ่อม</label>
            <select
              value={form.cinOpen}
              onChange={e => onChange({ cinOpen: e.target.value })}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
            >
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-600 mb-1">เวลาปิดศูนย์ซ่อม</label>
            <select
              value={form.cinClose}
              onChange={e => onChange({ cinClose: e.target.value })}
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
            >
              {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <span className="text-xs text-slate-600 block font-semibold">วันที่เข้ารับ-ส่งสินค้าที่สาขา / DC</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {DAYS.map(d => (
              <label key={d} className="inline-flex items-center gap-1.5 p-1.5 border border-slate-100 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.cinPickDays.includes(d)}
                  onChange={() => toggleDay('cinPickDays', d)}
                  className="accent-red-700"
                />
                <span>{d}</span>
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <label className="block text-slate-600 mb-1">ช่วงเวลารับ-ส่ง (เริ่มต้น)</label>
              <select
                value={form.cinPickStart}
                onChange={e => onChange({ cinPickStart: e.target.value })}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
              >
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-600 mb-1">ช่วงเวลารับ-ส่ง (สิ้นสุด)</label>
              <select
                value={form.cinPickEnd}
                onChange={e => onChange({ cinPickEnd: e.target.value })}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
              >
                {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4.2 On-site */}
      <div className={`p-4 rounded-xl border border-slate-200 bg-white space-y-3 ${!hasOnsite ? 'bg-slate-50/60' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-800">4.2 วันและเวลาทำการ On-site</label>
            <span className="text-[11px] font-semibold text-slate-600">• On-site</span>
          </div>
          {!hasOnsite && <OnsiteLockNotice />}
        </div>

        <fieldset disabled={!hasOnsite} className={!hasOnsite ? 'opacity-50 pointer-events-none space-y-3' : 'space-y-3'}>
          <div className="space-y-1.5">
            <span className="text-xs text-slate-600 block">วันที่พร้อมออกให้บริการ</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {DAYS.map(d => (
                <label key={d} className="inline-flex items-center gap-1.5 p-1.5 border border-slate-100 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOnsite && form.onsDays.includes(d)}
                    onChange={() => toggleDay('onsDays', d)}
                    className="accent-red-700"
                  />
                  <span>{d}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div>
              <label className="block text-slate-600 mb-1">เวลาเริ่มออกบริการ</label>
              <input
                type="time"
                value={hasOnsite ? form.onsHours : ''}
                onChange={e => onChange({ onsHours: e.target.value })}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">เวลารับนัดหมาย</label>
              <input
                type="time"
                value={hasOnsite ? form.onsAppt : ''}
                onChange={e => onChange({ onsAppt: e.target.value })}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">นัดหมายเร็วสุด (ชม.)</label>
              <input
                type="number"
                min={0}
                value={hasOnsite ? form.onsFast : 0}
                onChange={e => onChange({ onsFast: Number(e.target.value) || 0 })}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">จำนวนคิวต่อวัน</label>
              <input
                type="number"
                min={0}
                value={hasOnsite ? form.onsQueue : 0}
                onChange={e => onChange({ onsQueue: Number(e.target.value) || 0 })}
                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  )
}
