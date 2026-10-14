import { z } from 'zod'

export const EOrderingKindSchema = z.enum(['intake', 'repair'])
export type EOrderingKind = z.infer<typeof EOrderingKindSchema>

export const EOrderingCreateQrRequestSchema = z.object({
  kind: EOrderingKindSchema.default('intake'),
  forceNew: z.boolean().optional().default(false),
})
export type EOrderingCreateQrRequest = z.infer<typeof EOrderingCreateQrRequestSchema>

export const EOrderingLineItemSchema = z.object({
  sku: z.string(),
  chargeType: z.string(),
  description: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  amount: z.number().nonnegative(),
})
export type EOrderingLineItem = z.infer<typeof EOrderingLineItemSchema>

export const EOrderingTaxInvoiceSchema = z.object({
  name: z.string(),
  taxId: z.string(),
  address: z.string().nullable(),
}).nullable()

export const EOrderingOrderPayloadSchema = z.object({
  jobId: z.string(),
  jobNo: z.string(),
  paymentKind: EOrderingKindSchema,
  branch: z.object({
    code: z.string(),
    stCode: z.string().nullable(),
    name: z.string(),
  }),
  customer: z.object({
    name: z.string().nullable(),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    taxInvoice: EOrderingTaxInvoiceSchema,
  }),
  product: z.object({
    sku: z.string().nullable(),
    name: z.string(),
    brandName: z.string(),
  }),
  items: z.array(EOrderingLineItemSchema).min(1),
  totalAmount: z.number().positive(),
  callbackUrl: z.string(),
})
export type EOrderingOrderPayload = z.infer<typeof EOrderingOrderPayloadSchema>

export const EOrderingExternalResponseSchema = z.object({
  orderRef: z.string().optional(),
  orderNo: z.string().optional(),
  qrPayload: z.string().optional().nullable(),
  qrCode: z.string().optional().nullable(),
  qrImageUrl: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
})
export type EOrderingExternalResponse = z.infer<typeof EOrderingExternalResponseSchema>

export const EOrderingWebhookPayloadSchema = z.object({
  jobNo: z.string().trim().min(1, 'ต้องระบุเลขที่ใบแจ้งซ่อม (jobNo)'),
  orderRef: z.string().trim().optional().nullable(),
  status: z.enum(['PAID', 'SUCCESS', 'COMPLETED', 'FAILED', 'CANCELLED']).default('PAID'),
  amount: z.number().positive().optional(),
  posReceiptNo: z.string().trim().optional().nullable(),
  paymentMethod: z.enum(['PROMPTPAY_QR', 'CARD_LINK', 'POS_RECEIPT']).optional().default('PROMPTPAY_QR'),
})
export type EOrderingWebhookPayload = z.infer<typeof EOrderingWebhookPayloadSchema>
