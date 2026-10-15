// Types for Thaiwasadu Service Center Shipping Labels (DC, VD, KEX 3PL)

export interface ThaiwasaduDestination {
  stepNumber?: number
  stepType: string // e.g. "คลังสินค้า DC" หรือ "ศูนย์ซ่อม VD - VD-0088-1"
  name: string // e.g. "คลังสินค้า DC วังน้อย" หรือ "บ.ช่างเจริญ"
  contactPerson?: string
  phone?: string
  address?: string
  isHighlighted?: boolean
}

export interface ThaiwasaduLabelData {
  type: 'DC' | 'VD'
  headerBadge: string // "ผ่าน DC" หรือ "ส่งตรง VD"
  jobNo: string
  qrValue: string
  box: string // "1/1"
  origin: {
    name: string
    code: string // e.g. "BNA"
  }
  customer: {
    name: string
    phone: string
  }
  symptom: string
  openDate: string
  destinations: ThaiwasaduDestination[]
  product: {
    name: string
    serialNo: string
    sendDate: string
  }
  barcodeValue: string
}

export interface KexLabelData {
  type: 'KEX'
  trackingNo: string
  barcodeValue: string
  sortCodeTop: string // "B3*E1-N14"
  sortCodeHub: string // "KBB"
  sortCodeSub: string // "KBB002"
  pieces: string // "1 Of 1"
  recipient: {
    name: string
    phone: string
    address: string
    postalCode: string
  }
  qrValue: string
  sortCodeMid: string // "B3*E1-N14"
  remarks?: string
  actWt?: string
  dim?: string
  portalCheckedText?: string
}

export interface ReturnBoxLabelData {
  title: string
  subtitle?: string
  jobNo: string
  rows: Array<[string, string]>
  headerBadge?: string
  channelLabel?: string
  box?: string
  dateText?: string
  trackingNo?: string | null
  origin?: {
    roleLabel: string
    name: string
    phone?: string | null
    address?: string | null
  }
  destination?: {
    roleLabel: string
    name: string
    code: string
    address?: string | null
  }
  product?: {
    name: string
    sku?: string | null
    serialNo?: string | null
    repairOutcome?: string
  }
  customer?: {
    name: string
    phone?: string | null
  }
}

export type UnifiedShippingLabelData = ThaiwasaduLabelData | KexLabelData

