'use client'

import React, { useState, useEffect } from 'react'
import { X, Save, FileText, Award, Store, Trash2 } from 'lucide-react'
import { SiteLite } from '../admin-helpers'
import { VendorParentRow, NamedOption } from './vendor-types'
import { VendorDrawerContractTab } from './VendorDrawerContractTab'
import { VendorDrawerBrandsTab } from './VendorDrawerBrandsTab'
import { VendorDrawerCentersTab } from './VendorDrawerCentersTab'

interface VendorDrawerProps {
  vendor: VendorParentRow | null
  brands: NamedOption[]
  sizes: NamedOption[]
  sites: SiteLite[]
  saving: boolean
  onClose: () => void
  onSave: (vendor: VendorParentRow) => Promise<void>
  onDeleteRequest: (vendor: VendorParentRow) => void
}

type TabType = 'contract' | 'brands' | 'centers'

export function VendorDrawer({
  vendor,
  brands,
  sizes,
  sites,
  saving,
  onClose,
  onSave,
  onDeleteRequest,
}: VendorDrawerProps) {
  const [form, setForm] = useState<VendorParentRow | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('contract')

  useEffect(() => {
    if (vendor) {
      setForm(JSON.parse(JSON.stringify(vendor)))
      setActiveTab('contract')
    } else {
      setForm(null)
    }
  }, [vendor])

  if (!vendor || !form) return null

  const isNew = !vendor.id

  const updateForm = (patch: Partial<VendorParentRow>) => {
    setForm(prev => (prev ? { ...prev, ...patch } : null))
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.code.trim() || !form.name.trim()) return
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm px-2 py-0.5 rounded bg-slate-200/80 font-bold text-slate-800">
                  {form.code || '(คู่ค้าใหม่)'}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    form.isBrandAuthorized ? 'text-sky-700' : 'text-slate-600'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      form.isBrandAuthorized ? 'bg-sky-500' : 'bg-slate-400'
                    }`}
                  />
                  {form.isBrandAuthorized ? 'ศูนย์แบรนด์ (Authorized)' : 'คู่ค้าทั่วไป'}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-1 line-clamp-1">
                {form.name || 'เพิ่มข้อมูลคู่ค้าใหม่'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 px-6 bg-white text-xs font-medium shrink-0">
            {[
              { id: 'contract', label: 'ข้อมูลสัญญา & ค่าบริการ', icon: FileText },
              { id: 'brands', label: `แบรนด์ & ขนาด (${form.brandIds?.length || 0})`, icon: Award },
              { id: 'centers', label: `ศูนย์บริการย่อย (${form.centers?.length || 0})`, icon: Store },
            ].map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as TabType)}
                  className={`py-3 px-3 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
                    activeTab === t.id
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab Content Area */}
          <div className="p-6 flex-1 overflow-y-auto">
            {activeTab === 'contract' && (
              <VendorDrawerContractTab form={form} onChange={updateForm} />
            )}
            {activeTab === 'brands' && (
              <VendorDrawerBrandsTab
                brandIds={form.brandIds || []}
                sizeIds={form.sizeIds || []}
                brands={brands}
                sizes={sizes}
                onChangeBrands={ids => updateForm({ brandIds: ids })}
                onChangeSizes={ids => updateForm({ sizeIds: ids })}
              />
            )}
            {activeTab === 'centers' && (
              <VendorDrawerCentersTab
                centers={form.centers || []}
                sites={sites}
                parentCode={form.code}
                defaultGpPct={form.defaultGpPct}
                defaultRepairSlaDays={form.defaultRepairSlaDays}
                onChangeCenters={centers => updateForm({ centers })}
              />
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div>
              {!isNew && (
                <button
                  type="button"
                  onClick={() => onDeleteRequest(vendor)}
                  className="btn bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบคู่ค้า</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn btn-secondary text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !form.code.trim() || !form.name.trim()}
                className="btn btn-primary text-xs flex items-center gap-1.5 min-w-[110px] justify-center"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'กำลังบันทึก...' : 'บันทึกคู่ค้านี้'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
