'use client'

import React, { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { SiteFormData, REGION_OPTIONS } from './branch-types'

interface BranchFormModalProps {
  open: boolean
  editData: SiteFormData | null
  existingDms: string[]
  saving: boolean
  onClose: () => void
  onSave: (data: SiteFormData) => Promise<void>
}

const DEFAULT_DATA: SiteFormData = {
  code: '',
  name: '',
  nickname: '',
  type: 'BRANCH',
  province: 'กรุงเทพมหานคร',
  district: '',
  subdistrict: '',
  postalCode: '',
  address: '',
  googleMapsUrl: '',
  phone: '',
  storeManagerName: '',
  storeManagerPhone: '',
  storeEmail: '',
  openingHours: 'ทุกวัน 08:00 - 19:00 น.',
  region: 'ภาคกลาง',
  districtManager: '',
  active: true,
}

export function BranchFormModal({
  open,
  editData,
  existingDms,
  saving,
  onClose,
  onSave,
}: BranchFormModalProps) {
  const [form, setForm] = useState<SiteFormData>(DEFAULT_DATA)
  const [tab, setTab] = useState<'basic' | 'address' | 'contact'>('basic')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editData) {
      setForm(editData)
    } else {
      setForm(DEFAULT_DATA)
    }
    setError(null)
    setTab('basic')
  }, [editData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim()) {
      setError('กรุณากรอกรหัสสาขา/คลัง')
      setTab('basic')
      return
    }
    if (!form.name.trim()) {
      setError('กรุณากรอกชื่อสาขา/คลัง')
      setTab('basic')
      return
    }
    setError(null)
    try {
      await onSave(form)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึก')
    }
  }

  const isEdit = Boolean(form.id)

  return (
    <Modal open={open} onClose={onClose} size="wide">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {isEdit ? `แก้ไขสาขา / คลัง (${form.code})` : 'เพิ่มสาขา / คลังใหม่'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isEdit ? 'ปรับปรุงข้อมูลสาขาหรือศูนย์กระจายสินค้า' : 'สร้างข้อมูลสาขาใหม่ในระบบไทวัสดุ'}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            {error}
          </div>
        )}

        {/* Tab selection */}
        <div className="flex gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'basic', label: '1. ข้อมูลหลัก' },
            { id: 'address', label: '2. ที่อยู่ & แผนที่' },
            { id: 'contact', label: '3. ผู้ติดต่อ & บริหาร' },
          ].map(t => (
            <button
              type="button"
              key={t.id}
              onClick={() => setTab(t.id as 'basic' | 'address' | 'contact')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                tab === t.id ? 'bg-red-50 text-red-600 border border-red-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Basic */}
        {tab === 'basic' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="field">
              <label className="font-semibold text-slate-700">รหัสสาขา / คลัง *</label>
              <input
                className="inp"
                placeholder="เช่น 60001, 60802"
                value={form.code}
                disabled={isEdit}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="field">
              <label className="font-semibold text-slate-700">ประเภทสถานที่ *</label>
              <select
                className="sel"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as 'BRANCH' | 'DC' })}
              >
                <option value="BRANCH">สาขา (Branch)</option>
                <option value="DC">คลังสินค้า (Distribution Center)</option>
              </select>
            </div>
            <div className="field sm:col-span-2">
              <label className="font-semibold text-slate-700">ชื่อสาขา / คลัง *</label>
              <input
                className="inp"
                placeholder="เช่น สาขาHO-Expo, สาขาบางบัวทอง"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="font-semibold text-slate-700">ภูมิภาค / โซน</label>
              <select
                className="sel"
                value={form.region || 'ภาคกลาง'}
                onChange={e => setForm({ ...form, region: e.target.value })}
              >
                {REGION_OPTIONS.filter(r => r !== 'ทั้งหมด').map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="font-semibold text-slate-700">เวลาทำการ</label>
              <input
                className="inp"
                placeholder="เช่น ทุกวัน 08:00 - 19:00 น."
                value={form.openingHours || ''}
                onChange={e => setForm({ ...form, openingHours: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={e => setForm({ ...form, active: e.target.checked })}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span className="font-medium text-slate-800">เปิดใช้งานสาขานี้ (Active)</span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: Address */}
        {tab === 'address' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="field sm:col-span-2">
              <label className="font-semibold text-slate-700">ที่อยู่เต็ม (แสดงบนใบแจ้งซ่อม/ใบเสนอราคา)</label>
              <textarea
                className="inp"
                rows={2}
                placeholder="เช่น 88/88 หมู่ที่ 13 ตำบลบางบัวทอง..."
                value={form.address || ''}
                onChange={e => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="font-semibold text-slate-700">ตำบล / แขวง</label>
              <input
                className="inp"
                value={form.subdistrict || ''}
                onChange={e => setForm({ ...form, subdistrict: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="font-semibold text-slate-700">อำเภอ / เขต</label>
              <input
                className="inp"
                value={form.district || ''}
                onChange={e => setForm({ ...form, district: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="font-semibold text-slate-700">จังหวัด</label>
              <input
                className="inp"
                value={form.province}
                onChange={e => setForm({ ...form, province: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="font-semibold text-slate-700">รหัสไปรษณีย์</label>
              <input
                className="inp"
                value={form.postalCode || ''}
                onChange={e => setForm({ ...form, postalCode: e.target.value })}
              />
            </div>
            <div className="field sm:col-span-2">
              <label className="font-semibold text-slate-700">ลิงก์ Google Maps / พิกัด GPS</label>
              <input
                className="inp"
                placeholder="https://maps.google.com/?q=..."
                value={form.googleMapsUrl || ''}
                onChange={e => setForm({ ...form, googleMapsUrl: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Contact */}
        {tab === 'contact' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="field sm:col-span-2">
              <label className="font-semibold text-slate-700">ผู้จัดการเขต (District Manager - DM)</label>
              <div className="flex gap-2">
                <input
                  className="inp flex-1"
                  placeholder="พิมพ์ระบุชื่อ หรือเลือกจาก Dropdown ทางขวา"
                  value={form.districtManager || ''}
                  onChange={e => setForm({ ...form, districtManager: e.target.value })}
                />
                {existingDms.length > 0 && (
                  <select
                    className="sel w-40"
                    value=""
                    onChange={e => {
                      if (e.target.value) setForm({ ...form, districtManager: e.target.value })
                    }}
                  >
                    <option value="">-- เลือก DM เดิม --</option>
                    {existingDms.map(dm => (
                      <option key={dm} value={dm}>{dm}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            <div className="field">
              <label className="font-semibold text-slate-700">ผู้จัดการสาขา (Store Manager)</label>
              <input
                className="inp"
                placeholder="ชื่อ-นามสกุล ผู้จัดการสาขา"
                value={form.storeManagerName || ''}
                onChange={e => setForm({ ...form, storeManagerName: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="font-semibold text-slate-700">เบอร์โทรผู้จัดการสาขา</label>
              <input
                className="inp"
                placeholder="เช่น 081-xxx-xxxx"
                value={form.storeManagerPhone || ''}
                onChange={e => setForm({ ...form, storeManagerPhone: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="font-semibold text-slate-700">เบอร์ติดต่อสาขา</label>
              <input
                className="inp"
                placeholder="เช่น 1308, 02-xxx-xxxx"
                value={form.phone || ''}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="field">
              <label className="font-semibold text-slate-700">อีเมลสาขา</label>
              <input
                className="inp"
                type="email"
                placeholder="branch@thaiwatsadu.com"
                value={form.storeEmail || ''}
                onChange={e => setForm({ ...form, storeEmail: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg shadow-sm transition-colors"
          >
            {saving ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'สร้างสาขาใหม่'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
