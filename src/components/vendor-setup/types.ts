export interface BranchItemUI {
  id: string
  branchName: string
  address: string
  province: string
  amphoe: string
  phone: string
  photo: string | null
  radius: number
  vip: boolean
  express: boolean
}

export interface SvcBranchSite {
  id: string
  code: string
  nickname: string
  name: string
  province: string
  region: string
}

export interface RouteCoverageUI {
  transport: 'pickup' | 'dc' | 'tpl'
  days: string[]
  times: string[]
  frequency: string
  note: string
  transitDays: string
  vendorDeliveryAddressId: string | null
}

export interface VendorSetupFormData {
  store: {
    name: string
    type: 'บุคคลธรรมดา' | 'ห้างหุ้นส่วนจำกัด' | 'บริษัทจำกัด' | 'วิสาหกิจชุมชน' | ''
    taxId: string
    phone: string
    lineId: string
    branches: BranchItemUI[]
  }
  expertise: {
    appliances: Record<string, boolean>
    isBrandAuthorized: boolean
    defaultSlaDays: number
    warrantyDays: number
  }
  coverage: {
    coverage: Record<string, RouteCoverageUI>
  }
  finance: {
    bank: string
    accNo: string
    accName: string
    commission: boolean
    documents: {
      idcard: string
      company: string
      license: string
      portfolio: string[]
    }
  }
  agreements: {
    agreements: {
      sla: boolean
      pdpa: boolean
      standard: boolean
      transportDamage: boolean
      warrantyRepeat: boolean
    }
    signatureUrl: string
  }
}
