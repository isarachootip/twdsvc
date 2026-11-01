export interface QuoteLine {
  type: string
  description: string
  unitPrice: number
  quantity: number
  partWaitDays?: number
  partWarrantyDays?: number
}

export interface QuoteData {
  job: {
    id: string
    jobNo: string
    productName: string
    brandName: string
    serialNo?: string | null
    symptom?: string | null
    shippingMethod?: string | null
    openedAt?: string | null
    operationFeePaid?: number | null
    branchName: string
    branchPhone?: string | null
    storeManagerName?: string | null
    vendorName?: string | null
    customerName?: string | null
    hasWarranty: boolean
    version: number
    stage: string
  }
  quote: {
    quoteNo: string
    version: number
    subtotal: number
    vatAmount: number
    total: number
    repairDays: number
    repairWarrantyDays: number
    vendorNote?: string | null
    sentAt?: string | null
    expiresAt?: string | null
    managerSignatureUrl?: string | null
    managerSignerName?: string | null
    isManagerProxy?: boolean
    managerSignedAt?: string | null
    customerSignatureUrl?: string | null
    customerSignedAt?: string | null
    lines: QuoteLine[]
  }
  photos: string[]
  payUrl?: string | null
  token: string
  expired: boolean
  decided: boolean
  decision?: string
}

export interface QuoteActionDone {
  type: 'APPROVED' | 'REJECTED'
  message: string
  payUrl?: string | null
}
