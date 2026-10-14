import type {
  EOrderingKind,
  EOrderingLineItem,
  EOrderingOrderPayload,
} from '@/lib/validations/eordering.schema'

export interface RepairSkuConfig {
  sku: string
  description: string
  chargeType: string
}

export interface EOrderingChargeInput {
  type: string
  amount: number
  description: string | null
}

export interface EOrderingPaymentInput {
  chargeType: string
  amount: number
  status: string
}

export interface EOrderingJobInput {
  id: string
  jobNo: string
  customerName: string | null
  customerPhone: string | null
  customerAddress: string | null
  taxInvoiceName: string | null
  taxInvoiceId: string | null
  taxInvoiceAddr: string | null
  productName: string
  brandName: string
  sku: string | null
  branch: {
    code: string
    stCode: string | null
    name: string
  }
  charges: EOrderingChargeInput[]
  payments: EOrderingPaymentInput[]
}

export interface EOrderingStoredEvent {
  type: string
  createdAt: Date
  payload: unknown
}

export interface ReusableEOrderingQr {
  orderRef: string
  qrPayload: string | null
  qrImageUrl: string | null
  payUrl: string
  expiresAt: string
}

function findSkuForCharge(skus: RepairSkuConfig[], chargeType: string): RepairSkuConfig {
  const found = skus.find(s => s.chargeType === chargeType && s.sku.trim().length > 0)
  if (found) return found
  const defaults: Record<string, RepairSkuConfig> = {
    OPERATION_FEE: { sku: 'SVC-OPFEE-001', description: 'ค่าดำเนินการ', chargeType: 'OPERATION_FEE' },
    SHIPPING_FEE: { sku: 'SVC-SHIP-001', description: 'ค่าขนส่ง 3PL', chargeType: 'SHIPPING_FEE' },
    INSPECTION_FEE: { sku: 'SVC-OPENFEE-001', description: 'ค่าเปิดเครื่องตรวจเช็ค', chargeType: 'INSPECTION_FEE' },
    REPAIR: { sku: 'SVC-REPAIR-001', description: 'ค่าซ่อมสินค้า (รวม VAT)', chargeType: 'REPAIR' },
  }
  return defaults[chargeType] ?? { sku: 'SVC-REPAIR-001', description: 'ค่าบริการงานซ่อม', chargeType }
}

/**
 * สร้างรายการสั่งซื้อแยกบรรทัดสำหรับส่งไปยังระบบ E-ordering
 */
export function buildEOrderingLineItems(
  job: EOrderingJobInput,
  kind: EOrderingKind,
  skus: RepairSkuConfig[]
): EOrderingLineItem[] {
  const items: EOrderingLineItem[] = []

  if (kind === 'intake') {
    for (const chargeType of ['OPERATION_FEE', 'SHIPPING_FEE'] as const) {
      const charged = job.charges
        .filter(c => c.type === chargeType)
        .reduce((sum, c) => sum + c.amount, 0)
      const paid = job.payments
        .filter(p => p.status === 'PAID' && p.chargeType === chargeType)
        .reduce((sum, p) => sum + p.amount, 0)
      const net = charged - paid
      if (net > 0) {
        const skuMeta = findSkuForCharge(skus, chargeType)
        const chargeDesc = job.charges.find(c => c.type === chargeType)?.description
        items.push({
          sku: skuMeta.sku,
          chargeType,
          description: chargeDesc || skuMeta.description,
          quantity: 1,
          unitPrice: net,
          amount: net,
        })
      }
    }
    return items
  }

  // กรณีชำระค่าซ่อม (repair): คำนวณยอดสุทธิหลังหักค่าดำเนินการและยอดที่จ่ายแล้ว
  const totalCharged = job.charges.reduce((sum, c) => sum + c.amount, 0)
  const totalPaid = job.payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0)
  const balance = Math.max(0, totalCharged - totalPaid)

  if (balance > 0) {
    const hasInspectionOnly =
      job.charges.some(c => c.type === 'INSPECTION_FEE') &&
      !job.charges.some(c => c.type === 'REPAIR')
    const primaryType = hasInspectionOnly ? 'INSPECTION_FEE' : 'REPAIR'
    const skuMeta = findSkuForCharge(skus, primaryType)
    const repairCharge = job.charges.find(c => c.type === primaryType)

    items.push({
      sku: skuMeta.sku,
      chargeType: primaryType,
      description: repairCharge?.description || `${skuMeta.description} (${job.jobNo})`,
      quantity: 1,
      unitPrice: balance,
      amount: balance,
    })
  }

  return items
}

/**
 * สร้าง Payload มาตรฐานสำหรับส่งไประบบ E-ordering
 */
export function buildEOrderingOrderPayload(
  job: EOrderingJobInput,
  kind: EOrderingKind,
  skus: RepairSkuConfig[],
  callbackUrl: string
): EOrderingOrderPayload {
  const items = buildEOrderingLineItems(job, kind, skus)
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

  const taxInvoice =
    job.taxInvoiceName && job.taxInvoiceId
      ? {
          name: job.taxInvoiceName,
          taxId: job.taxInvoiceId,
          address: job.taxInvoiceAddr,
        }
      : null

  return {
    jobId: job.id,
    jobNo: job.jobNo,
    paymentKind: kind,
    branch: {
      code: job.branch.code,
      stCode: job.branch.stCode,
      name: job.branch.name,
    },
    customer: {
      name: job.customerName,
      phone: job.customerPhone,
      address: job.customerAddress,
      taxInvoice,
    },
    product: {
      sku: job.sku,
      name: job.productName,
      brandName: job.brandName,
    },
    items,
    totalAmount,
    callbackUrl,
  }
}

/**
 * ตรวจสอบว่ามี QR ของ E-ordering เดิมที่ยอดเงินตรงกันและยังไม่หมดอายุหรือไม่
 */
export function findReusableEOrderingQr(
  events: EOrderingStoredEvent[],
  kind: EOrderingKind,
  expectedAmount: number,
  now: Date,
  forceNew: boolean
): ReusableEOrderingQr | null {
  if (forceNew) return null

  const qrEvents = events
    .filter(e => e.type === 'EORDERING_QR_CREATED' && e.payload && typeof e.payload === 'object')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  for (const ev of qrEvents) {
    const p = ev.payload as Record<string, unknown>
    if (p.kind !== kind) continue
    if (Number(p.totalAmount) !== expectedAmount) continue
    const expiresAtStr = typeof p.expiresAt === 'string' ? p.expiresAt : ''
    if (!expiresAtStr) continue
    const expiresAtDate = new Date(expiresAtStr)
    if (Number.isNaN(expiresAtDate.getTime()) || expiresAtDate <= now) continue

    const orderRef = typeof p.orderRef === 'string' ? p.orderRef : ''
    const payUrl = typeof p.payUrl === 'string' ? p.payUrl : ''
    if (!orderRef || !payUrl) continue

    return {
      orderRef,
      qrPayload: typeof p.qrPayload === 'string' ? p.qrPayload : null,
      qrImageUrl: typeof p.qrImageUrl === 'string' ? p.qrImageUrl : null,
      payUrl,
      expiresAt: expiresAtStr,
    }
  }

  return null
}
