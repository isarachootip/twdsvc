import { z } from 'zod'

export const LON_NOTIFICATION_TYPES = [
  'SEND_TO_REPAIR',
  'SEND_PRICE',
  'STATUS_REPAIR',
  'REJECT_REPAIR',
  'RECEIVE_JOB',
  'SATISFACTION',
] as const

export type LonType = (typeof LON_NOTIFICATION_TYPES)[number]

export const LON_DELIVERY_STATUSES = ['SENT', 'SIMULATED', 'SKIPPED', 'FAILED'] as const
export type LonStatus = (typeof LON_DELIVERY_STATUSES)[number]

export const LON_ENDPOINTS: Record<LonType, string> = {
  SEND_TO_REPAIR: '/repair/send_to_repair_jobs',
  SEND_PRICE: '/repair/send_price_jobs',
  STATUS_REPAIR: '/repair/status_repair_jobs',
  REJECT_REPAIR: '/repair/reject_repair_jobs',
  RECEIVE_JOB: '/repair/recive_jobs',
  SATISFACTION: '/repair/satisfaction_jobs',
}

export const LON_TYPE_LABELS: Record<LonType, string> = {
  SEND_TO_REPAIR: '1. แจ้งสถานะการส่งซ่อมสินค้า',
  SEND_PRICE: '2. แจ้งค่าบริการซ่อมสินค้า (ใบเสนอราคา)',
  STATUS_REPAIR: '3. แจ้งสถานะการซ่อมสินค้า',
  REJECT_REPAIR: '4. แจ้งสถานะปฏิเสธงานซ่อม',
  RECEIVE_JOB: '5. แจ้งสถานะการรับสินค้าคืน',
  SATISFACTION: '6. สำรวจความพึงพอใจหลังซ่อมสินค้า',
}

export const LON_TOGGLES_SETTING_KEY = 'LON_ENDPOINT_TOGGLES'

export const lonEndpointTogglesSchema = z.object({
  SEND_TO_REPAIR: z.boolean().default(true),
  SEND_PRICE: z.boolean().default(false),
  STATUS_REPAIR: z.boolean().default(true),
  REJECT_REPAIR: z.boolean().default(true),
  RECEIVE_JOB: z.boolean().default(true),
  SATISFACTION: z.boolean().default(true),
})

export type LonEndpointToggles = z.infer<typeof lonEndpointTogglesSchema>

export const DEFAULT_LON_TOGGLES: LonEndpointToggles = {
  SEND_TO_REPAIR: true,
  SEND_PRICE: false,
  STATUS_REPAIR: true,
  REJECT_REPAIR: true,
  RECEIVE_JOB: true,
  SATISFACTION: true,
}

export const lonResendRequestSchema = z.object({
  type: z.enum(LON_NOTIFICATION_TYPES),
  statusLabel: z.string().trim().max(120).optional(),
})

/** Normalizes a Thai mobile phone (e.g., 081-234-5678, +66812345678) to 10-digit 0xxxxxxxxx, or null if invalid. */
export function normalizeThaiMobilePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10 && /^0[689]\d{8}$/.test(digits)) {
    return digits
  }
  if (digits.length === 11 && /^66[689]\d{8}$/.test(digits)) {
    return `0${digits.slice(2)}`
  }
  return null
}

export interface LonRepairItemDto {
  sku: string
  product_name: string
  serial_no: string
  quantity: number
}

export interface LonBasePayload {
  repair_no: string
  customer_phone: string
  customer_name: string
  repair_date: string
  branch_name: string
  branch_phone: string
  sku: string
  product_name: string
  brand_name: string
  serial_no: string
  quantity: number
  symptom: string
  items: LonRepairItemDto[]
  contact_center: string
  tracking_url: string
}

export interface LonSendToRepairPayload extends LonBasePayload {
  status: string
}

export interface LonSendPricePayload extends LonBasePayload {
  total_price: number
  total_price_formatted: string
  repair_days: number
  warranty_days: number
  findings: string[]
  quote_url: string
  payment_url: string | null
}

export interface LonStatusRepairPayload extends LonBasePayload {
  status: string
  stage_code: string
}

export interface LonRejectRepairPayload extends LonBasePayload {
  return_date: string
  pickup_branch_name: string
  pickup_within_days: number
  status: string
}

export interface LonReceiveJobPayload extends LonBasePayload {
  receive_date: string
  pickup_branch_name: string
  pickup_within_days: number
  operation_fee: number
  status: string
}

export interface LonSatisfactionPayload {
  repair_no: string
  customer_phone: string
  customer_name: string
  repair_date: string
  closed_date: string
  branch_name: string
  product_name: string
  contact_center: string
  satisfaction_url: string
  rate_satisfied_url: string
  rate_neutral_url: string
  rate_unsatisfied_url: string
}

export type LonPayload =
  | LonSendToRepairPayload
  | LonSendPricePayload
  | LonStatusRepairPayload
  | LonRejectRepairPayload
  | LonReceiveJobPayload
  | LonSatisfactionPayload
