import type { JobStage } from '@prisma/client'
import { STAGE_LABELS } from '@/lib/constants'
import {
  LON_ENDPOINTS,
  normalizeThaiMobilePhone,
  type LonBasePayload,
  type LonPayload,
  type LonRepairItemDto,
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
  return `${get('day')}/${get('month')}/${get('year')}`
}

function formatBahtAmount(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function buildLonNotificationRequest(
  job: LonJobSource,
  type: LonType,
  options: { baseUrl: string; statusLabel?: string; now?: Date }
): BuiltLonRequest {
  const cleanBase = options.baseUrl.replace(/\/+$/, '')
  const now = options.now ?? new Date()
  const recipientPhone = normalizeThaiMobilePhone(job.customerPhone) ?? (job.customerPhone ?? '').replace(/\D/g, '')

  const items: LonRepairItemDto[] =
    job.items.length > 0
      ? job.items.map((item) => ({
          sku: item.sku ?? job.sku ?? '-',
          product_name: item.productName,
          serial_no: job.serialNo ?? '-',
          quantity: item.quantity,
        }))
      : [{ sku: job.sku ?? '-', product_name: job.productName, serial_no: job.serialNo ?? '-', quantity: 1 }]

  const trackingUrl = `${cleanBase}/t/${job.tokens.tracking}`
  const statusText = options.statusLabel || STAGE_LABELS[job.stage] || job.stage
  const endpoint = LON_ENDPOINTS[type]

  const base: LonBasePayload = {
    repair_no: job.jobNo,
    customer_phone: recipientPhone,
    customer_name: job.customerName ?? 'ลูกค้าไทวัสดุ',
    repair_date: formatLonDate(job.openedAt),
    branch_name: job.branch.name,
    branch_phone: job.branch.phone ?? '1308',
    sku: job.sku ?? items[0]?.sku ?? '-',
    product_name: job.productName,
    brand_name: job.brandName,
    serial_no: job.serialNo ?? '-',
    quantity: items.reduce((sum, item) => sum + item.quantity, 0),
    symptom: job.symptom ?? '-',
    items,
    contact_center: '1308',
    tracking_url: trackingUrl,
  }

  switch (type) {
    case 'SEND_TO_REPAIR':
      return { endpoint, recipientPhone, payload: { ...base, status: statusText } }

    case 'SEND_PRICE': {
      const q = job.activeQuote
      const total = q?.total ?? 0
      const findings =
        q && q.lines.length > 0
          ? q.lines.map((l) => (l.quantity > 1 ? `${l.description} x${l.quantity}` : l.description))
          : [q?.vendorNote || job.symptom || 'ตรวจสอบอาการเสียตามใบเสนอราคา']
      return {
        endpoint,
        recipientPhone,
        payload: {
          ...base,
          total_price: total,
          total_price_formatted: formatBahtAmount(total),
          repair_days: q?.repairDays ?? 7,
          warranty_days: q?.repairWarrantyDays ?? 30,
          findings,
          quote_url: job.tokens.quote ? `${cleanBase}/q/${job.tokens.quote}` : trackingUrl,
          payment_url: job.tokens.payment ? `${cleanBase}/pay/${job.tokens.payment}` : null,
        },
      }
    }

    case 'STATUS_REPAIR':
      return { endpoint, recipientPhone, payload: { ...base, status: statusText, stage_code: job.stage } }

    case 'REJECT_REPAIR':
      return {
        endpoint,
        recipientPhone,
        payload: {
          ...base,
          return_date: formatLonDate(now),
          pickup_branch_name: job.branch.name,
          pickup_within_days: 7,
          status: statusText,
        },
      }

    case 'RECEIVE_JOB':
      return {
        endpoint,
        recipientPhone,
        payload: {
          ...base,
          receive_date: formatLonDate(now),
          pickup_branch_name: job.branch.name,
          pickup_within_days: 7,
          operation_fee: job.operationFeeAmount,
          status: statusText,
        },
      }

    case 'SATISFACTION': {
      const csatUrl = job.tokens.csat ? `${cleanBase}/s/${job.tokens.csat}` : trackingUrl
      const joinCh = csatUrl.includes('?') ? '&' : '?'
      return {
        endpoint,
        recipientPhone,
        payload: {
          repair_no: job.jobNo,
          customer_phone: recipientPhone,
          customer_name: job.customerName ?? 'ลูกค้าไทวัสดุ',
          repair_date: formatLonDate(job.openedAt),
          closed_date: formatLonDate(job.closedAt ?? now),
          branch_name: job.branch.name,
          product_name: job.productName,
          contact_center: '1308',
          satisfaction_url: csatUrl,
          rate_satisfied_url: `${csatUrl}${joinCh}rate=satisfied`,
          rate_neutral_url: `${csatUrl}${joinCh}rate=neutral`,
          rate_unsatisfied_url: `${csatUrl}${joinCh}rate=unsatisfied`,
        },
      }
    }
  }
}
