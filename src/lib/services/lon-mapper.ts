import type { JobStage } from '@prisma/client'
import { STAGE_LABELS } from '@/lib/constants'
import {
  LON_ENDPOINTS,
  normalizeThaiMobilePhone,
  type LonPayload,
  type LonType,
} from '@/lib/validations/lon.schema'

export interface LonJobSource {
  jobNo: string
  stage: JobStage
  customerName: string | null
  customerPhone: string | null
  sku: string | null
  productName: string
  brandName: string
  serialNo: string | null
  symptom: string | null
  openedAt: Date
  closedAt: Date | null
  branch: { name: string; phone: string | null }
  items: Array<{ sku: string | null; productName: string; quantity: number; symptom: string | null }>
  operationFeeAmount: number
  activeQuote: {
    total: number
    repairDays: number
    repairWarrantyDays: number
    vendorNote: string | null
    lines: Array<{ description: string; quantity: number; unitPrice: number }>
  } | null
  tokens: { tracking: string; quote: string | null; payment: string | null; csat: string | null }
}

export interface BuiltLonRequest {
  endpoint: string
  recipientPhone: string
  payload: LonPayload
}

export function formatLonDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '01'
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function buildLonNotificationRequest(
  job: LonJobSource,
  type: LonType,
  options: { baseUrl: string; statusLabel?: string; now?: Date }
): BuiltLonRequest {
  const cleanBase = options.baseUrl.replace(/\/+$/, '')
  const now = options.now ?? new Date()
  const recipientPhone = normalizeThaiMobilePhone(job.customerPhone) ?? (job.customerPhone ?? '').replace(/\D/g, '')
  const customerName = job.customerName ?? 'ลูกค้าไทวัสดุ'
  const repairDate = formatLonDate(job.openedAt)
  const storeName = job.branch.name
  const reasonText = job.symptom ?? '-'
  const trackingUrl = `${cleanBase}/t/${job.tokens.tracking}`
  const endpoint = LON_ENDPOINTS[type]

  switch (type) {
    case 'SEND_TO_REPAIR':
      return {
        endpoint,
        recipientPhone,
        payload: {
          customer_name: customerName,
          repair_no: job.jobNo,
          repair_date: repairDate,
          button: trackingUrl,
          store_name: storeName,
          customer_phone: recipientPhone,
          product_name: job.productName,
          repair_reason: reasonText,
          status: options.statusLabel || 'การส่งซ่อมสินค้า',
        },
      }

    case 'SEND_PRICE': {
      const total = job.activeQuote?.total ?? 0
      const quoteUrl = job.tokens.quote ? `${cleanBase}/q/${job.tokens.quote}` : trackingUrl
      return {
        endpoint,
        recipientPhone,
        payload: {
          customer_name: customerName,
          repair_no: job.jobNo,
          repair_date: repairDate,
          button: quoteUrl,
          store_name: storeName,
          customer_phone: recipientPhone,
          product_name: job.productName,
          repair_reason: reasonText,
          repair_price: Math.round(total),
          status: options.statusLabel || 'แจ้งค่าบริการซ่อมสินค้า',
        },
      }
    }

    case 'STATUS_REPAIR':
      return {
        endpoint,
        recipientPhone,
        payload: {
          customer_name: customerName,
          repair_no: job.jobNo,
          repair_date: repairDate,
          button: trackingUrl,
          store_name: storeName,
          customer_phone: recipientPhone,
          product_name: job.productName,
          repair_reason: reasonText,
          status: options.statusLabel || STAGE_LABELS[job.stage] || job.stage,
        },
      }

    case 'REJECT_REPAIR':
      return {
        endpoint,
        recipientPhone,
        payload: {
          customer_name: customerName,
          repair_no: job.jobNo,
          status: options.statusLabel || 'ปฎิเสธงานซ่อม',
          product_name: job.productName,
          repair_reason: reasonText,
          repair_date: repairDate,
          return_date: formatLonDate(now),
          button: trackingUrl,
          store_name: storeName,
          recived_store_name: storeName,
          customer_phone: recipientPhone,
        },
      }

    case 'RECEIVE_JOB':
      return {
        endpoint,
        recipientPhone,
        payload: {
          customer_name: customerName,
          repair_no: job.jobNo,
          repair_date: repairDate,
          product_name: job.productName,
          repair_reason: reasonText,
          received_date: formatLonDate(now),
          status: options.statusLabel || 'แจ้งสถานะการรับสินค้า',
          button: trackingUrl,
          recived_store_name: storeName,
          customer_phone: recipientPhone,
        },
      }

    case 'SATISFACTION':
      return {
        endpoint,
        recipientPhone,
        payload: {
          customer_name: customerName,
          repair_no: job.jobNo,
          status: options.statusLabel || 'ประเมินความพึงพอใจซ่อมสินค้า',
          customer_phone: recipientPhone,
        },
      }
  }
}
