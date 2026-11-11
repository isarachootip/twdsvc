import type { ProductGroupRateConfig } from './validations/vendor-product-group.schema'

export type ApplicationStatusType = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

export interface ResolvedSiteMeta {
  code: string
  nickname: string
  name: string
  province: string
}

export interface RawVendorApplicationRecord {
  id: string
  applicationNo: string
  status: ApplicationStatusType
  storeName: string
  businessType: string
  taxId: string
  phone: string
  email?: string | null
  lineId?: string | null
  branches: unknown
  appliances: unknown
  isBrandAuthorized: boolean
  coverage: unknown
  documents: unknown
  bank: unknown
  agreements: unknown
  signatureUrl?: string | null
  estimatedTier: string
  estimatedCases?: number
  score: number
  approvedParentId?: string | null
  adminNotes?: string | null
  reviewedBy?: string | null
  reviewerName?: string | null
  reviewedAt?: Date | string | null
  createdAt: Date | string
  resolvedSites?: Record<string, ResolvedSiteMeta>
}

export interface NormalizedAddress {
  line1: string
  subdistrict: string
  district: string
  province: string
  zip: string
  phone: string
  note: string
}

export interface NormalizedBranchItem extends NormalizedAddress {
  contactName: string
}

export interface NormalizedAuthorizedBrand {
  brand: string
  productType: string
  certNo: string
  expireDate: string
}

export interface NormalizedCoverageRoute {
  siteKey: string
  siteDisplayName: string
  siteFullName: string
  province: string
  onsite: boolean
  respBranchIdx: number
  respBranchLabel: string
}

export interface NormalizedDocumentItem {
  key: string
  label: string
  fileUrl: string | null
}

export interface NormalizedAgreementCheck {
  key: string
  label: string
  accepted: boolean
}

export const STANDARD_VENDOR_DOC_FIELDS = [
  { key: 'file_0', label: '1. สำเนาหนังสือรับรองบริษัท (DBD)' },
  { key: 'file_1', label: '2. สำเนา ภ.พ.20' },
  { key: 'file_2', label: '3. สำเนาหน้าสมุดบัญชีธนาคาร' },
  { key: 'file_3', label: '4. สำเนาบัตรประชาชนผู้มีอำนาจลงนาม' },
  { key: 'file_4', label: '5. หนังสือแต่งตั้ง Authorized จากแบรนด์ (ถ้ามี)' },
  { key: 'file_5', label: '6. หนังสือรับรอง / วุฒิบัตรช่าง' },
  { key: 'file_6', label: '7. สำเนากรมธรรม์ประกันภัย (ถ้ามี)' },
  { key: 'file_7', label: '8. รูปถ่ายหน้าร้าน / ศูนย์บริการ' },
] as const

export const STANDARD_AGREEMENT_ITEMS = [
  { key: 'sla', label: 'ยินดีปฏิบัติตาม SLA และมาตรฐานการบริการที่ไทวัสดุกำหนด' },
  { key: 'inspect', label: 'ยินดีให้ตรวจสอบสถานที่ เครื่องมือ และทีมงานก่อนเริ่มโครงการ' },
  { key: 'reportApp', label: 'มีระบบปิดงานและรายงานสถานะตามที่บริษัทกำหนด' },
  { key: 'training', label: 'พร้อมเข้ารับการอบรมก่อนเริ่มปฏิบัติงานจริง' },
  { key: 'pdpa', label: 'ยินยอมให้จัดเก็บข้อมูล และปฏิบัติตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA)' },
  { key: 'truth', label: 'รับรองว่าข้อมูลและเอกสารทั้งหมดที่ระบุในแบบฟอร์มนี้เป็นความจริงทุกประการ' },
] as const

export interface NormalizedVendorApplication {
  id: string
  applicationNo: string
  status: ApplicationStatusType
  estimatedTier: string
  score: number
  createdAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  reviewerName: string | null
  adminNotes: string | null
  approvedParentId: string | null
  section1: {
    supplierRegistered: string
    spcode: string
    entityType: string
    storeName: string
    regNo: string
    taxId: string
    companyAddr: NormalizedAddress
    branchType: string
    branches: NormalizedBranchItem[]
    isBrandAuthorized: boolean
    authorizedText: string
    authorizedBrands: NormalizedAuthorizedBrand[]
    primaryContact: { name: string; pos: string; phone: string; email: string; line: string }
    backupContact: { name: string; phone: string; timeStart: string; timeEnd: string }
    authorizer: { name: string; pos: string; phone: string; email: string }
    bank: { accName: string; accNo: string; bank: string; bankBranch: string; vat20: string }
  }
  section2: {
    cinProducts: string[]
    cinAllBrands: boolean
    cinBrands: string[]
    cinReceiveMethod: string
    onsProducts: string[]
    onsAllBrands: boolean
    onsBrands: string[]
    productDetails: Record<string, { repair: boolean; replacePart: boolean; install: boolean }>
    productGroupRates: ProductGroupRateConfig[]
    productNote: string
  }
  section3: {
    techTotal: number | null
    techOut: number | null
    onsTech: number | null
    onsTeams: number | null
    onsBackup: number | null
    onsCapDay: number | null
    onsCapMonth: number | null
  }
  section4: {
    cinDays: string[]
    cinOpen: string
    cinClose: string
    cinPickDays: string[]
    cinPickStart: string
    cinPickEnd: string
    onsDays: string[]
    onsHours: string
    onsAppt: string
    onsFast: number | null
    onsQueue: number | null
  }
  section5: {
    onsRadius: string
    activeRoutes: NormalizedCoverageRoute[]
  }
  section6: { cinFee: string; onsFee: string; feeCondition: string; priceNote: string }
  section7: { gpPct: string; creditTerm: string; billingCycle: string }
  section8: { cinSlaDays: string; onsSlaApptHours: string; onsSlaArrivalDays: string }
  section9: { damageLiability: string; safetyStandards: string[]; onsiteTools: string[] }
  section10: {
    documents: NormalizedDocumentItem[]
    agreements: NormalizedAgreementCheck[]
    signName: string
    signPos: string
    signatureUrl: string | null
  }
}
