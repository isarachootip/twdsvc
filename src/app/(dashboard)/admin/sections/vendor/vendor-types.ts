export interface VendorCenterRow {
  id?: string
  code: string
  zoneSiteId?: string
  address?: string
  postalCode?: string
  phone?: string
  deliveryMethod: string
  gpPctOverride?: number | string
  repairSlaDaysOverride?: number | string
}

export interface VendorParentRow {
  id?: string
  code: string
  name: string
  defaultGpPct: number | string
  defaultRepairSlaDays: number | string
  inspectionFeeCovered: number | string
  inspectionFeeNotCovered: number | string
  repairWarrantyDays: number | string
  isBrandAuthorized: boolean
  brandIds: number[]
  sizeIds: number[]
  centers: VendorCenterRow[]
  active?: boolean
}

export interface NamedOption {
  id: number
  name: string
}

export interface VendorFilterState {
  search: string
  authorized: 'ALL' | 'AUTH' | 'GENERAL'
}

export function createEmptyVendor(): VendorParentRow {
  return {
    code: '',
    name: '',
    defaultGpPct: 18,
    defaultRepairSlaDays: 7,
    repairWarrantyDays: 30,
    inspectionFeeCovered: 0,
    inspectionFeeNotCovered: 300,
    isBrandAuthorized: false,
    brandIds: [],
    sizeIds: [],
    centers: [],
  }
}
