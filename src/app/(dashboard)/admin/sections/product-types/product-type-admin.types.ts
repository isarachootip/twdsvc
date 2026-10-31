import type { VendorServiceMode } from '@/lib/validations/vendor-product-group.schema'

export interface AdminProductTypeRow {
  id: number
  serviceType: VendorServiceMode
  name: string
  minInspectionFee: number
  recommendedFee: number
  minGpPct: number
  defaultGpPct: number
  skuKeywords: string | null
  sortOrder: number
  active: boolean
  vendorCount: number
  jobCount: number
}

export interface AdminCustomVendorGroup {
  key: string
  serviceType: VendorServiceMode
  name: string
  suggestedFee: number
  suggestedGpPct: number
  vendorNames: string[]
  sourceCount: number
}

export interface AdminProductTypeOverviewResponse {
  groups: AdminProductTypeRow[]
  customGroups: AdminCustomVendorGroup[]
}

export interface ProductTypeFormDraft {
  id?: number
  serviceType: VendorServiceMode
  name: string
  minInspectionFee: number
  recommendedFee: number
  minGpPct: number
  defaultGpPct: number
  skuKeywords: string
  sortOrder: number
  active: boolean
}
