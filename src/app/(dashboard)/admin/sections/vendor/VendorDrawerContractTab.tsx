'use client'

import React from 'react'
import { VendorParentRow } from './vendor-types'

interface VendorDrawerContractTabProps {
  form: VendorParentRow
  onChange: (patch: Partial<VendorParentRow>) => void
}

export function VendorDrawerContractTab({ form, onChange }: VendorDrawerContractTabProps) {
  const rates = form.productRates ?? []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            รหัส VD หลัก <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            className="inp font-mono text-xs w-full"
            placeholder="เช่น 600309"
            value={form.code}
            onChange={e => onChange({ code: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            ชื่อบริษัท / ร้านค้า <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            className="inp text-xs w-full"
            placeholder="ชื่อบริษัทคู่ค้า"
            value={form.name}
            onChange={e => onChange({ name: e.target.value })}
          />
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            checked={!!form.isBrandAuthorized}
            onChange={e => onChange({ isBrandAuthorized: e.target.checked })}
          />
          <div>
            <span className="text-xs font-semibold text-slate-800">
              เป็นศูนย์บริการแต่งตั้งจากแบรนด์ (Authorized Service Center)
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              ระบบจะแสดงสิทธิ์รับซ่อมงานที่มีประกันตรงจากเจ้าของแบรนด์
            </p>
          </div>
        </label>
      </div>

      <div>
        <h4 className="text-xs font-bold text-slate-800 mb-2">เงื่อนไขสัญญา &amp; ค่าบริการเริ่มต้น</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">GP% ส่วนแบ่งเริ่มต้น (%)</label>
            <input
              type="number"
              className="inp text-xs w-full"
              value={form.defaultGpPct}
              onChange={e => onChange({ defaultGpPct: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">SLA งานซ่อมเริ่มต้น (วัน)</label>
            <input
              type="number"
              className="inp text-xs w-full"
              value={form.defaultRepairSlaDays}
              onChange={e => onChange({ defaultRepairSlaDays: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">ค่าเปิดเครื่อง - มีประกัน (บาท)</label>
            <input
              type="number"
              className="inp text-xs w-full"
              value={form.inspectionFeeCovered}
              onChange={e => onChange({ inspectionFeeCovered: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">ค่าเปิดเครื่อง - ไม่มีประกัน (บาท)</label>
            <input
              type="number"
              className="inp text-xs w-full"
              value={form.inspectionFeeNotCovered}
              onChange={e => onChange({ inspectionFeeNotCovered: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-slate-600 mb-1">รับประกันงานซ่อม (วัน)</label>
            <input
              type="number"
              className="inp text-xs w-full"
              value={form.repairWarrantyDays}
              onChange={e => onChange({ repairWarrantyDays: e.target.value })}
            />
          </div>
        </div>
      </div>

      {rates.length > 0 && (
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <h4 className="text-xs font-bold text-slate-800">
            อัตราค่าเปิดเครื่องขั้นต่ำและ GP (%) รายกลุ่มสินค้าตามใบสมัคร
          </h4>
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 font-semibold">รูปแบบบริการ</th>
                  <th className="py-2 px-3 font-semibold">กลุ่มสินค้า</th>
                  <th className="py-2 px-3 font-semibold text-right">ค่าเปิดเครื่องขั้นต่ำ</th>
                  <th className="py-2 px-3 font-semibold text-right">GP (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rates.map(r => (
                  <tr key={r.id}>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          r.serviceType === 'CARRY_IN' ? 'text-red-700' : 'text-sky-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            r.serviceType === 'CARRY_IN' ? 'bg-red-600' : 'bg-sky-600'
                          }`}
                        />
                        {r.serviceType === 'CARRY_IN' ? 'Carry-in' : 'On-site'}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {r.groupName}
                      {r.isCustomGroup && (
                        <span className="ml-2 text-[11px] font-medium text-amber-700">• กลุ่มเพิ่มเติม</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                      ฿{r.minInspectionFee.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-800">{r.gpPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
