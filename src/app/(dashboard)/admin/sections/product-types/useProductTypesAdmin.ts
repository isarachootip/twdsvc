'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui/Toast'
import type { VendorServiceMode } from '@/lib/validations/vendor-product-group.schema'
import type {
  AdminCustomVendorGroup,
  AdminProductTypeOverviewResponse,
  AdminProductTypeRow,
  ProductTypeFormDraft,
} from './product-type-admin.types'

export function useProductTypesAdmin() {
  const [groups, setGroups] = useState<AdminProductTypeRow[]>([])
  const [customGroups, setCustomGroups] = useState<AdminCustomVendorGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState<'ALL' | VendorServiceMode>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [draft, setDraft] = useState<ProductTypeFormDraft | null>(null)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [promotingKey, setPromotingKey] = useState<string | null>(null)
  const { toast } = useToast()

  const load = useCallback(() => {
    setLoading(true)
    api<AdminProductTypeOverviewResponse>('/api/admin/vendor-product-groups?overview=1')
      .then(res => {
        setGroups(res.groups ?? [])
        setCustomGroups(res.customGroups ?? [])
      })
      .catch(() => toast('โหลดข้อมูล Master ประเภทสินค้าไม่สำเร็จ', 'error'))
      .finally(() => setLoading(false))
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return groups.filter(g => {
      if (modeFilter !== 'ALL' && g.serviceType !== modeFilter) return false
      if (statusFilter === 'ACTIVE' && !g.active) return false
      if (statusFilter === 'INACTIVE' && g.active) return false
      if (term) {
        const hay = `${g.name} ${g.skuKeywords ?? ''}`.toLowerCase()
        if (!hay.includes(term)) return false
      }
      return true
    })
  }, [groups, modeFilter, statusFilter, search])

  const uniqueCsCount = useMemo(
    () => new Set(groups.filter(g => g.active).map(g => g.name.trim())).size,
    [groups]
  )

  const openCreateModal = () => {
    const defaultMode: VendorServiceMode = modeFilter === 'ON_SITE' ? 'ON_SITE' : 'CARRY_IN'
    setDraft({
      serviceType: defaultMode,
      name: '',
      minInspectionFee: 0,
      recommendedFee: defaultMode === 'ON_SITE' ? 500 : 300,
      minGpPct: 0,
      defaultGpPct: 18,
      skuKeywords: '',
      sortOrder: (groups.filter(g => g.serviceType === defaultMode).length + 1) * 10,
      active: true,
    })
  }

  const openEditModal = (row: AdminProductTypeRow) => {
    setDraft({
      id: row.id,
      serviceType: row.serviceType,
      name: row.name,
      minInspectionFee: row.minInspectionFee,
      recommendedFee: row.recommendedFee,
      minGpPct: row.minGpPct,
      defaultGpPct: row.defaultGpPct,
      skuKeywords: row.skuKeywords ?? '',
      sortOrder: row.sortOrder,
      active: row.active,
    })
  }

  const handleSaveDraft = async () => {
    if (!draft) return
    if (!draft.name.trim()) {
      toast('กรุณาระบุชื่อประเภทสินค้า', 'error')
      return
    }
    setSaving(true)
    try {
      await api('/api/admin/vendor-product-groups', { method: 'POST', body: draft })
      toast(`บันทึกประเภทสินค้า "${draft.name.trim()}" เรียบร้อยแล้ว`, 'success')
      setDraft(null)
      load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (row: AdminProductTypeRow) => {
    setTogglingId(row.id)
    try {
      await api('/api/admin/vendor-product-groups', { method: 'POST', body: { ...row, active: !row.active } })
      toast(`${!row.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} "${row.name}" แล้ว`, 'success')
      load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'อัปเดตสถานะไม่สำเร็จ', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (row: AdminProductTypeRow) => {
    try {
      await api(`/api/admin/vendor-product-groups?id=${row.id}`, { method: 'DELETE' })
      toast(`ลบประเภทสินค้า "${row.name}" แล้ว`, 'info')
      load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'ไม่สามารถลบได้', 'error')
    }
  }

  const handlePromoteCustom = async (item: AdminCustomVendorGroup) => {
    setPromotingKey(item.key)
    try {
      await api('/api/admin/vendor-product-groups', {
        method: 'POST',
        body: {
          action: 'PROMOTE',
          serviceType: item.serviceType,
          name: item.name,
          recommendedFee: item.suggestedFee,
          defaultGpPct: item.suggestedGpPct,
        },
      })
      toast(`อนุมัติ "${item.name}" เข้า Master ประเภทสินค้าเรียบร้อยแล้ว`, 'success')
      load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'อนุมัติเข้า Master ไม่สำเร็จ', 'error')
    } finally {
      setPromotingKey(null)
    }
  }

  return {
    groups, customGroups, loading, search, setSearch,
    modeFilter, setModeFilter, statusFilter, setStatusFilter,
    draft, setDraft, saving, togglingId, promotingKey,
    filteredRows, uniqueCsCount, openCreateModal, openEditModal,
    handleSaveDraft, handleToggleActive, handleDelete, handlePromoteCustom,
  }
}
