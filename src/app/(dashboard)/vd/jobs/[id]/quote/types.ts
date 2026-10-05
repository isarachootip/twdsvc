export type LineType = 'PART' | 'LABOR' | 'OTHER'

export interface QuoteLineItem {
  key: number
  type: LineType
  description: string
  unitPrice: string
  partWaitDays: string
  partWarrantyDays: string
}

export interface QuoteTotals {
  partsTotal: number
  openFee: number
  subtotal: number
  vat: number
  total: number
}

export interface VendorParentInfo {
  id?: string
  code?: string
  name?: string
  repairWarrantyDays?: number
  inspectionFeeCovered?: number
  inspectionFeeNotCovered?: number
}

export interface VendorCenterOption {
  id: string
  code: string
  name?: string
  vendorParent?: VendorParentInfo | null
}

export interface QuoteLineDetail {
  type: string
  description: string
  unitPrice: number
  quantity: number
  partWaitDays?: number | null
  partWarrantyDays?: number | null
}

export interface QuoteDetail {
  quoteNo: string
  status: string
  subtotal: number
  vatAmount: number
  total: number
  repairDays: number
  repairWarrantyDays: number
  vendorNote?: string | null
  lines: QuoteLineDetail[]
}

export interface QuoteJobInfo {
  id: string
  jobNo: string
  productName: string
  brandName?: string | null
  symptom?: string | null
  hasWarranty: boolean
  vendorCenterId?: string | null
  version: number
  customerName?: string | null
  branch?: { name?: string; address?: string } | null
  vendor?: { inspectionFee?: number; repairWarrantyDays?: number } | null
  vendorCenter?: VendorCenterOption | null
  quotes?: QuoteDetail[]
}
