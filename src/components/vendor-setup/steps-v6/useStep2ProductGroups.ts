'use client'

import { useState, useEffect } from 'react'
import type { VendorApplicationFormV6 } from '../types-v6'
import type { ProductGroupRateConfig, VendorServiceMode } from '@/lib/validations/vendor-product-group.schema'
import type { MasterGroupMeta } from './ProductGroupRateModal'

const FALLBACK_CIN_NAMES = [
  'เครื่องใช้ไฟฟ้าขนาดเล็ก', 'เครื่องใช้ไฟฟ้าในครัว', 'เครื่องใช้ไฟฟ้าประปา',
  'เครื่องใช้ไฟฟ้าภายในสวน', 'ปั๊มน้ำ', 'ปั๊มน้ำอัตโนมัติ', 'เครื่องมือช่าง',
]

const FALLBACK_ONS_NAMES = [
  'ปั๊มน้ำ', 'เครื่องปรับอากาศ', 'เครื่องซักผ้า', 'ตู้เย็น', 'ตู้แช่',
  'ปั๊มน้ำอัตโนมัติ', 'ทีวี', 'เครื่องใช้ไฟฟ้าขนาดใหญ่',
]

export function useStep2ProductGroups(
  form: VendorApplicationFormV6,
  onChange: (patch: Partial<VendorApplicationFormV6>) => void
) {
  const [cinMeta, setCinMeta] = useState<MasterGroupMeta[]>([])
  const [onsMeta, setOnsMeta] = useState<MasterGroupMeta[]>([])
  const [modalState, setModalState] = useState<{
    open: boolean
    serviceType: VendorServiceMode
    isAddingCustom: boolean
    groupName: string
  }>({ open: false, serviceType: 'CARRY_IN', isAddingCustom: false, groupName: '' })

  useEffect(() => {
    let cancelled = false
    fetch('/api/vendors/product-groups')
      .then(r => (r.ok ? r.json() : null))
      .then((data: { carryIn?: MasterGroupMeta[]; onSite?: MasterGroupMeta[] } | null) => {
        if (cancelled || !data) return
        if (Array.isArray(data.carryIn) && data.carryIn.length > 0) setCinMeta(data.carryIn)
        if (Array.isArray(data.onSite) && data.onSite.length > 0) setOnsMeta(data.onSite)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  const cinNames = cinMeta.length > 0 ? cinMeta.map(g => g.name) : FALLBACK_CIN_NAMES
  const onsNames = onsMeta.length > 0 ? onsMeta.map(g => g.name) : FALLBACK_ONS_NAMES
  const rates = form.productGroupRates || []

  const closeModal = () => setModalState(s => ({ ...s, open: false }))

  const openModal = (serviceType: VendorServiceMode, groupName: string, isAddingCustom = false) => {
    setModalState({ open: true, serviceType, isAddingCustom, groupName })
  }

  const removeGroupSelection = (serviceType: VendorServiceMode, name: string) => {
    const nextRates = rates.filter(r => !(r.serviceType === serviceType && r.groupName === name))
    if (serviceType === 'CARRY_IN') {
      onChange({ cinProducts: form.cinProducts.filter(p => p !== name), productGroupRates: nextRates })
    } else {
      const nextDetails = { ...form.productDetails }
      delete nextDetails[name]
      onChange({
        onsProducts: form.onsProducts.filter(p => p !== name),
        productDetails: nextDetails,
        productGroupRates: nextRates,
      })
    }
    closeModal()
  }

  const handleToggleCheckbox = (serviceType: VendorServiceMode, name: string, currentlyChecked: boolean) => {
    if (currentlyChecked) removeGroupSelection(serviceType, name)
    else openModal(serviceType, name, false)
  }

  const handleSaveRate = (config: ProductGroupRateConfig) => {
    const nextRates = [
      ...rates.filter(r => !(r.serviceType === config.serviceType && r.groupName === config.groupName)),
      config,
    ]
    if (config.serviceType === 'CARRY_IN') {
      const nextCin = form.cinProducts.includes(config.groupName)
        ? form.cinProducts
        : [...form.cinProducts, config.groupName]
      onChange({
        cinProducts: nextCin,
        productGroupRates: nextRates,
        cinFee: String(config.minInspectionFee),
        gpPct: `${config.gpPct}%`,
      })
    } else {
      const nextOns = form.onsProducts.includes(config.groupName)
        ? form.onsProducts
        : [...form.onsProducts, config.groupName]
      const nextDetails = {
        ...form.productDetails,
        [config.groupName]: config.tasks ?? { repair: true, replacePart: true, install: false },
      }
      onChange({
        onsProducts: nextOns,
        productDetails: nextDetails,
        productGroupRates: nextRates,
        onsFee: String(config.minInspectionFee),
        gpPct: `${config.gpPct}%`,
      })
    }
    closeModal()
  }

  const activeMetaList = modalState.serviceType === 'CARRY_IN' ? cinMeta : onsMeta
  const activeExistingNames = modalState.serviceType === 'CARRY_IN'
    ? Array.from(new Set([...cinNames, ...form.cinProducts]))
    : Array.from(new Set([...onsNames, ...form.onsProducts]))

  return {
    cinNames,
    onsNames,
    rates,
    modalState,
    activeMetaList,
    activeExistingNames,
    openModal,
    closeModal,
    handleToggleCheckbox,
    handleSaveRate,
    removeGroupSelection,
  }
}
