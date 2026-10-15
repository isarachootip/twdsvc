export interface RepairReceiptBranchInfo {
  code?: string | null
  stCode?: string | null
  name: string
  legalName?: string | null
  address?: string | null
  subdistrict?: string | null
  district?: string | null
  province?: string | null
  postalCode?: string | null
  phone?: string | null
}

export interface RepairReceiptData {
  docType?: 'INTAKE' | 'RETURN'
  jobNo: string
  dateText: string
  branch: RepairReceiptBranchInfo
  customerName: string
  customerPhone: string
  customerAddress?: string | null
  sku?: string | null
  serialNo?: string | null
  productName: string
  brandName: string
  hasWarranty: boolean
  symptom: string
  defect?: string | null
  sizeName?: string | null
  shippingMethodText?: string | null
  vendorLabel?: string | null
  quoteNo?: string | null
  posReceiptNo?: string | null
  repairDays?: number | null
  expectedPickupDate?: string | null
  repairedSummary?: string | null
  amountBaht: number
  paid: boolean
  trackingUrl?: string | null
  customerSignatureUrl?: string | null
  logoUrl?: string | null
  companyName?: string | null
  taxId?: string | null
  footerNotes?: string[] | null
}

export const DEFAULT_RECEIPT_REMARKS = [
  'โปรดเก็บเอกสารเพื่อเป็นหลักฐานในการตรวจสอบรายละเอียดการซ่อมสินค้า',
  'บริษัทขอสงวนสิทธิ์ เรียกเก็บค่าใช้จ่ายที่เกิดขึ้นตามจริง หากสินค้าไม่ได้อยู่ในการรับประกัน',
  'บริษัทขอสงวนสิทธิ์ในการรับฝากสินค้าซ่อมไม่เกิน 14 วันนับจากวันที่สินค้าซ่อมเสร็จ',
  'กำหนดระยะเวลาส่งซ่อมโดยประมาณ ไม่เกิน 30 วัน',
  'บริษัทฯ รับประกันหลังการซ่อม ภายใน 30 วัน (เงื่อนไขเป็นไปตามข้อกำหนดของ Supplier)',
]
