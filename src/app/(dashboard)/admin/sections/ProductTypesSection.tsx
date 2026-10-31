'use client'

import React from 'react'
import { Plus, Search } from 'lucide-react'
import type { VendorServiceMode } from '@/lib/validations/vendor-product-group.schema'
import { VendorCustomGroupsCard } from './product-types/VendorCustomGroupsCard'
import { ProductTypesTable } from './product-types/ProductTypesTable'
import { ProductTypeFormModal } from './product-types/ProductTypeFormModal'
import { useProductTypesAdmin } from './product-types/useProductTypesAdmin'

export function ProductTypesSection() {
  const {
    groups, customGroups, loading, search, setSearch,
    modeFilter, setModeFilter, statusFilter, setStatusFilter,
    draft, setDraft, saving, togglingId, promotingKey,
    filteredRows, uniqueCsCount, openCreateModal, openEditModal,
    handleSaveDraft, handleToggleActive, handleDelete, handlePromoteCustom,
  } = useProductTypesAdmin()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="pcard py-3 px-4">
          <div className="text-xs text-slate-500">ประเภทสินค้าในหน้าเปิดงาน CS</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{uniqueCsCount} ประเภท</div>
        </div>
        <div className="pcard py-3 px-4">
          <div className="text-xs text-slate-500">กลุ่ม 2.1 Carry-in</div>
          <div className="text-xl font-bold text-red-700 mt-1">
            {groups.filter(g => g.serviceType === 'CARRY_IN').length} รายการ
          </div>
        </div>
        <div className="pcard py-3 px-4">
          <div className="text-xs text-slate-500">กลุ่ม 2.2 On-site</div>
          <div className="text-xl font-bold text-sky-700 mt-1">
            {groups.filter(g => g.serviceType === 'ON_SITE').length} รายการ
          </div>
        </div>
        <div className="pcard py-3 px-4">
          <div className="text-xs text-slate-500">รายการใหม่จาก Vendor Register</div>
          <div className={`text-xl font-bold mt-1 ${customGroups.length > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {customGroups.length} รายการ
          </div>
        </div>
      </div>

      <VendorCustomGroupsCard items={customGroups} promotingKey={promotingKey} onPromote={handlePromoteCustom} />

      <div className="pcard space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="inp w-full pl-8 text-xs"
              placeholder="ค้นหาชื่อประเภทสินค้า หรือคำจับคู่ SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="inp text-xs"
              value={modeFilter}
              onChange={e => setModeFilter(e.target.value as 'ALL' | VendorServiceMode)}
            >
              <option value="ALL">ทุกรูปแบบบริการ</option>
              <option value="CARRY_IN">2.1 Carry-in (ซ่อมที่ศูนย์)</option>
              <option value="ON_SITE">2.2 On-site (เข้าหน้างาน)</option>
            </select>
            <select
              className="inp text-xs"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="ACTIVE">เปิดใช้งาน</option>
              <option value="INACTIVE">ปิดใช้งาน</option>
            </select>
            <button type="button" onClick={openCreateModal} className="btn btn-primary text-xs inline-flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> เพิ่มประเภทสินค้า
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-center text-xs text-slate-500">กำลังโหลดข้อมูลประเภทสินค้า...</div>
        ) : (
          <ProductTypesTable
            rows={filteredRows}
            togglingId={togglingId}
            onEdit={openEditModal}
            onToggleActive={handleToggleActive}
            onDelete={handleDelete}
          />
        )}
      </div>

      <ProductTypeFormModal
        draft={draft}
        saving={saving}
        onChange={patch => setDraft(prev => (prev ? { ...prev, ...patch } : prev))}
        onSave={handleSaveDraft}
        onClose={() => setDraft(null)}
      />
    </div>
  )
}
