'use client'

import React, { useState, useEffect } from 'react'
import { X, Check, Trash2 } from 'lucide-react'
import type { ProductGroupRateConfig, VendorServiceMode } from '@/lib/validations/vendor-product-group.schema'

export interface MasterGroupMeta {
  name: string
  serviceType: VendorServiceMode
  minInspectionFee: number
  recommendedFee: number
  minGpPct: number
  defaultGpPct: number
}

interface ProductGroupRateModalProps {
  open: boolean
  serviceType: VendorServiceMode
  isAddingCustom: boolean
  initialGroupName: string
  existingRate?: ProductGroupRateConfig
  masterMeta?: MasterGroupMeta
  existingNames: string[]
  onSave: (config: ProductGroupRateConfig) => void
  onRemove?: (groupName: string) => void
  onClose: () => void
}

const GP_PRESETS = [15, 18, 20, 25]

export function ProductGroupRateModal({
  open, serviceType, isAddingCustom, initialGroupName, existingRate,
  masterMeta, existingNames, onSave, onRemove, onClose,
}: ProductGroupRateModalProps) {
  const minFeeFloor = masterMeta?.minInspectionFee ?? 0
  const minGpFloor = masterMeta?.minGpPct ?? 0

  const [groupName, setGroupName] = useState('')
  const [feeText, setFeeText] = useState('300')
  const [gpText, setGpText] = useState('18')
  const [tasks, setTasks] = useState({ repair: true, replacePart: true, install: false })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setGroupName(isAddingCustom ? '' : initialGroupName)
    const defaultFee = existingRate?.minInspectionFee ?? masterMeta?.recommendedFee ?? (serviceType === 'ON_SITE' ? 500 : 300)
    const defaultGp = existingRate?.gpPct ?? masterMeta?.defaultGpPct ?? 18
    setFeeText(String(defaultFee))
    setGpText(String(defaultGp))
    setTasks(existingRate?.tasks ?? { repair: true, replacePart: true, install: false })
    setError(null)
  }, [open, isAddingCustom, initialGroupName, existingRate, masterMeta, serviceType])

  if (!open) return null

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanName = groupName.trim()
    if (!cleanName) return setError('กรุณาระบุชื่อกลุ่มสินค้า')
    if (isAddingCustom && existingNames.some(n => n.toLowerCase() === cleanName.toLowerCase())) {
      return setError('มีกลุ่มสินค้านี้อยู่ในรายการแล้ว กรุณาเลือกจากรายการที่มีอยู่')
    }
    const feeVal = Number(feeText)
    if (feeText.trim() === '' || Number.isNaN(feeVal) || !Number.isInteger(feeVal) || feeVal < minFeeFloor) {
      return setError(`กรุณาระบุค่าเปิดเครื่องเป็นจำนวนเต็มตั้งแต่ ${minFeeFloor.toLocaleString()} บาทขึ้นไป`)
    }
    const gpVal = Number(gpText)
    if (gpText.trim() === '' || Number.isNaN(gpVal) || gpVal < minGpFloor || gpVal > 100) {
      return setError(`กรุณาระบุส่วนแบ่ง GP% ระหว่าง ${minGpFloor}% ถึง 100%`)
    }
    if (serviceType === 'ON_SITE' && !tasks.repair && !tasks.replacePart && !tasks.install) {
      return setError('กรุณาเลือกขอบเขตงาน On-site อย่างน้อย 1 รายการ')
    }

    onSave({
      groupName: cleanName,
      serviceType,
      minInspectionFee: feeVal,
      gpPct: Number(gpVal.toFixed(2)),
      isCustomGroup: isAddingCustom || Boolean(existingRate?.isCustomGroup),
      tasks: serviceType === 'ON_SITE' ? tasks : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${serviceType === 'CARRY_IN' ? 'text-red-700' : 'text-sky-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${serviceType === 'CARRY_IN' ? 'bg-red-600' : 'bg-sky-600'}`} />
              {serviceType === 'CARRY_IN' ? 'บริการศูนย์รับซ่อม (Carry-in)' : 'บริการช่างเข้าหน้างาน (On-site)'}
            </span>
            <h3 className="text-sm font-bold text-slate-900 mt-0.5">
              {isAddingCustom ? 'เพิ่มกลุ่มสินค้าและกำหนดเงื่อนไขราคา' : `กำหนดค่าเปิดเครื่องและ GP: ${initialGroupName}`}
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="space-y-4 text-xs">
          {isAddingCustom && (
            <div>
              <label className="block font-bold text-slate-800 mb-1">ชื่อกลุ่มสินค้าที่ต้องการเพิ่ม *</label>
              <input
                type="text" autoFocus value={groupName} onChange={e => setGroupName(e.target.value)}
                placeholder="เช่น เครื่องเชื่อมไฟฟ้า, เครื่องตัดหญ้านั่งขับ"
                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
              />
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 mb-1">ค่าเปิดเครื่อง / ตรวจเช็คขั้นต่ำ (บาท) *</label>
            <input
              type="number" min={minFeeFloor} step={1} autoFocus={!isAddingCustom}
              value={feeText} onChange={e => setFeeText(e.target.value)} placeholder="เช่น 300"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white font-semibold"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              {minFeeFloor > 0 ? `อัตราขั้นต่ำของระบบสำหรับกลุ่มนี้: ${minFeeFloor.toLocaleString()} บาท` : 'ระบุ 0 ได้กรณีตรวจเช็ค/เปิดเครื่องฟรี'}
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1.5">ส่วนแบ่งเปอร์เซ็นต์ GP (%) *</label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {GP_PRESETS.filter(p => p >= minGpFloor).map(preset => (
                <button
                  key={preset} type="button" onClick={() => setGpText(String(preset))}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                    Number(gpText) === preset ? 'bg-red-700 text-white border-red-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="number" min={minGpFloor} max={100} step="0.5"
                value={gpText} onChange={e => setGpText(e.target.value)}
                className="w-full h-10 pl-3 pr-8 border border-slate-300 rounded-lg bg-white font-semibold"
              />
              <span className="absolute right-3 top-2.5 text-slate-500 font-bold">%</span>
            </div>
          </div>

          {serviceType === 'ON_SITE' && (
            <div className="pt-2 border-t border-slate-100">
              <label className="block font-bold text-slate-800 mb-1.5">ขอบเขตงาน On-site ที่รับทำ *</label>
              <div className="flex flex-wrap items-center gap-4">
                {(['repair', 'replacePart', 'install'] as const).map(k => (
                  <label key={k} className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox" checked={tasks[k]}
                      onChange={() => setTasks(prev => ({ ...prev, [k]: !prev[k] }))} className="accent-red-700"
                    />
                    <span>{k === 'repair' ? 'ซ่อม' : k === 'replacePart' ? 'เปลี่ยนอะไหล่' : 'ติดตั้ง'}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {existingRate && onRemove ? (
              <button
                type="button" onClick={() => onRemove(existingRate.groupName)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> ยกเลิกการเลือก
              </button>
            ) : <span />}
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="px-3.5 h-9 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">
                ยกเลิก
              </button>
              <button type="submit" className="px-4 h-9 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> บันทึก
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
