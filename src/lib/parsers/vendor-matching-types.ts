export interface RawVdDataRow {
  'ลำดับ'?: number | string
  'Vendor ID'?: number | string
  'Match\r\nVs จัดซื้อ'?: string
  'Match Vs พีออม'?: string
  Type?: string
  'vendor name'?: string
  'Brand ในสังกัด'?: string
  'ประเภท/กลุ่มสินค้าที่มีจำหน่าย'?: string
  'จุดรับสินค้า'?: string
  Address?: string
  'ระยะเวลาโดยรวม (รับ/ประเมิน/ซ่อม/ส่งกลับ)\r\nณ จุดรับสินค้า (วัน) / ประเมินราคาซ่อม / ระยะเวลาดำเนินการซ่อม / ระยะเวลาส่งสินค้ากลับ'?: string
  'เร็วสุด (วัน)'?: number | string
  'ช้าสุด (วัน)'?: number | string
  'ON AVG (วัน)'?: number | string
}

export interface RawVendorBrandRow {
  'รหัส VD'?: number | string
  'ชื่อ Vendor'?: string
  'รายชื่อ Brand ที่รับผิดชอบ'?: string
}

export interface RawSkuPartRow {
  SKU_Number?: number | string
  'ชื่อสินค้า'?: string
  Brand?: string
  'รหัส VD'?: number | string
  'ชื่อ VD'?: string
  ClassName?: string
  SClassname?: string
}

export type VendorParticipationType =
  | 'PARTICIPATING_WITH_HISTORY'
  | 'PARTICIPATING_NO_HISTORY'
  | 'NON_PARTICIPATING'

export interface ParsedVendor {
  vendorId: string
  name: string
  participationType: VendorParticipationType
  active: boolean
  isBrandAuthorized: boolean
  dropPoint: string
  address: string | null
  postalCode: string | null
  deliveryMethod: string
  slaDays: number
  leadTimesRaw: string | null
  brands: string[]
}

export interface ParsedBrandMapping {
  vendorId: string
  vendorName: string
  brandNames: string[]
}

export interface ParsedSkuPart {
  sku: string
  productName: string
  brand: string
  vendorNo: string
  vendorName: string
  className?: string
  sclassName?: string
}

export interface BranchRouteTarget {
  branchId: string
  branchCode: string
  province: string
  postalCode?: string | null
  vendorCenterId: string
  standardChannel: 'DC' | 'DSD' | 'TPL'
}
