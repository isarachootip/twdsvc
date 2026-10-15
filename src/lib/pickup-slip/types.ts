import { z } from 'zod'

export type PickupRouteType = 'GR_TO_DC' | 'GR_TO_VD' | 'DC_TO_VD' | 'DC_TO_GR'

export const pickupSlipMetaSchema = z.object({
  pickupSlipNo: z.string().trim().max(64).optional(),
  driverName: z.string().trim().max(120).optional(),
  driverPhone: z.string().trim().max(60).optional(),
  vehiclePlate: z.string().trim().max(60).optional(),
  carrierLabel: z.string().trim().max(80).optional(),
  scheduledDate: z.string().trim().max(32).optional(),
  scheduledTime: z.string().trim().max(32).optional(),
  boxCount: z.number().int().min(1).max(99).optional(),
  senderName: z.string().trim().max(120).optional(),
  senderPhone: z.string().trim().max(60).optional(),
  receiverName: z.string().trim().max(120).optional(),
  receiverPhone: z.string().trim().max(60).optional(),
})

export type PickupSlipMeta = z.infer<typeof pickupSlipMetaSchema>

export interface PickupSlipItem {
  jobId?: string
  jobNo: string
  productName: string
  serialNo: string
  customerName: string
  symptom: string
  boxCount: number
  branchName: string
  dcLocation: string
}

export interface PickupSlipData {
  route: PickupRouteType
  docNo: string
  badgeCode: string
  badgeSub: string
  headerTitle: string
  headerSub: string
  originTag: string
  originName: string
  originContact: string
  originPhone: string
  destTag: string
  destName: string
  destContact: string
  destPhone: string
  driverName: string
  driverPhone: string
  vehiclePlate: string
  carrierLabel: string
  scheduledDate: string
  scheduledTime: string
  items: PickupSlipItem[]
  totalJobs: number
  totalBoxes: number
  printTwoCopies: boolean
  checklistTitle: string
  sign1Title: string
  sign1Sub: string
  sign3Title: string
  sign3Sub: string
}
