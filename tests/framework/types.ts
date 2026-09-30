import { SPEC_ORACLE } from './oracle'

export interface MockUser {
  id: string
  username: string
  fullName: string
  role: 'ADMIN' | 'EXECUTIVE' | 'CS' | 'GR' | 'DC' | 'VD' | 'S2'
  siteId?: string
  vendorCenterId?: string
  active: boolean
}

export interface MockJob {
  id: string
  jobNo: string
  type: 'CUSTOMER' | 'STOCK'
  stage: (typeof SPEC_ORACLE.STAGES)[number]
  channel: 'DC' | 'DSD' | 'TPL'
  branchId: string
  vendorCenterId: string
  customerName: string
  customerPhone: string
  productName: string
  brandName: string
  sizeCategory: 'SMALL' | 'LARGE'
  hasWarranty: boolean
  shippingMethod: 'STANDARD' | 'EXPRESS'
  symptom?: string | null
  serialNo?: string | null
  version: number
  decision: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AUTO_APPROVED'
  closedAt: Date | null
  charges: Array<{ type: string; amountSatang: number }>
  payments: Array<{ amountSatang: number; status: 'PENDING' | 'PAID' | 'VOIDED'; method: string }>
  quotes: Array<{
    version: number
    subtotalSatang: number
    vatSatang: number
    totalSatang: number
    status: 'SENT' | 'SUPERSEDED' | 'APPROVED' | 'REJECTED'
  }>
  slaClocks: Array<{
    stepCode: string
    status: 'RUNNING' | 'PAUSED' | 'STOPPED'
    startedAt: Date
    dueAt: Date
    pausedMinutes: number
    stoppedAt: Date | null
  }>
  events: Array<{ type: string; fromStage: string; toStage: string; timestamp: Date; actorRole: string }>
  tokens: Array<{ type: string; token: string; expiresAt: Date; usedAt: Date | null }>
}
