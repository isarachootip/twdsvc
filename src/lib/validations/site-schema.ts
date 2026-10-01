import { z } from 'zod'

export const siteInputSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, 'กรุณากรอกรหัสสาขา/คลัง').max(20),
  name: z.string().min(1, 'กรุณากรอกชื่อสาขา/คลัง').max(100),
  nickname: z.string().optional(),
  type: z.enum(['BRANCH', 'DC']).default('BRANCH'),
  province: z.string().optional().default('กรุงเทพมหานคร'),
  district: z.string().optional().nullable(),
  subdistrict: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  googleMapsUrl: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  storeManagerName: z.string().optional().nullable(),
  storeManagerPhone: z.string().optional().nullable(),
  storeEmail: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')).nullable(),
  openingHours: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  districtManager: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
})

export type SiteInputType = z.infer<typeof siteInputSchema>
