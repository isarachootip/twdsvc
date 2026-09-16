import { z } from 'zod';

export const QuoteLineSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['INSPECTION_FEE', 'PART', 'LABOR', 'OTHER']),
  description: z.string().min(1, 'ต้องระบุรายละเอียด'),
  priceSatang: z.number().int().nonnegative('ราคาต้องไม่ติดลบ'),
  partWaitDays: z.number().int().nonnegative().nullable().optional(),
  partWarrantyDays: z.number().int().nonnegative().nullable().optional(),
  sortOrder: z.number().int().nonnegative().default(0),
});

export const CreateQuoteSchema = z.object({
  jobId: z.string(),
  repairDays: z.number().int().min(1, 'ระยะเวลาซ่อมต้องอย่างน้อย 1 วัน'),
  repairWarrantyDays: z.number().int().nonnegative().default(30),
  vendorNote: z.string().nullable().optional(),
  lines: z.array(QuoteLineSchema).min(1, 'ต้องมีอย่างน้อย 1 รายการ'),
});

export const QuoteTotalsSchema = z.object({
  subtotalSatang: z.number().int().nonnegative(),
  vatSatang: z.number().int().nonnegative(),
  totalSatang: z.number().int().nonnegative(),
});
