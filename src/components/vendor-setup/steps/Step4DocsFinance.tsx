'use client'

import React from 'react'
import type { VendorSetupFormData } from '../types'
import { FileText, CreditCard, Upload, CheckCircle2 } from 'lucide-react'

interface Step4DocsFinanceProps {
  finance: VendorSetupFormData['finance']
  onUpdateFinance: (patch: Partial<VendorSetupFormData['finance']>) => void
}

const BANKS = [
  'กสิกรไทย (KBANK)',
  'ไทยพาณิชย์ (SCB)',
  'กรุงเทพ (BBL)',
  'กรุงไทย (KTB)',
  'กรุงศรีอยุธยา (BAY)',
  'ทหารไทยธนชาต (TTB)',
  'ออมสิน (GSB)',
]

export function Step4DocsFinance({ finance, onUpdateFinance }: Step4DocsFinanceProps) {
  const handleUpload = async (field: 'idcard' | 'company' | 'license', file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/vendors/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.fileUrl) {
        onUpdateFinance({
          documents: { ...finance.documents, [field]: data.fileUrl },
        })
      }
    } catch {
      // upload error
    }
  }

  return (
    <div className="space-y-6">
      {/* เอกสารยืนยันตัวตน */}
      <div className="p-5 rounded-2xl border bg-white space-y-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <FileText className="w-5 h-5" style={{ color: 'var(--red)' }} />
          <div>
            <h4 className="font-semibold text-base" style={{ color: 'var(--text)' }}>เอกสารยืนยันตัวตน</h4>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              รองรับไฟล์ PDF, JPG, PNG ขนาดไม่เกิน 10MB
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* บัตรประชาชน */}
          <div className="p-3.5 rounded-xl border bg-slate-50 space-y-2" style={{ borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800">บัตรประชาชน / รับรอง <span className="text-red-500">*</span></span>
              {finance.documents.idcard && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] text-slate-500">สำเนาบัตร ปชช. ผู้มีอำนาจลงนาม</p>
            <label className="btn btn-secondary text-xs w-full py-1.5 flex items-center justify-center gap-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> {finance.documents.idcard ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('idcard', e.target.files[0])} />
            </label>
          </div>

          {/* หนังสือรับรองนิติบุคคล / ภพ.20 */}
          <div className="p-3.5 rounded-xl border bg-slate-50 space-y-2" style={{ borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800">ทะเบียนพาณิชย์ / ภ.พ.20</span>
              {finance.documents.company && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] text-slate-500">กรณีเป็นนิติบุคคล</p>
            <label className="btn btn-secondary text-xs w-full py-1.5 flex items-center justify-center gap-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> {finance.documents.company ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('company', e.target.files[0])} />
            </label>
          </div>

          {/* ใบอนุญาตช่าง / วุฒิบัตร */}
          <div className="p-3.5 rounded-xl border bg-slate-50 space-y-2" style={{ borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-800">ใบอนุญาตช่าง / วุฒิบัตร</span>
              {finance.documents.license && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] text-slate-500">มีผลต่อการพิจารณา Tier Pro/VIP</p>
            <label className="btn btn-secondary text-xs w-full py-1.5 flex items-center justify-center gap-1 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> {finance.documents.license ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์'}
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => e.target.files?.[0] && handleUpload('license', e.target.files[0])} />
            </label>
          </div>
        </div>
      </div>

      {/* บัญชีรับเงินผ่าน Oracle Payment */}
      <div className="p-5 rounded-2xl border bg-white space-y-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <CreditCard className="w-5 h-5" style={{ color: 'var(--red)' }} />
          <div>
            <h4 className="font-semibold text-base" style={{ color: 'var(--text)' }}>
              ข้อมูลบัญชีธนาคาร (Oracle Payment)
            </h4>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              ระบบ SVC โอนจ่ายเงินทุกวันศุกร์ (รอบบิล 7 วัน) ไม่มีขั้นต่ำ พร้อมใบเสร็จและหัก ณ ที่จ่าย 3%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              ธนาคาร <span className="text-red-500">*</span>
            </label>
            <select
              className="inp text-sm"
              value={finance.bank}
              onChange={e => onUpdateFinance({ bank: e.target.value })}
            >
              <option value="">-- เลือกธนาคาร --</option>
              {BANKS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              เลขที่บัญชี <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="inp text-sm"
              placeholder="012-x-xxxxx-x"
              value={finance.accNo}
              onChange={e => onUpdateFinance({ accNo: e.target.value.replace(/\D/g, '') })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              ชื่อบัญชี (ตรงกับชื่อร้าน/บริษัท) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="inp text-sm"
              placeholder="นายสมชาย ใจดี หรือ บจก. ช่างดี"
              value={finance.accName}
              onChange={e => onUpdateFinance({ accName: e.target.value })}
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
          <label className="inline-flex items-start gap-2 text-xs text-amber-900 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 rounded"
              checked={finance.commission}
              onChange={e => onUpdateFinance({ commission: e.target.checked })}
            />
            <span>
              ยินยอมให้หักค่าอะไหล่และภาษีผ่านระบบ Oracle (SVC จะออกใบเสร็จรับเงินและหักภาษี ณ ที่จ่าย 3% ให้อัตโนมัติในทุกรอบบิล) <span className="text-red-500">*</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}
