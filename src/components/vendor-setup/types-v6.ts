export interface AuthorizedBrandItem {
  brand: string
  productType: string
  certNo: string
  expireDate: string
}

export interface AddressInfo {
  line1: string
  subdistrict: string
  district: string
  province: string
  zip: string
  phone?: string
  note?: string
}

export interface CenterBranchItem extends AddressInfo {
  contactName: string
}

export interface ContactPerson {
  name: string
  pos: string
  phone: string
  email: string
  line?: string
}

export interface BackupContactPerson {
  name: string
  phone: string
  timeStart: string
  timeEnd: string
}

export interface BankAccountInfo {
  accName: string
  accNo: string
  bank: string
  bankBranch: string
  vat20: 'มี' | 'ไม่มี'
}

export interface ProductDetailItem {
  repair: boolean
  replacePart: boolean
  install: boolean
}

export interface VendorApplicationFormV6 {
  // Step 1: ข้อมูลบริษัทและศูนย์บริการ
  supplierRegistered: 'เคยลงทะเบียนทำการค้ากับไทวัสดุ' | 'ไม่เคยลงทะเบียนทำการค้ากับไทวัสดุ' | ''
  spcode: string
  entityType: string
  company: string
  regNo: string
  taxId: string
  companyAddr: AddressInfo
  branchType: 'มีศูนย์บริการหลายสาขา' | 'ศูนย์บริการเดียว' | ''
  branches: CenterBranchItem[]
  authorized: 'เป็นศูนย์บริการ Authorized ของแบรนด์ (ระบุในตาราง)' | 'ไม่ได้เป็นศูนย์บริการ Authorized' | ''
  authorizedBrands: AuthorizedBrandItem[]
  primaryContact: ContactPerson
  backupContact: BackupContactPerson
  authorizer: ContactPerson
  bank: BankAccountInfo

  // Step 2: ประเภทสินค้าและรูปแบบบริการ
  cinProducts: string[]
  cinBrands: string[]
  cinReceiveMethod: string
  onsProducts: string[]
  onsBrands: string[]
  productDetails: Record<string, ProductDetailItem>
  productNote: string

  // Step 3: ทีมช่างและกำลังการให้บริการ
  techTotal: number
  techOut: number
  onsTech: number
  onsTeams: number
  onsCapDay: number
  onsCapMonth: number
  onsBackup: number

  // Step 4: วันและเวลาทำการ
  cinDays: string[]
  cinOpen: string
  cinClose: string
  cinPickDays: string[]
  cinPickStart: string
  cinPickEnd: string
  onsDays: string[]
  onsHours: string
  onsAppt: string
  onsFast: number
  onsQueue: number

  // Step 5: พื้นที่ให้บริการและการจับคู่สาขา
  onsRadius: string
  coverage: Record<string, { onsite: boolean; respBranchIdx: number }>

  // Step 6: ราคาและค่าเปิดเครื่อง
  cinFee: string
  onsFee: string
  feeCondition: string
  priceNote: string

  // Step 7: GP และเงื่อนไขการค้า
  gpPct: string
  creditTerm: string
  billingCycle: string

  // Step 8: SLA
  cinSlaDays: string
  onsSlaApptHours: string
  onsSlaArrivalDays: string

  // Step 9: การรับประกันและความปลอดภัย
  damageLiability: string
  safetyStandards: string[]
  onsiteTools: string[]

  // Step 10: เอกสารประกอบและข้อตกลง
  documents: Record<string, string> // e.g. file_0: url
  agreements: {
    sla: boolean
    inspect: boolean
    reportApp: boolean
    training: boolean
    pdpa: boolean
    truth: boolean
  }
  signName: string
  signPos: string
}
