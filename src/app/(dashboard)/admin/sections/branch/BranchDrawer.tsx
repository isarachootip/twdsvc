'use client'

import React, { useState } from 'react'
import {
  X,
  Edit3,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  User,
  Clock,
  Truck,
  Users,
  Wrench,
  Building,
} from 'lucide-react'
import { SiteDetailItem } from './branch-types'

interface BranchDrawerProps {
  site: SiteDetailItem | null
  onClose: () => void
  onEdit: (site: SiteDetailItem) => void
}

type TabType = 'general' | 'address' | 'contacts' | 'routes'

export function BranchDrawer({ site, onClose, onEdit }: BranchDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general')

  if (!site) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-slate-200/80 font-bold text-slate-800">
                  {site.code}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    site.type === 'BRANCH'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {site.type === 'BRANCH' ? 'สาขาไทวัสดุ' : 'คลังกระจายสินค้า DC'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    site.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {site.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1.5">{site.name}</h2>
              <p className="text-xs text-slate-500">{site.province} • {site.region || 'ไม่ระบุภาค'}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(site)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>แก้ไข</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 px-6 bg-white text-xs font-medium">
            {[
              { id: 'general', label: 'ข้อมูลทั่วไป' },
              { id: 'address', label: 'ที่อยู่ & แผนที่' },
              { id: 'contacts', label: 'ผู้รับผิดชอบ & ติดต่อ' },
              { id: 'routes', label: 'เส้นทาง & ระบบ' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as TabType)}
                className={`py-3 px-3 border-b-2 font-medium transition-colors ${
                  activeTab === t.id
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            {activeTab === 'general' && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">รหัสสาขา/คลัง</span>
                    <span className="font-mono font-semibold text-slate-800 text-sm">{site.code}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">ชื่อย่อ (Nickname)</span>
                    <span className="font-semibold text-slate-800 text-sm">{site.nickname || site.code}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">ประเภทสถานที่</span>
                    <span className="font-medium text-slate-800">{site.type === 'BRANCH' ? 'สาขาไทวัสดุ (BRANCH)' : 'คลังสินค้ากลาง (DC)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">ภูมิภาค / โซน</span>
                    <span className="font-medium text-slate-800">{site.region || '-'}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">เวลาเปิด-ปิดทำการ</span>
                    <span className="font-medium text-slate-800 text-sm">{site.openingHours || 'ทุกวัน 08:00 - 19:00 น.'}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'address' && (
              <div className="space-y-3.5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">ที่อยู่ฉบับเต็ม (แสดงบนใบแจ้งซ่อม/ใบเสนอราคา)</span>
                      <p className="text-slate-800 font-medium text-sm mt-0.5 leading-relaxed">{site.address || 'ไม่ได้ระบุที่อยู่'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/70 text-[11px]">
                    <div><span className="text-slate-400 block">ตำบล/แขวง:</span><span className="font-medium text-slate-700">{site.subdistrict || '-'}</span></div>
                    <div><span className="text-slate-400 block">อำเภอ/เขต:</span><span className="font-medium text-slate-700">{site.district || '-'}</span></div>
                    <div><span className="text-slate-400 block">จังหวัด:</span><span className="font-medium text-slate-700">{site.province || '-'}</span></div>
                    <div><span className="text-slate-400 block">รหัสไปรษณีย์:</span><span className="font-medium text-slate-700">{site.postalCode || '-'}</span></div>
                  </div>
                </div>

                {site.googleMapsUrl ? (
                  <a
                    href={site.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-xl text-blue-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">ดูตำแหน่งบน Google Maps</span>
                    </div>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-center">
                    ยังไม่มีการระบุลิงก์หรือพิกัดแผนที่
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className="space-y-3.5">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-indigo-500" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">ผู้จัดการเขต (District Manager)</span>
                      <span className="font-semibold text-slate-800 text-sm">{site.manager || site.districtManager || 'ไม่ได้ระบุ'}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200/70">
                    <span className="text-slate-400 block text-[11px]">ผู้จัดการสาขา (Store Manager)</span>
                    <span className="font-semibold text-slate-800 text-sm">{site.storeManagerName || 'ไม่ได้ระบุ'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">เบอร์ติดต่อสาขา</span>
                      <span className="font-mono font-medium text-slate-800 text-sm">{site.phone || '-'}</span>
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">เบอร์ตรงผู้จัดการสาขา</span>
                      <span className="font-mono font-medium text-slate-800 text-sm">{site.storeManagerPhone || '-'}</span>
                    </div>
                  </div>
                </div>

                {site.storeEmail && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">อีเมลสาขา</span>
                      <span className="font-medium text-slate-800">{site.storeEmail}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'routes' && (
              <div className="space-y-3.5">
                {/* Linked VD Centers */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <Truck className="w-4 h-4 text-amber-500" />
                    <span>ศูนย์บริการ VD ที่จับคู่ไว้</span>
                  </div>
                  {site.primaryRoutes && site.primaryRoutes.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {site.primaryRoutes.map(r => (
                        <div key={r.id} className="p-2.5 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800">{r.primaryCenter?.vendorParent?.name || 'VD Center'}</span>
                            <span className="text-[11px] text-slate-400 ml-1.5">({r.primaryCenter?.code})</span>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                            ช่องทาง: {r.standardChannel}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs py-1">ยังไม่มีการผูกศูนย์บริการ VD (กำหนดได้ที่เมนู จับคู่สาขา - VD)</p>
                  )}
                </div>

                {/* Staff & Repair Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>พนักงานในระบบ</span>
                    </div>
                    <span className="text-xl font-bold text-slate-800">{site._count?.users ?? 0}</span>
                    <span className="text-slate-400 ml-1">คน</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>งานซ่อมค้างอยู่</span>
                    </div>
                    <span className={`text-xl font-bold ${(site.openJobsCount ?? 0) > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                      {site.openJobsCount ?? 0}
                    </span>
                    <span className="text-slate-400 ml-1">งาน</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
