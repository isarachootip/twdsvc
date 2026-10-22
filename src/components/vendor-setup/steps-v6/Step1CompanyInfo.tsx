'use client'

import React from 'react'
import type { VendorApplicationFormV6 } from '../types-v6'
import { SectionHeader } from '../common/SectionHeader'
import { ThaiAddressInput } from '../common/ThaiAddressInput'
import { Step1BranchList } from './Step1BranchList'
import { Step1Contacts } from './Step1Contacts'

interface Step1CompanyInfoProps {
  form: VendorApplicationFormV6
  onChange: (patch: Partial<VendorApplicationFormV6>) => void
}

export function Step1CompanyInfo({ form, onChange }: Step1CompanyInfoProps) {
  const isRegistered = form.supplierRegistered === 'เคยลงทะเบียนทำการค้ากับไทวัสดุ'

  return (
    <div className="space-y-5">
      <SectionHeader
        stepNo={1}
        title="ข้อมูลบริษัทและศูนย์บริการ"
        subtitle="กรุณากรอกข้อมูลนิติบุคคลและข้อมูลการติดต่อให้ครบถ้วนและถูกต้องตามความเป็นจริง"
      />

      {/* 1.0 ข้อมูลคู่ค้าเบื้องต้น */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
        <label className="text-xs font-bold text-slate-800">
          1.0 ท่านเป็นคู่ค้า/ผู้ขาย ที่เคยลงทะเบียนทำการค้ากับไทวัสดุหรือไม่? <span className="text-red-600">*</span>
        </label>
        <div className="flex flex-wrap gap-5 text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="supplierRegistered"
              value="เคยลงทะเบียนทำการค้ากับไทวัสดุ"
              checked={form.supplierRegistered === 'เคยลงทะเบียนทำการค้ากับไทวัสดุ'}
              onChange={e => onChange({ supplierRegistered: e.target.value as any })}
              className="accent-red-700"
            />
            <span>เคยลงทะเบียนทำการค้ากับไทวัสดุ</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="supplierRegistered"
              value="ไม่เคยลงทะเบียนทำการค้ากับไทวัสดุ"
              checked={form.supplierRegistered === 'ไม่เคยลงทะเบียนทำการค้ากับไทวัสดุ'}
              onChange={e => onChange({ supplierRegistered: e.target.value as any })}
              className="accent-red-700"
            />
            <span>ไม่เคยลงทะเบียนทำการค้ากับไทวัสดุ</span>
          </label>
        </div>

        {isRegistered && (
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เลขที่ Supplier Code (SPCODE 6 หลัก) <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              maxLength={6}
              value={form.spcode}
              onChange={e => onChange({ spcode: e.target.value.replace(/\D/g, '') })}
              placeholder="เช่น 620163 (ตัวเลข 6 หลัก)"
              className="w-full md:w-64 h-10 px-3 border border-slate-300 rounded-lg text-sm bg-white"
            />
          </div>
        )}
      </div>

      {/* 1.1 ข้อมูลนิติบุคคล */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-800">1.1 ประเภทธุรกิจและข้อมูลจดทะเบียน *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {['บริษัทจำกัด', 'ห้างหุ้นส่วนจำกัด', 'บุคคลธรรมดา', 'วิสาหกิจชุมชน'].map(type => (
            <label key={type} className="inline-flex items-center gap-2 p-2 border border-slate-200 rounded-lg bg-white cursor-pointer">
              <input
                type="radio"
                name="entityType"
                value={type}
                checked={form.entityType === type}
                onChange={e => onChange({ entityType: e.target.value })}
                className="accent-red-700"
              />
              <span>{type}</span>
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="md:col-span-2">
            <label className="block text-slate-600 mb-1">ชื่อบริษัท / ร้านค้า / ชื่อกิจการ *</label>
            <input
              type="text"
              value={form.company}
              onChange={e => onChange({ company: e.target.value })}
              placeholder="เช่น บจก. ตัวอย่าง หรือ ร้านสมชายการช่าง"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">เลขประจำตัวผู้เสียภาษี (13 หลัก) *</label>
            <input
              type="text"
              maxLength={13}
              value={form.taxId}
              onChange={e => onChange({ taxId: e.target.value.replace(/\D/g, '') })}
              placeholder="เลข 13 หลัก"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
              required
            />
          </div>
        </div>
      </div>

      {/* 1.2 ที่อยู่บริษัท (สำนักงานใหญ่) */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-800">1.2 ที่อยู่บริษัท (สำนักงานใหญ่) *</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="md:col-span-2">
            <input
              type="text"
              value={form.companyAddr.line1}
              onChange={e => onChange({ companyAddr: { ...form.companyAddr, line1: e.target.value } })}
              placeholder="บ้านเลขที่ / หมู่ / ซอย / ถนน *"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
              required
            />
          </div>
          <div className="md:col-span-2">
            <ThaiAddressInput
              value={{
                subdistrict: form.companyAddr.subdistrict,
                district: form.companyAddr.district,
                province: form.companyAddr.province,
                zip: form.companyAddr.zip,
              }}
              onChange={addr => onChange({ companyAddr: { ...form.companyAddr, ...addr } })}
              placeholder="พิมพ์ชื่อตำบล อำเภอ หรือรหัสไปรษณีย์สำนักงานใหญ่ *"
              required
            />
          </div>
          <div>
            <input
              type="tel"
              value={form.companyAddr.phone || ''}
              onChange={e => onChange({ companyAddr: { ...form.companyAddr, phone: e.target.value } })}
              placeholder="โทรศัพท์สำนักงานใหญ่ *"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
              required
            />
          </div>
          <div>
            <input
              type="text"
              value={form.companyAddr.note || ''}
              onChange={e => onChange({ companyAddr: { ...form.companyAddr, note: e.target.value } })}
              placeholder="หมายเหตุที่อยู่ (จุดสังเกต)"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
            />
          </div>
        </div>
      </div>

      {/* 1.3 ข้อมูลศูนย์บริการ (สาขา) */}
      <Step1BranchList
        branches={form.branches}
        branchType={form.branchType}
        onChangeBranchType={type => onChange({ branchType: type })}
        onChangeBranches={branches => onChange({ branches })}
      />

      {/* 1.5 - 1.8 ผู้ติดต่อและการเงิน */}
      <Step1Contacts
        primaryContact={form.primaryContact}
        backupContact={form.backupContact}
        authorizer={form.authorizer}
        bank={form.bank}
        onChangePrimary={p => onChange({ primaryContact: { ...form.primaryContact, ...p } })}
        onChangeBackup={b => onChange({ backupContact: { ...form.backupContact, ...b } })}
        onChangeAuthorizer={a => onChange({ authorizer: { ...form.authorizer, ...a } })}
        onChangeBank={b => onChange({ bank: { ...form.bank, ...b } })}
      />
    </div>
  )
}
