'use client'

import React from 'react'
import type { BranchItemUI } from '../types'
import { MapPin, Phone, Trash2, Upload, Star, Zap } from 'lucide-react'

interface BranchCardItemProps {
  branch: BranchItemUI
  index: number
  canRemove: boolean
  onUpdate: (patch: Partial<BranchItemUI>) => void
  onRemove: () => void
}

export function BranchCardItem({ branch, index, canRemove, onUpdate, onRemove }: BranchCardItemProps) {
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/vendors/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.fileUrl) {
        onUpdate({ photo: data.fileUrl })
      }
    } catch {
      // upload error handled gracefully
    }
  }

  return (
    <div className="p-4 rounded-xl border bg-white space-y-4" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: 'var(--red)' }}>
            {index + 1}
          </span>
          <input
            type="text"
            className="inp font-semibold text-sm py-1 px-2 w-48"
            value={branch.branchName}
            placeholder="ชื่อสาขา / ที่ตั้ง"
            onChange={e => onUpdate({ branchName: e.target.value })}
          />
        </div>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> ลบสาขานี้
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
            <MapPin className="w-3.5 h-3.5 inline mr-1" /> ที่อยู่ละเอียด (เลขที่ ถนน ตำบล)
          </label>
          <input
            type="text"
            className="inp text-sm"
            placeholder="เช่น 123/4 หมู่ 5 ถ.สุขุมวิท"
            value={branch.address}
            onChange={e => onUpdate({ address: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>จังหวัด</label>
            <input
              type="text"
              className="inp text-sm"
              placeholder="กรุงเทพฯ"
              value={branch.province}
              onChange={e => onUpdate({ province: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>อำเภอ/เขต</label>
            <input
              type="text"
              className="inp text-sm"
              placeholder="บางกะปิ"
              value={branch.amphoe}
              onChange={e => onUpdate({ amphoe: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
            <Phone className="w-3.5 h-3.5 inline mr-1" /> เบอร์โทรศัพท์ประจำสาขา
          </label>
          <input
            type="tel"
            className="inp text-sm"
            placeholder="081-xxx-xxxx"
            value={branch.phone}
            onChange={e => onUpdate({ phone: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--text-2)' }}>รัศมีให้บริการ</span>
            <span className="font-semibold" style={{ color: 'var(--red)' }}>{branch.radius} กม.</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            className="w-full accent-red-600"
            value={branch.radius}
            onChange={e => onUpdate({ radius: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-4 text-xs">
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              className="rounded"
              checked={branch.vip}
              onChange={e => onUpdate({ vip: e.target.checked })}
            />
            <span className="flex items-center gap-1 font-medium"><Star className="w-3.5 h-3.5 text-amber-500" /> รับงาน VIP</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              className="rounded"
              checked={branch.express}
              onChange={e => onUpdate({ express: e.target.checked })}
            />
            <span className="flex items-center gap-1 font-medium"><Zap className="w-3.5 h-3.5 text-blue-500" /> รับงานด่วน Express</span>
          </label>
        </div>

        <div>
          <label className="btn btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1 cursor-pointer">
            <Upload className="w-3 h-3" /> {branch.photo ? 'เปลี่ยนรูปหน้าร้าน' : 'อัปโหลดรูปหน้าร้าน'}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>
      </div>
    </div>
  )
}
