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

export const LON_DEFAULT_BASE_URL = 'https://lon.thaiwatsadu.com'

export const LON_ENDPOINTS: Record<LonType, string> = {
  SEND_TO_REPAIR: '/repair/send_to_repair_jobs',
  SEND_PRICE: '/repair/send_price_repair_jobs',
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

export interface LonSendToRepairPayload {
  customer_name: string
  repair_no: string
  repair_date: string
  button: string
  store_name: string
  customer_phone: string
  product_name: string
  repair_reason: string
  status: string
}

export interface LonSendPricePayload {
  customer_name: string
  repair_no: string
  repair_date: string
  button: string
  store_name: string
  customer_phone: string
  product_name: string
  repair_reason: string
  repair_price: number
  status: string
}

export interface LonStatusRepairPayload {
  customer_name: string
  repair_no: string
  repair_date: string
  button: string
  store_name: string
  customer_phone: string
  product_name: string
  repair_reason: string
  status: string
}

export interface LonRejectRepairPayload {
  customer_name: string
  repair_no: string
  status: string
  product_name: string
  repair_reason: string
  repair_date: string
  return_date: string
  button: string
  store_name: string
  recived_store_name: string
  customer_phone: string
}

export interface LonReceiveJobPayload {
  customer_name: string
  repair_no: string
  repair_date: string
  product_name: string
  repair_reason: string
  received_date: string
  status: string
  button: string
  recived_store_name: string
  customer_phone: string
}

export interface LonSatisfactionPayload {
  customer_name: string
  repair_no: string
  status: string
  customer_phone: string
}

export type LonPayload =
  | LonSendToRepairPayload
  | LonSendPricePayload
  | LonStatusRepairPayload
  | LonRejectRepairPayload
  | LonReceiveJobPayload
  | LonSatisfactionPayload

export const LON_SWAGGER_KEY_ORDER: Record<LonType, readonly string[]> = {
  SEND_TO_REPAIR: ['customer_name', 'repair_no', 'repair_date', 'button', 'store_name', 'customer_phone', 'product_name', 'repair_reason', 'status'],
  SEND_PRICE: ['customer_name', 'repair_no', 'repair_date', 'button', 'store_name', 'customer_phone', 'product_name', 'repair_reason', 'repair_price', 'status'],
  STATUS_REPAIR: ['customer_name', 'repair_no', 'repair_date', 'button', 'store_name', 'customer_phone', 'product_name', 'repair_reason', 'status'],
  REJECT_REPAIR: ['customer_name', 'repair_no', 'status', 'product_name', 'repair_reason', 'repair_date', 'return_date', 'button', 'store_name', 'recived_store_name', 'customer_phone'],
  RECEIVE_JOB: ['customer_name', 'repair_no', 'repair_date', 'product_name', 'repair_reason', 'received_date', 'status', 'button', 'recived_store_name', 'customer_phone'],
  SATISFACTION: ['customer_name', 'repair_no', 'status', 'customer_phone'],
}

/** Reorders a payload object (e.g., returned from PostgreSQL jsonb) to match the exact LON Swagger field order. */
export function orderLonPayloadBySwagger(payload: unknown, type: LonType): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {}
  const src = payload as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of LON_SWAGGER_KEY_ORDER[type]) {
    if (key in src) out[key] = src[key]
  }
  return Object.keys(out).length > 0 ? out : src
}
