import { z } from 'zod'

export const customerSearchSchema = z.object({
  q: z.string().optional().default(''),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type CustomerSearchInput = z.infer<typeof customerSearchSchema>

export const customerPhoneParamSchema = z.object({
  phone: z.string().min(8, 'เบอร์โทรศัพท์ต้องมีอย่างน้อย 8 หลัก').max(20),
})

export interface CustomerSummary {
  phone: string
  name: string
  jobCount: number
  activeJobCount: number
  lastVisitedAt: Date | string | null
  lastBranchName: string | null
  productCount: number
}

export interface DeviceRepairRecord {
  jobId: string
  jobNo: string
  stage: string
  openedAt: Date | string
  closedAt: Date | string | null
  branchName: string
  symptom: string | null
  hasWarranty: boolean
  totalCharges: number
}

export interface CustomerDevice {
  deviceKey: string
  serialNo: string | null
  brandName: string
  productName: string
  sku: string | null
  repairCount: number
  lastRepairedAt: Date | string
  jobs: DeviceRepairRecord[]
}

export interface CustomerDetailProfile {
  phone: string
  name: string
  address: string | null
  zip: string | null
  taxInvoiceName: string | null
  taxInvoiceId: string | null
  taxInvoiceAddr: string | null
  stats: {
    totalJobs: number
    activeJobs: number
    completedJobs: number
    totalSpendBaht: number
    firstSeenAt: Date | string | null
    lastSeenAt: Date | string | null
  }
  devices: CustomerDevice[]
}
