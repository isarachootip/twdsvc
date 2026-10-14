import { describe, it, expect, setTier } from '../framework/core'
import {
  EOrderingCreateQrRequestSchema,
  EOrderingWebhookPayloadSchema,
} from '@/lib/validations/eordering.schema'
import {
  buildEOrderingOrderPayload,
  findReusableEOrderingQr,
  type EOrderingJobInput,
  type RepairSkuConfig,
} from '@/lib/services/eordering-mapper'

setTier('Tier 1')

const defaultSkus: RepairSkuConfig[] = [
  { sku: 'SVC-REPAIR-001', description: 'ค่าซ่อมสินค้า (รวม VAT)', chargeType: 'REPAIR' },
  { sku: 'SVC-OPENFEE-001', description: 'ค่าเปิดเครื่องตรวจเช็ค', chargeType: 'INSPECTION_FEE' },
  { sku: 'SVC-OPFEE-001', description: 'ค่าดำเนินการ', chargeType: 'OPERATION_FEE' },
  { sku: 'SVC-SHIP-001', description: 'ค่าขนส่ง 3PL', chargeType: 'SHIPPING_FEE' },
]

const sampleJob: EOrderingJobInput = {
  id: 'job-bna-001',
  jobNo: 'BNA-13102026-0001',
  customerName: 'สมชาย ใจดี',
  customerPhone: '0812345678',
  customerAddress: '208 หมู่ 8 ซอยรามอินทรา 57 กรุงเทพมหานคร 10230',
  taxInvoiceName: null,
  taxInvoiceId: null,
  taxInvoiceAddr: null,
  productName: 'หม้อหุงข้าว SHARP KSH211 1.1L',
  brandName: 'SHARP',
  sku: '60173023',
  branch: {
    code: 'BNA',
    stCode: 'ST001',
    name: 'สาขาบางนา',
  },
  charges: [
    { type: 'OPERATION_FEE', amount: 150, description: 'ค่าดำเนินการ' },
    { type: 'SHIPPING_FEE', amount: 100, description: 'ค่าขนส่ง 3PL' },
  ],
  payments: [],
}

describe('Unit: E-ordering Payment QR API & Payload Mapping', () => {
  it('EO-01: Validates QR creation request and webhook payload schemas with Zod', () => {
    const validReq = EOrderingCreateQrRequestSchema.safeParse({ kind: 'intake', forceNew: false })
    expect(validReq.success).toBe(true)

    const invalidReq = EOrderingCreateQrRequestSchema.safeParse({ kind: 'unknown' })
    expect(invalidReq.success).toBe(false)

    const validWh = EOrderingWebhookPayloadSchema.safeParse({
      jobNo: 'BNA-13102026-0001',
      orderRef: 'EO-2026-0001',
      status: 'PAID',
      amount: 150,
      posReceiptNo: 'POS-BNA-999',
    })
    expect(validWh.success).toBe(true)
  })

  it('EO-02: Maps intake charges (operation fee + 3PL) to E-ordering items with service SKUs', () => {
    const payload = buildEOrderingOrderPayload(
      sampleJob,
      'intake',
      defaultSkus,
      'https://svc.thaiwatsadu.com/api/webhooks/e-ordering'
    )

    expect(payload.jobId).toBe('job-bna-001')
    expect(payload.jobNo).toBe('BNA-13102026-0001')
    expect(payload.paymentKind).toBe('intake')
    expect(payload.branch.code).toBe('BNA')
    expect(payload.branch.stCode).toBe('ST001')
    expect(payload.customer.name).toBe('สมชาย ใจดี')
    expect(payload.items.length).toBe(2)
    expect(payload.items[0].sku).toBe('SVC-OPFEE-001')
    expect(payload.items[0].amount).toBe(150)
    expect(payload.items[1].sku).toBe('SVC-SHIP-001')
    expect(payload.items[1].amount).toBe(100)
    expect(payload.totalAmount).toBe(250)
  })

  it('EO-03: Maps repair charges net of operation fee credit to E-ordering payload', () => {
    const repairJob: EOrderingJobInput = {
      ...sampleJob,
      charges: [
        { type: 'OPERATION_FEE', amount: 150, description: 'ค่าดำเนินการ' },
        { type: 'REPAIR', amount: 850, description: 'ค่าซ่อมตามใบเสนอราคา QT-001' },
        { type: 'OPERATION_FEE_CREDIT', amount: -150, description: 'ค่าดำเนินการ (หักเป็นส่วนลดค่าซ่อม)' },
      ],
      payments: [{ chargeType: 'OPERATION_FEE', amount: 150, status: 'PAID' }],
    }

    const payload = buildEOrderingOrderPayload(
      repairJob,
      'repair',
      defaultSkus,
      'https://svc.thaiwatsadu.com/api/webhooks/e-ordering'
    )

    expect(payload.paymentKind).toBe('repair')
    expect(payload.totalAmount).toBe(700)
    expect(payload.items.length).toBe(1)
    expect(payload.items[0].sku).toBe('SVC-REPAIR-001')
    expect(payload.items[0].amount).toBe(700)
  })

  it('EO-04: Reuses non-expired QR payload on re-opening modal and regenerates on forceNew or expiry', () => {
    const now = new Date('2026-10-14T08:00:00Z')
    const future = new Date('2026-10-14T08:15:00Z').toISOString()
    const past = new Date('2026-10-14T07:50:00Z').toISOString()

    const events = [
      {
        type: 'EORDERING_QR_CREATED',
        createdAt: new Date('2026-10-14T07:55:00Z'),
        payload: {
          kind: 'intake',
          totalAmount: 250,
          orderRef: 'EO-12345',
          qrPayload: '000201010212...',
          qrImageUrl: null,
          payUrl: '/pay/tok123',
          expiresAt: future,
        },
      },
    ]

    const reused = findReusableEOrderingQr(events, 'intake', 250, now, false)
    expect(reused?.orderRef).toBe('EO-12345')

    const forced = findReusableEOrderingQr(events, 'intake', 250, now, true)
    expect(forced).toBe(null)

    const diffAmount = findReusableEOrderingQr(events, 'intake', 150, now, false)
    expect(diffAmount).toBe(null)

    const expiredEvents = [
      {
        ...events[0],
        payload: { ...events[0].payload, expiresAt: past },
      },
    ]
    const expired = findReusableEOrderingQr(expiredEvents, 'intake', 250, now, false)
    expect(expired).toBe(null)
  })
})
