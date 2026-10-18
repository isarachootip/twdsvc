'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import { Loading, useSites } from './admin-helpers'
import {
  VendorParentRow,
  NamedOption,
  VendorFilterState,
  createEmptyVendor,
} from './vendor/vendor-types'
import { VendorStatsCards } from './vendor/VendorStatsCards'
import { VendorToolbar } from './vendor/VendorToolbar'
import { VendorTable } from './vendor/VendorTable'
import { VendorDrawer } from './vendor/VendorDrawer'
import { VendorDeleteModal } from './vendor/VendorDeleteModal'

interface VendorDirectoryListProps {
  onOpenWizard: () => void
}

export function VendorDirectoryList({ onOpenWizard }: VendorDirectoryListProps) {
  const [list, setList] = useState<VendorParentRow[] | null>(null)
  const [brands, setBrands] = useState<NamedOption[]>([])
  const [sizes, setSizes] = useState<NamedOption[]>([])
  const [selectedVendor, setSelectedVendor] = useState<VendorParentRow | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<VendorParentRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [filter, setFilter] = useState<VendorFilterState>({ search: '', authorized: 'ALL' })

  const sites = useSites()
  const { toast } = useToast()

  const load = useCallback(() => {
    return api<VendorParentRow[]>('/api/admin/vendors').then(v => {
      setList(v.map(p => ({ ...p, centers: p.centers.map(c => ({ ...c })) })))
      if (selectedVendor?.id) {
        const refreshed = v.find(item => item.id === selectedVendor.id)
        if (refreshed) setSelectedVendor(refreshed)
      }
    })
  }, [selectedVendor?.id])

  useEffect(() => {
    load()
    api<NamedOption[]>('/api/brands').then(setBrands).catch(() => {})
    api<NamedOption[]>('/api/size-categories').then(setSizes).catch(() => {})
  }, [load])

  const filteredList = useMemo(() => {
    if (!list) return []
    return list.filter(v => {
      if (filter.authorized === 'AUTH' && !v.isBrandAuthorized) return false
      if (filter.authorized === 'GENERAL' && v.isBrandAuthorized) return false
      if (filter.search.trim()) {
        const q = filter.search.toLowerCase().trim()
        const matchCode = v.code.toLowerCase().includes(q)
        const matchName = v.name.toLowerCase().includes(q)
        if (!matchCode && !matchName) return false
      }
      return true
    })
  }, [list, filter])

  if (!list) return <Loading />

  const handleSaveVendor = async (vendorData: VendorParentRow) => {
    try {
      setSaving(true)
      await api('/api/admin/vendors', {
        method: 'POST',
        body: vendorData,
      })
      toast(`บันทึกข้อมูลคู่ค้า ${vendorData.code} สำเร็จ`, 'success')
      setSelectedVendor(null)
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการบันทึก'
      toast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVendor = async (vendor: VendorParentRow) => {
    if (!vendor.id) return
    try {
      setDeleting(true)
      await api(`/api/admin/vendors?id=${vendor.id}`, { method: 'DELETE' })
      toast(`ปิดการใช้งานคู่ค้า ${vendor.code} แล้ว`, 'success')
      setDeleteTarget(null)
      if (selectedVendor?.id === vendor.id) setSelectedVendor(null)
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการลบ'
      toast(msg, 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      <VendorStatsCards vendors={list} />

      <VendorToolbar
        filter={filter}
        onFilterChange={patch => setFilter(prev => ({ ...prev, ...patch }))}
        totalCount={list.length}
        filteredCount={filteredList.length}
        onAddNew={() => setSelectedVendor(createEmptyVendor())}
        onOpenWizard={onOpenWizard}
      />

      <VendorTable
        vendors={filteredList}
        brands={brands}
        onSelectVendor={setSelectedVendor}
        onDeleteVendor={setDeleteTarget}
      />

      <VendorDrawer
        vendor={selectedVendor}
        brands={brands}
        sizes={sizes}
        sites={sites}
        saving={saving}
        onClose={() => setSelectedVendor(null)}
        onSave={handleSaveVendor}
        onDeleteRequest={v => {
          setSelectedVendor(null)
          setDeleteTarget(v)
        }}
      />

      <VendorDeleteModal
        vendor={deleteTarget}
        deleting={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteVendor}
      />
    </div>
  )
}
