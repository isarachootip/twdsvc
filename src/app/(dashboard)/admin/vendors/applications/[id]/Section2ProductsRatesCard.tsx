'use client'

import React, { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import type { ProductGroupRateConfig } from '@/lib/validations/vendor-product-group.schema'
import type { NormalizedVendorApplication } from '@/lib/vendor-application-types'
import { SectionCard, InfoItem, InlineDotList } from './DetailFieldHelpers'

interface Section2ProductsRatesCardProps {
  s2: NormalizedVendorApplication['section2']
}

export function Section2ProductsRatesCard({ s2 }: Section2ProductsRatesCardProps) {
  const [promotedKeys, setPromotedKeys] = useState<Record<string, boolean>>({})
  const [promotingKey, setPromotingKey] = useState<string | null>(null)
  const { toast } = useToast()

  const handlePromoteToMaster = async (rate: ProductGroupRateConfig) => {
    const key = `${rate.serviceType}:${rate.groupName}`
    setPromotingKey(key)
    try {
      await api('/api/admin/vendor-product-groups', {
        method: 'POST',
        body: {
          action: 'PROMOTE',
          serviceType: rate.serviceType,
          name: rate.groupName,
          recommendedFee: rate.minInspectionFee,
          defaultGpPct: rate.gpPct,
        },
      })
      setPromotedKeys(prev => ({ ...prev, [key]: true }))
      toast(`เพิ่มกลุ่ม "${rate.groupName}" เข้า Master กลางเรียบร้อยแล้ว`, 'success')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'เพิ่มเข้า Master ไม่สำเร็จ', 'error')
    } finally {
      setPromotingKey(null)
    }
  }

  return (
    <SectionCard
      stepNo={2}
      title="ประเภทสินค้า รูปแบบบริการ และอัตราค่าเปิดเครื่อง / GP รายกลุ่ม"
      subtitle="กลุ่มสินค้า แบรนด์ที่รับซ่อม วิธีรับ-ส่งสินค้า และตารางค่าเปิดเครื่องขั้นต่ำพร้อมส่วนแบ่ง GP (%)"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2.5 p-3 rounded-lg bg-slate-50/70 border border-slate-100">
          <span className="font-bold text-red-700 block">2.1 บริการ Carry-in (รับมาซ่อมที่ศูนย์)</span>
          <div>
            <span className="text-[11px] text-slate-500 block mb-1">กลุ่มสินค้า Carry-in ({s2.cinProducts.length})</span>
            <InlineDotList items={s2.cinProducts} dotColorClass="bg-red-600" textColorClass="text-slate-800" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block mb-1">
              แบรนด์ที่รับซ่อม Carry-in ({s2.cinAllBrands ? 'ทุกแบรนด์' : s2.cinBrands.length})
            </span>
            {s2.cinAllBrands ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                รับซ่อมทุกแบรนด์ (ไม่จำกัดแบรนด์)
              </span>
            ) : (
              <InlineDotList items={s2.cinBrands} dotColorClass="bg-slate-400" textColorClass="text-slate-700" />
            )}
          </div>
          <InfoItem label="วิธีการรับ-ส่งสินค้า Carry-in" value={s2.cinReceiveMethod} />
        </div>

        <div className="space-y-2.5 p-3 rounded-lg bg-slate-50/70 border border-slate-100">
          <span className="font-bold text-sky-700 block">2.2 บริการ On-site (เข้าซ่อม ณ สถานที่ลูกค้า)</span>
          <div>
            <span className="text-[11px] text-slate-500 block mb-1">กลุ่มสินค้า On-site ({s2.onsProducts.length})</span>
            <InlineDotList
              items={s2.onsProducts}
              dotColorClass="bg-sky-600"
              textColorClass="text-slate-800"
              emptyText="ไม่ได้เลือกรับงาน On-site"
            />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block mb-1">
              แบรนด์ที่รับซ่อม On-site ({s2.onsAllBrands ? 'ทุกแบรนด์' : s2.onsBrands.length})
            </span>
            {s2.onsAllBrands ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                รับซ่อมทุกแบรนด์ (ไม่จำกัดแบรนด์)
              </span>
            ) : (
              <InlineDotList items={s2.onsBrands} dotColorClass="bg-slate-400" textColorClass="text-slate-700" />
            )}
          </div>
          <InfoItem label="หมายเหตุ / ข้อจำกัดในการรับงาน" value={s2.productNote} />
        </div>
      </div>

      {/* ตารางอัตราค่าเปิดเครื่องและ GP */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <h4 className="font-bold text-slate-800">
          ตารางอัตราค่าเปิดเครื่องขั้นต่ำและ GP (%) รายกลุ่มสินค้า ({s2.productGroupRates.length} รายการ)
        </h4>
        {s2.productGroupRates.length === 0 ? (
          <p className="text-slate-400">ไม่มีข้อมูลอัตราค่าเปิดเครื่องรายกลุ่มสินค้า</p>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 font-semibold">บริการ</th>
                  <th className="py-2 px-3 font-semibold">กลุ่มสินค้า</th>
                  <th className="py-2 px-3 font-semibold">ขอบเขตงาน</th>
                  <th className="py-2 px-3 font-semibold text-right">ค่าเปิดเครื่อง</th>
                  <th className="py-2 px-3 font-semibold text-right">GP (%)</th>
                  <th className="py-2 px-3 font-semibold text-right no-print">จัดการ Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {s2.productGroupRates.map(r => {
                  const key = `${r.serviceType}:${r.groupName}`
                  const isPromoted = Boolean(promotedKeys[key])
                  const tasks = r.tasks || s2.productDetails[r.groupName]
                  const taskLabels = [
                    tasks?.repair !== false ? 'ซ่อม' : null,
                    tasks?.replacePart !== false ? 'เปลี่ยนอะไหล่' : null,
                    tasks?.install ? 'ติดตั้ง' : null,
                  ].filter(Boolean)

                  return (
                    <tr key={key}>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 font-semibold ${
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
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {r.groupName}
                        {r.isCustomGroup && (
                          <span className="ml-2 text-[11px] font-semibold text-amber-700">• กลุ่มเพิ่มเติม</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-600">{taskLabels.join(', ') || '-'}</td>
                      <td className="py-2 px-3 text-right font-semibold text-emerald-700">
                        ฿{r.minInspectionFee.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900">{r.gpPct}%</td>
                      <td className="py-2 px-3 text-right no-print">
                        {r.isCustomGroup ? (
                          isPromoted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <Check className="w-3 h-3" /> อยู่ใน Master แล้ว
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={promotingKey === key}
                              onClick={() => handlePromoteToMaster(r)}
                              className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-0.5"
                            >
                              <Plus className="w-3 h-3" /> ดึงเข้า Master กลาง
                            </button>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400">มาตรฐาน</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SectionCard>
  )
}
