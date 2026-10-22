'use client'

import React from 'react'
import type { ContactPerson, BackupContactPerson, BankAccountInfo } from '../types-v6'

interface Step1ContactsProps {
  primaryContact: ContactPerson
  backupContact: BackupContactPerson
  authorizer: ContactPerson
  bank: BankAccountInfo
  onChangePrimary: (p: Partial<ContactPerson>) => void
  onChangeBackup: (b: Partial<BackupContactPerson>) => void
  onChangeAuthorizer: (a: Partial<ContactPerson>) => void
  onChangeBank: (b: Partial<BankAccountInfo>) => void
}

export function Step1Contacts({
  primaryContact,
  backupContact,
  authorizer,
  bank,
  onChangePrimary,
  onChangeBackup,
  onChangeAuthorizer,
  onChangeBank,
}: Step1ContactsProps) {
  return (
    <div className="space-y-4 pt-3 border-t border-slate-100">
      {/* 1.5 ผู้ประสานงานหลัก */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-800">1.5 ผู้ประสานงานหลัก *</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
          <input
            type="text"
            value={primaryContact.name}
            onChange={e => onChangePrimary({ name: e.target.value })}
            placeholder="ชื่อ-นามสกุล *"
            className="h-10 px-3 border border-slate-300 rounded-lg bg-white"
            required
          />
          <input
            type="text"
            value={primaryContact.pos}
            onChange={e => onChangePrimary({ pos: e.target.value })}
            placeholder="ตำแหน่ง *"
            className="h-10 px-3 border border-slate-300 rounded-lg bg-white"
            required
          />
          <input
            type="tel"
            value={primaryContact.phone}
            onChange={e => onChangePrimary({ phone: e.target.value })}
            placeholder="เบอร์โทรศัพท์ 9-15 หลัก *"
            className="h-10 px-3 border border-slate-300 rounded-lg bg-white"
            required
          />
          <input
            type="email"
            value={primaryContact.email}
            onChange={e => onChangePrimary({ email: e.target.value })}
            placeholder="อีเมลผู้ประสานงาน *"
            className="h-10 px-3 border border-slate-300 rounded-lg bg-white"
            required
          />
          <input
            type="text"
            value={primaryContact.line || ''}
            onChange={e => onChangePrimary({ line: e.target.value })}
            placeholder="LINE ID"
            className="h-10 px-3 border border-slate-300 rounded-lg bg-white"
          />
        </div>
      </div>

      {/* 1.6 & 1.7 ผู้ติดต่อสำรอง & ผู้มีอำนาจอนุมัติ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800">1.6 ผู้ติดต่อฉุกเฉินนอกเวลาทำการ *</label>
          <div className="space-y-2 text-xs">
            <input
              type="text"
              value={backupContact.name}
              onChange={e => onChangeBackup({ name: e.target.value })}
              placeholder="ชื่อ-นามสกุล *"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
              required
            />
            <input
              type="tel"
              value={backupContact.phone}
              onChange={e => onChangeBackup({ phone: e.target.value })}
              placeholder="เบอร์โทรศัพท์ *"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800">1.7 ผู้มีอำนาจอนุมัติ / กรรมการ *</label>
          <div className="space-y-2 text-xs">
            <input
              type="text"
              value={authorizer.name}
              onChange={e => onChangeAuthorizer({ name: e.target.value })}
              placeholder="ชื่อ-นามสกุล *"
              className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="tel"
                value={authorizer.phone}
                onChange={e => onChangeAuthorizer({ phone: e.target.value })}
                placeholder="เบอร์โทรศัพท์ *"
                className="h-10 px-3 border border-slate-300 rounded-lg bg-white"
                required
              />
              <input
                type="email"
                value={authorizer.email}
                onChange={e => onChangeAuthorizer({ email: e.target.value })}
                placeholder="อีเมล *"
                className="h-10 px-3 border border-slate-300 rounded-lg bg-white"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* 1.8 ข้อมูลการเงิน */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800">1.8 ข้อมูลการเงิน / บัญชีรับชำระเงิน *</label>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">เอกสาร ภ.พ.20:</span>
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="vat20"
                checked={bank.vat20 === 'มี'}
                onChange={() => onChangeBank({ vat20: 'มี' })}
                className="accent-red-700"
              />
              <span>มี</span>
            </label>
            <label className="inline-flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                name="vat20"
                checked={bank.vat20 === 'ไม่มี'}
                onChange={() => onChangeBank({ vat20: 'ไม่มี' })}
                className="accent-red-700"
              />
              <span>ไม่มี</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
          <input
            type="text"
            value={bank.accName}
            onChange={e => onChangeBank({ accName: e.target.value })}
            placeholder="ชื่อบัญชีธนาคาร *"
            className="h-10 px-3 border border-slate-300 rounded-lg bg-white"
            required
          />
          <input
            type="text"
            value={bank.accNo}
            onChange={e => onChangeBank({ accNo: e.target.value })}
            placeholder="เลขที่บัญชีธนาคาร *"
            className="h-10 px-3 border border-slate-300 rounded-lg bg-white"
            required
          />
          <input
            type="text"
            value={bank.bank}
            onChange={e => onChangeBank({ bank: e.target.value })}
            placeholder="ธนาคาร (เช่น กสิกรไทย, ไทยพาณิชย์) *"
            className="h-10 px-3 border border-slate-300 rounded-lg bg-white"
            required
          />
          <input
            type="text"
            value={bank.bankBranch}
            onChange={e => onChangeBank({ bankBranch: e.target.value })}
            placeholder="สาขาธนาคาร"
            className="h-10 px-3 border border-slate-300 rounded-lg bg-white"
          />
        </div>
      </div>
    </div>
  )
}
