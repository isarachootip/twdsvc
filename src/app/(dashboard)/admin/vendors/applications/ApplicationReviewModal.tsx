'use client'

import React, { useState } from 'react'
import { api } from '@/lib/client'
import { fmtPhone } from '@/lib/constants'
import { useToast } from '@/components/ui/Toast'
import { Plus, Check } from 'lucide-react'
import {
  extractApplicationProductRates,
  type ProductGroupRateConfig,
} from '@/lib/validations/vendor-product-group.schema'

export interface VendorApplicationDetail {
  id: string
  applicationNo: string
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  storeName: string
  businessType: string
  phone: string
  estimatedTier: string
  score: number
  signatureUrl: string | null
  createdAt: string
  branches: unknown[]
  appliances?: unknown
  agreements?: unknown
}

interface ApplicationReviewModalProps {
  application: VendorApplicationDetail | null
  busy: boolean
  rejectReason: string
  onChangeRejectReason: (val: string) => void
  onDecision: (id: string, action: 'APPROVE' | 'REJECT') => void
  onClose: () => void
}

export function ApplicationReviewModal({
  application, busy, rejectReason, onChangeRejectReason, onDecision, onClose,
}: ApplicationReviewModalProps) {
  const [promotedKeys, setPromotedKeys] = useState<Record<string, boolean>>({})
  const [promotingKey, setPromotingKey] = useState<string | null>(null)
  const { toast } = useToast()

  if (!application) return null

  const productRates = extractApplicationProductRates(application.appliances, application.agreements)

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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-base">ตรวจสอบใบสมัคร: {application.applicationNo}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div><span className="text-slate-500">ชื่อร้าน:</span> <b>{application.storeName}</b> ({application.businessType})</div>
          <div><span className="text-slate-500">เบอร์โทร:</span> <b>{fmtPhone(application.phone)}</b></div>
          <div><span className="text-slate-500">ระดับคาดการณ์:</span> <b className="text-slate-800">{application.estimatedTier}</b> (คะแนน {application.score}/100)</div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-800">
            อัตราค่าเปิดเครื่องขั้นต่ำและ GP (%) รายกลุ่มสินค้า ({productRates.length} รายการ)
          </h4>
          {productRates.length === 0 ? (
            <p className="text-xs text-slate-500">ไม่มีข้อมูลอัตราค่าเปิดเครื่องรายกลุ่มสินค้า</p>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 font-semibold">บริการ</th>
                    <th className="py-2 px-3 font-semibold">กลุ่มสินค้า</th>
                    <th className="py-2 px-3 font-semibold text-right">ค่าเปิดเครื่อง</th>
                    <th className="py-2 px-3 font-semibold text-right">GP (%)</th>
                    <th className="py-2 px-3 font-semibold text-right">จัดการ Master</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productRates.map(r => {
                    const key = `${r.serviceType}:${r.groupName}`
                    const isPromoted = Boolean(promotedKeys[key])
                    return (
                      <tr key={key}>
                        <td className="py-2 px-3">
                          <span className={`inline-flex items-center gap-1 font-semibold ${r.serviceType === 'CARRY_IN' ? 'text-red-700' : 'text-sky-700'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${r.serviceType === 'CARRY_IN' ? 'bg-red-600' : 'bg-sky-600'}`} />
                            {r.serviceType === 'CARRY_IN' ? 'Carry-in' : 'On-site'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {r.groupName}
                          {r.isCustomGroup && <span className="ml-2 text-[11px] font-medium text-amber-700">• กลุ่มเพิ่มเติม</span>}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-emerald-700">฿{r.minInspectionFee.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-800">{r.gpPct}%</td>
                        <td className="py-2 px-3 text-right">
                          {r.isCustomGroup ? (
                            isPromoted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                <Check className="w-3 h-3" /> อยู่ใน Master แล้ว
                              </span>
                            ) : (
                              <button type="button" disabled={promotingKey === key} onClick={() => handlePromoteToMaster(r)} className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-0.5">
                                <Plus className="w-3 h-3" /> ดึงเข้า Master กลาง
                              </button>
                            )
                          ) : <span className="text-[11px] text-slate-400">มาตรฐาน</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {application.signatureUrl && (
          <div className="pt-2 text-xs">
            <span className="text-slate-500 block mb-1">ลายเซ็นดิจิทัล:</span>
            <div className="border rounded-lg p-2 bg-slate-50 inline-block">
              <img src={application.signatureUrl} alt="Signature" className="h-14 object-contain" />
            </div>
          </div>
        )}

        {application.status === 'PENDING_APPROVAL' && (
          <div className="space-y-3 pt-3 border-t">
            <input type="text" className="inp text-xs" placeholder="ระบุเหตุผล (กรณีปฏิเสธ)" value={rejectReason} onChange={e => onChangeRejectReason(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button type="button" disabled={busy} onClick={() => onDecision(application.id, 'REJECT')} className="btn btn-secondary text-xs text-red-600 hover:bg-red-50">
                ปฏิเสธใบสมัคร
              </button>
              <button type="button" disabled={busy} onClick={() => onDecision(application.id, 'APPROVE')} className="btn btn-primary text-xs">
                อนุมัติเข้าระบบ (Approve)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
