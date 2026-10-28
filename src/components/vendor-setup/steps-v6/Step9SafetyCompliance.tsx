'use client'

import React, { useState } from 'react'
import type { VendorApplicationFormV6 } from '../types-v6'
import { SectionHeader } from '../common/SectionHeader'
import { OnsiteLockNotice } from '../common/OnsiteLockNotice'
import { Plus, Trash2 } from 'lucide-react'

const SAFETY_OPTIONS = [
  'ตรวจประวัติก่อนรับเข้าทำงาน',
  'แต่งเครื่องแบบ',
  'มีบัตรประจำตัวช่าง',
  'มีประกันอุบัติเหตุช่าง',
  'สวมรองเท้าผ้าใบเข้าบ้านลูกค้า',
]

interface Step9SafetyComplianceProps {
  form: VendorApplicationFormV6
  onChange: (patch: Partial<VendorApplicationFormV6>) => void
}

export function Step9SafetyCompliance({ form, onChange }: Step9SafetyComplianceProps) {
  const hasOnsite = form.onsProducts.length > 0
  const [newTool, setNewTool] = useState('')

  const toggleSafety = (item: string) => {
    const list = form.safetyStandards.includes(item)
      ? form.safetyStandards.filter(s => s !== item)
      : [...form.safetyStandards, item]
    onChange({ safetyStandards: list })
  }

  const addTool = () => {
    if (!hasOnsite || !newTool.trim()) return
    onChange({ onsiteTools: [...form.onsiteTools, newTool.trim()] })
    setNewTool('')
  }

  const removeTool = (idx: number) => {
    if (!hasOnsite) return
    onChange({ onsiteTools: form.onsiteTools.filter((_, i) => i !== idx) })
  }

  const displayedTools = hasOnsite ? form.onsiteTools : []

  return (
    <div className="space-y-5">
      <SectionHeader
        stepNo={9}
        title="การรับประกัน ความรับผิดชอบ และความปลอดภัย"
        subtitle="ข้อกำหนดมาตรฐานความปลอดภัย ภาพลักษณ์ช่าง และความคุ้มครองความเสียหายของทรัพย์สิน"
      />

      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-4 text-xs">
        {/* 9.1 ประกันภัย */}
        <div>
          <label className="block font-bold text-slate-800 mb-1.5">
            9.1 ประกันภัยและความรับผิดชอบเมื่อสินค้าเสียหายหรือสูญหาย *
          </label>
          <div className="space-y-2">
            {[
              'ชดใช้ตามมูลค่าความเสียหายจริง หรือตามวงเงินประกัน',
              'มีประกันภัยคุ้มครองสินค้าและทรัพย์สินบุคคลภายนอก',
              'ยินยอมหักค่าเสียหายจากรอบวางบิลค่าบริการ',
            ].map(liability => (
              <label key={liability} className="flex items-center gap-2 p-2 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="damageLiability"
                  value={liability}
                  checked={form.damageLiability === liability}
                  onChange={e => onChange({ damageLiability: e.target.value })}
                  className="accent-red-700"
                />
                <span>{liability}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 9.2 มาตรฐานช่าง On-site */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <label className="font-bold text-slate-800">
              9.2 มาตรฐานความปลอดภัยและภาพลักษณ์ช่าง On-site
            </label>
            {!hasOnsite && <OnsiteLockNotice />}
          </div>
          <fieldset disabled={!hasOnsite} className={!hasOnsite ? 'opacity-50 pointer-events-none' : ''}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SAFETY_OPTIONS.map(opt => (
                <label key={opt} className="inline-flex items-center gap-2 p-2 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOnsite && form.safetyStandards.includes(opt)}
                    onChange={() => toggleSafety(opt)}
                    className="accent-red-700"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* 9.3 เครื่องมือช่าง */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="font-bold text-slate-800">
              9.3 รายการอุปกรณ์และเครื่องมือช่างสำหรับออกปฏิบัติงาน On-site
            </label>
            {!hasOnsite && <OnsiteLockNotice />}
          </div>
          <fieldset disabled={!hasOnsite} className={!hasOnsite ? 'opacity-50 pointer-events-none space-y-2' : 'space-y-2'}>
            {displayedTools.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {displayedTools.map((t, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-full font-medium">
                    {t}
                    <button type="button" onClick={() => removeTool(idx)} className="hover:text-red-700">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 max-w-sm pt-1">
              <input
                type="text"
                disabled={!hasOnsite}
                value={newTool}
                onChange={e => setNewTool(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTool(); } }}
                placeholder="เช่น สว่านโรตารี่, เกจวัดแรงดัน"
                className="flex-1 h-9 px-3 border border-slate-300 rounded-lg bg-white disabled:bg-slate-100 disabled:text-slate-400"
              />
              <button
                type="button"
                disabled={!hasOnsite}
                onClick={addTool}
                className="px-3 h-9 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 inline-flex items-center gap-1 disabled:opacity-40"
              >
                <Plus className="w-3.5 h-3.5" /> เพิ่ม
              </button>
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  )
}
