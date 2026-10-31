import { z } from 'zod'

export const jobIntakePhotoSchema = z.object({
  fileUrl: z.string().trim().min(1),
  fileName: z.string().optional(),
  mimeType: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
})

export const jobIntakeSchema = z.object({
  branchId: z.string().trim().optional(),
  customerName: z.string().trim().min(1, 'กรุณากรอกชื่อลูกค้า'),
  customerPhone: z
    .string()
    .transform(v => v.replace(/\D/g, ''))
    .refine(v => /^0\d{8,9}$/.test(v), 'เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)'),
  customerAddress: z.string().nullable().optional(),
  customerZip: z.string().nullable().optional(),
  taxInvoiceName: z.string().nullable().optional(),
  taxInvoiceId: z
    .string()
    .nullable()
    .optional()
    .refine(v => !v || /^\d{13}$/.test(v), 'เลขผู้เสียภาษีต้องมี 13 หลัก'),
  taxInvoiceAddr: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  productName: z.string().trim().min(1, 'กรุณากรอกชื่อสินค้า'),
  productGroupName: z
    .string()
    .optional()
    .refine(v => v === undefined || v.trim().length > 0, 'กรุณาเลือกประเภทสินค้า')
    .transform(v => (v ? v.trim() : null)),
  brandId: z.union([z.number(), z.string(), z.null()]).optional(),
  brandName: z.string().trim().min(1, 'กรุณาเลือกแบรนด์'),
  sizeCategoryId: z.coerce.number().int().positive('กรุณาเลือกขนาดสินค้า'),
  symptom: z.string().trim().min(1, 'กรุณากรอกอาการเสีย'),
  serialNo: z.string().nullable().optional(),
  hasWarranty: z.boolean().optional().default(false),
  allowNonAuth: z.boolean().optional().default(false),
  shippingMethod: z.enum(['STANDARD', 'EXPRESS']).catch('STANDARD'),
  defectNote: z.string().nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  posReceiptNo: z.string().nullable().optional(),
})

export type JobIntakeInput = z.infer<typeof jobIntakeSchema>
