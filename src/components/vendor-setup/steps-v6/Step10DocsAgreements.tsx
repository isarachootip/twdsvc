'use client'

import React, { useState } from 'react'
import type { VendorApplicationFormV6 } from '../types-v6'
import { SectionHeader } from '../common/SectionHeader'
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react'

const DOC_FIELDS = [
  { key: 'file_0', label: '1. สำเนาหนังสือรับรองบริษัท (DBD)' },
  { key: 'file_1', label: '2. สำเนา ภ.พ.20' },
  { key: 'file_2', label: '3. สำเนาหน้าสมุดบัญชีธนาคาร' },
  { key: 'file_3', label: '4. สำเนาบัตรประชาชนผู้มีอำนาจลงนาม' },
  { key: 'file_4', label: '5. หนังสือแต่งตั้ง Authorized จากแบรนด์ (ถ้ามี)' },
  { key: 'file_5', label: '6. หนังสือรับรอง / วุฒิบัตรช่าง' },
  { key: 'file_6', label: '7. สำเนากรมธรรม์ประกันภัย (ถ้ามี)' },
  { key: 'file_7', label: '8. รูปถ่ายหน้าร้าน / ศูนย์บริการ' },
]

interface Step10DocsAgreementsProps {
  form: VendorApplicationFormV6
  onChange: (patch: Partial<VendorApplicationFormV6>) => void
}

export function Step10DocsAgreements({ form, onChange }: Step10DocsAgreementsProps) {
  const [uploading, setUploading] = useState<Record<string, boolean>>({})

  const handleFileUpload = async (key: string, file: File) => {
    setUploading(prev => ({ ...prev, [key]: true }))
    try {
      const data = new FormData()
      data.append('file', file)
      const res = await fetch('/api/vendors/upload', { method: 'POST', body: data })
      const json = await res.json()
      if (res.ok && json.fileUrl) {
        onChange({
          documents: { ...form.documents, [key]: json.fileUrl },
        })
      } else {
        alert(json.error || 'อัปโหลดไฟล์ไม่สำเร็จ')
      }
    } catch {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setUploading(prev => ({ ...prev, [key]: false }))
    }
  }

  const toggleAgreement = (key: keyof VendorApplicationFormV6['agreements']) => {
    onChange({
      agreements: {
        ...form.agreements,
        [key]: !form.agreements[key],
      },
    })
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        stepNo={10}
        title="เอกสารประกอบและการยืนยัน"
        subtitle="แนบเอกสารสำคัญตามกฎหมายและลงนามรับรองความถูกต้องของข้อมูลเพื่อส่งใบสมัคร"
      />

      {/* 10.1 อัปโหลดเอกสาร */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs">
        <label className="block font-bold text-slate-800">10.1 เอกสารประกอบ (PDF หรือรูปภาพ ขนาดไม่เกิน 10MB)</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DOC_FIELDS.map(doc => {
            const fileUrl = form.documents[doc.key]
            const isUp = uploading[doc.key]
            return (
              <div key={doc.key} className="p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 space-y-2">
                <span className="font-semibold text-slate-800 block truncate">{doc.label}</span>
                <div className="flex items-center justify-between gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-100 transition">
                    <Upload className="w-3.5 h-3.5 text-red-700" />
                    <span>{isUp ? 'กำลังอัปโหลด…' : fileUrl ? 'เปลี่ยนไฟล์' : 'เลือกไฟล์แนบ'}</span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      disabled={isUp}
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) handleFileUpload(doc.key, f)
                      }}
                      className="hidden"
                    />
                  </label>
                  {fileUrl ? (
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> แนบแล้ว
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400">ยังไม่ได้แนบ</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 10.2 ข้อตกลง */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 text-xs">
        <label className="block font-bold text-slate-800">10.2 ข้อตกลงและความพร้อมก่อนเริ่มโครงการ *</label>
        <div className="space-y-2 divide-y divide-slate-100">
          {[
            { k: 'sla', text: 'ยินดีปฏิบัติตาม SLA และมาตรฐานการบริการที่ไทวัสดุกำหนด' },
            { k: 'inspect', text: 'ยินดีให้ตรวจสอบสถานที่ เครื่องมือ และทีมงานก่อนเริ่มโครงการ' },
            { k: 'reportApp', text: 'มีระบบปิดงานและรายงานสถานะตามที่บริษัทกำหนด' },
            { k: 'training', text: 'พร้อมเข้ารับการอบรมก่อนเริ่มปฏิบัติงานจริง' },
            { k: 'pdpa', text: 'ยินยอมให้จัดเก็บข้อมูล และปฏิบัติตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA)' },
            { k: 'truth', text: 'รับรองว่าข้อมูลและเอกสารทั้งหมดที่ระบุในแบบฟอร์มนี้เป็นความจริงทุกประการ' },
          ].map(item => (
            <label key={item.k} className="flex items-start gap-2.5 pt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.agreements[item.k as keyof VendorApplicationFormV6['agreements']]}
                onChange={() => toggleAgreement(item.k as keyof VendorApplicationFormV6['agreements'])}
                className="w-4 h-4 mt-0.5 accent-red-700 shrink-0"
              />
              <span className="text-slate-800 font-medium">{item.text}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 10.3 ผู้รับรอง */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs">
        <label className="block font-bold text-slate-800">10.3 ผู้รับรองข้อมูล (ผู้มีอำนาจลงนาม) *</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-600 mb-1">ชื่อ-นามสกุล ผู้มีอำนาจลงนาม *</label>
            <input
              type="text"
              value={form.signName}
              onChange={e => onChange({ signName: e.target.value })}
              placeholder="ชื่อ-นามสกุล"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">ตำแหน่ง *</label>
            <input
              type="text"
              value={form.signPos}
              onChange={e => onChange({ signPos: e.target.value })}
              placeholder="เช่น กรรมการผู้จัดการ, หุ้นส่วนผู้จัดการ"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
              required
            />
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          การส่งแบบฟอร์มนี้ถือเป็นการรับรองข้อมูลทางอิเล็กทรอนิกส์ตาม พ.ร.บ.ธุรกรรมทางอิเล็กทรอนิกส์
        </p>
      </div>
    </div>
  )
}
