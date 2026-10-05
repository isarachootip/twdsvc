'use client'

import { useCallback, useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/client'
import { useSave, Loading } from './admin-helpers'
import {
  SiteDetailItem,
  SiteFormData,
  BranchFilterState,
} from './branch/branch-types'
import { BranchStatsCards } from './branch/BranchStatsCards'
import { BranchToolbar } from './branch/BranchToolbar'
import { BranchTable } from './branch/BranchTable'
import { BranchDrawer } from './branch/BranchDrawer'
import { BranchFormModal } from './branch/BranchFormModal'
import { BranchDeleteModal } from './branch/BranchDeleteModal'

export function BranchSection() {
  const [sites, setSites] = useState<SiteDetailItem[] | null>(null)
  const [selectedSite, setSelectedSite] = useState<SiteDetailItem | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState<SiteFormData | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SiteDetailItem | null>(null)
  const { saving, save } = useSave()

  const [filter, setFilter] = useState<BranchFilterState>({
    search: '',
    type: 'ALL',
    status: 'ALL',
    region: 'ทั้งหมด',
  })

  const load = useCallback(() => {
    return api<SiteDetailItem[]>('/api/admin/sites').then(data => {
      setSites(data)
      if (selectedSite) {
        const refreshed = data.find(s => s.id === selectedSite.id)
        if (refreshed) setSelectedSite(refreshed)
      }
    })
  }, [selectedSite])

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const existingDms = useMemo(() => {
    if (!sites) return []
    const dms = new Set<string>()
    sites.forEach(s => {
      const dm = s.districtManager || s.manager
      if (dm && dm.trim()) dms.add(dm.trim())
    })
    return Array.from(dms).sort()
  }, [sites])

  const filteredSites = useMemo(() => {
    if (!sites) return []
    return sites.filter(s => {
      if (filter.type !== 'ALL' && s.type !== filter.type) return false
      if (filter.status === 'ACTIVE' && !s.active) return false
      if (filter.status === 'INACTIVE' && s.active) return false
      if (filter.region !== 'ทั้งหมด' && s.region !== filter.region) return false

      if (filter.search.trim()) {
        const q = filter.search.toLowerCase().trim()
        const matchCode = s.code.toLowerCase().includes(q)
        const matchName = s.name.toLowerCase().includes(q)
        const matchNickname = (s.nickname || '').toLowerCase().includes(q)
        const matchProvince = s.province.toLowerCase().includes(q)
        const matchDm = (s.manager || s.districtManager || '').toLowerCase().includes(q)
        const matchManager = (s.storeManagerName || '').toLowerCase().includes(q)
        const matchPhone = (s.phone || '').includes(q)
        if (!matchCode && !matchName && !matchNickname && !matchProvince && !matchDm && !matchManager && !matchPhone) {
          return false
        }
      }
      return true
    })
  }, [sites, filter])

  const handleOpenEdit = (site: SiteDetailItem) => {
    setEditData({
      id: site.id,
      code: site.code,
      name: site.name,
      nickname: site.nickname ?? site.code,
      type: site.type,
      province: site.province,
      district: site.district ?? '',
      subdistrict: site.subdistrict ?? '',
      postalCode: site.postalCode ?? '',
      address: site.address ?? '',
      googleMapsUrl: site.googleMapsUrl ?? '',
      phone: site.phone ?? '',
      storeManagerName: site.storeManagerName ?? '',
      storeManagerPhone: site.storeManagerPhone ?? '',
      storeEmail: site.storeEmail ?? '',
      openingHours: site.openingHours ?? 'ทุกวัน 08:00 - 19:00 น.',
      region: site.region ?? 'ภาคกลาง',
      districtManager: site.districtManager || site.manager || '',
      active: site.active,
    })
    setFormOpen(true)
  }

  const handleSaveSite = async (data: SiteFormData) => {
    await save(async () => {
      await api('/api/admin/sites', {
        method: data.id ? 'PUT' : 'POST',
        body: data,
      })
      await load()
      setFormOpen(false)
      setEditData(null)
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    await save(async () => {
      if (deleteTarget.active) {
        await api(`/api/admin/sites/${deleteTarget.id}`, { method: 'DELETE' })
      } else {
        await api(`/api/admin/sites/${deleteTarget.id}`, {
          method: 'PUT',
          body: { active: true },
        })
      }
      await load()
      setDeleteTarget(null)
    })
  }

  if (!sites) return <Loading />

  return (
    <div className="space-y-4">
      <BranchStatsCards sites={sites} />

      <BranchToolbar
        filter={filter}
        onFilterChange={setFilter}
        onAddNew={() => {
          setEditData(null)
          setFormOpen(true)
        }}
      />

      <BranchTable
        sites={filteredSites}
        onSelectSite={setSelectedSite}
        onEditSite={handleOpenEdit}
        onDeleteSite={setDeleteTarget}
      />

      <BranchDrawer
        site={selectedSite}
        onClose={() => setSelectedSite(null)}
        onEdit={s => {
          setSelectedSite(null)
          handleOpenEdit(s)
        }}
      />

      <BranchFormModal
        open={formOpen}
        editData={editData}
        existingDms={existingDms}
        saving={saving}
        onClose={() => {
          setFormOpen(false)
          setEditData(null)
        }}
        onSave={handleSaveSite}
      />

      <BranchDeleteModal
        site={deleteTarget}
        saving={saving}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
