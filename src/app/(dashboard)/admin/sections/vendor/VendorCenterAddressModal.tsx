'use client'

import React, { useState, useEffect } from 'react'
import { MapPin, X, Check, FileText, Layers, Trash2 } from 'lucide-react'
import { formatStructuredAddress, extractPostalCode } from './vendor-address-helper'
import {
  VendorCenterAddressStructuredFields,
  StructuredFieldsState,
} from './VendorCenterAddressStructuredFields'

interface VendorCenterAddressModalProps {
  isOpen: boolean
  centerCode: string
  initialAddress: string
  initialPostalCode?: string
  zoneSiteName?: string
  onClose: () => void
  onSave: (address: string, postalCode?: string) => void
}

const emptyFields: StructuredFieldsState = {
  houseNo: '',
  subdistrict: '',
  district: '',
  province: '',
  postalCode: '',
}

export function VendorCenterAddressModal({
  isOpen,
  centerCode,
  initialAddress,
  initialPostalCode,
  zoneSiteName,
  onClose,
  onSave,
}: VendorCenterAddressModalProps) {
  const [mode, setMode] = useState<'freeform' | 'structured'>('freeform')
  const [addressText, setAddressText] = useState(initialAddress)
  const [fields, setFields] = useState<StructuredFieldsState>(emptyFields)

  useEffect(() => {
    if (isOpen) {
      setAddressText(initialAddress || '')
      const zip = initialPostalCode || extractPostalCode(initialAddress || '') || ''
      setFields({ ...emptyFields, postalCode: zip })
      setMode('freeform')
    }
  }, [isOpen, initialAddress, initialPostalCode])

  if (!isOpen) return null

  const structuredPreview = formatStructuredAddress(fields)

  const handleApplyStructured = () => {
    if (structuredPreview) {
      setAddressText(structuredPreview)
      setMode('freeform')
    }
  }

  const handleConfirm = () => {
    const zip = fields.postalCode.trim() || extractPostalCode(addressText) || undefined
    onSave(addressText.trim(), zip)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">แก้ไขที่อยู่ศูนย์บริการ</h3>
              <p className="text-[11px] text-slate-500">
                รหัสสาขา: <span className="font-mono font-medium text-slate-700">{centerCode}</span>
                {zoneSiteName ? ` • โซน: ${zoneSiteName}` : ''}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switch */}
        <div className="flex border-b border-slate-200 px-5 bg-slate-50/50 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('freeform')}
            className={`py-2 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              mode === 'freeform' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>กรอกข้อความเต็ม</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('structured')}
            className={`py-2 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
              mode === 'structured' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>กรอกแยกช่อง (ตำบล/อำเภอ/จังหวัด)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3.5 text-xs">
          {mode === 'freeform' ? (
            <div className="space-y-2">
              <label className="font-semibold text-slate-700 block">ที่อยู่เต็ม (Full Address)</label>
              <textarea
                className="inp w-full text-xs p-2.5 rounded-lg border-slate-300 focus:border-red-500"
                rows={4}
                value={addressText}
                placeholder="เช่น 123/45 หมู่ 6 ถ.สุขุมวิท ต.บางนา อ.บางนา กรุงเทพมหานคร 10260"
                onChange={e => setAddressText(e.target.value)}
              />
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span>สามารถพิมพ์หรือวางข้อความที่อยู่ศูนย์ได้ทันที</span>
                {addressText && (
                  <button
                    type="button"
                    onClick={() => setAddressText('')}
                    className="text-rose-600 hover:underline flex items-center gap-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>ล้างข้อความ</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <VendorCenterAddressStructuredFields
              fields={fields}
              onChange={patch => setFields(prev => ({ ...prev, ...patch }))}
              onApply={handleApplyStructured}
              preview={structuredPreview}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-secondary text-xs py-1.5 px-3">
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn btn-primary text-xs py-1.5 px-4 flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>ตกลง</span>
          </button>
        </div>
      </div>
    </div>
  )
}
