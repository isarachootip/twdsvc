import { z } from 'zod'

export const vendorServiceTypeSchema = z.enum(['CARRY_IN', 'ON_SITE'])
export type VendorServiceMode = z.infer<typeof vendorServiceTypeSchema>

export const productGroupTasksSchema = z.object({
  repair: z.boolean().default(true),
  replacePart: z.boolean().default(true),
  install: z.boolean().default(false),
})

export const productGroupRateSchema = z.object({
  groupName: z.string().trim().min(1, 'กรุณาระบุชื่อกลุ่มสินค้า'),
  serviceType: vendorServiceTypeSchema,
  minInspectionFee: z.number().int('ค่าเปิดเครื่องต้องเป็นจำนวนเต็ม').min(0, 'ค่าเปิดเครื่องต้องไม่ติดลบ'),
  gpPct: z.number().min(0, 'GP% ต้องไม่ต่ำกว่า 0').max(100, 'GP% ต้องไม่เกิน 100'),
  isCustomGroup: z.boolean().optional().default(false),
  tasks: productGroupTasksSchema.optional(),
})

export type ProductGroupRateConfig = z.infer<typeof productGroupRateSchema>

export const vendorServiceGroupInputSchema = z
  .object({
    id: z.number().int().positive().optional(),
    serviceType: vendorServiceTypeSchema,
    name: z.string().trim().min(1, 'กรุณาระบุชื่อกลุ่มสินค้า').max(120),
    minInspectionFee: z.number().int().min(0, 'ค่าเปิดเครื่องขั้นต่ำต้องไม่ติดลบ').default(0),
    recommendedFee: z.number().int().min(0, 'ค่าเปิดเครื่องแนะนำต้องไม่ติดลบ').default(300),
    minGpPct: z.number().min(0).max(100).default(0),
    defaultGpPct: z.number().min(0).max(100).default(18),
    sortOrder: z.number().int().default(0),
    active: z.boolean().default(true),
  })
  .refine(d => d.recommendedFee >= d.minInspectionFee, {
    message: 'ค่าเปิดเครื่องแนะนำต้องไม่น้อยกว่าค่าเปิดเครื่องขั้นต่ำ',
    path: ['recommendedFee'],
  })
  .refine(d => d.defaultGpPct >= d.minGpPct, {
    message: 'GP% แนะนำต้องไม่น้อยกว่า GP% ขั้นต่ำ',
    path: ['defaultGpPct'],
  })

export type VendorServiceGroupInput = z.infer<typeof vendorServiceGroupInputSchema>

function parseNumericText(raw: unknown, fallback: number): number {
  if (typeof raw === 'number' && !Number.isNaN(raw)) return Math.max(0, raw)
  if (typeof raw === 'string') {
    const cleaned = raw.replace(/[^0-9.]/g, '')
    const parsed = Number(cleaned)
    if (cleaned !== '' && !Number.isNaN(parsed)) return Math.max(0, parsed)
  }
  return fallback
}

export function extractApplicationProductRates(
  appliancesRaw: unknown,
  agreementsRaw: unknown
): ProductGroupRateConfig[] {
  const appObj = (appliancesRaw && typeof appliancesRaw === 'object' ? appliancesRaw : {}) as Record<string, unknown>
  const agrObj = (agreementsRaw && typeof agreementsRaw === 'object' ? agreementsRaw : {}) as Record<string, unknown>

  if (Array.isArray(appObj.productGroupRates) && appObj.productGroupRates.length > 0) {
    const validRates: ProductGroupRateConfig[] = []
    for (const item of appObj.productGroupRates) {
      const parsed = productGroupRateSchema.safeParse(item)
      if (parsed.success) validRates.push(parsed.data)
    }
    if (validRates.length > 0) return validRates
  }

  // Fallback synthesis for legacy V6 applications without productGroupRates
  const pricing = (agrObj.pricing && typeof agrObj.pricing === 'object' ? agrObj.pricing : {}) as Record<string, unknown>
  const commercial = (agrObj.commercial && typeof agrObj.commercial === 'object' ? agrObj.commercial : {}) as Record<string, unknown>
  const details = (appObj.productDetails && typeof appObj.productDetails === 'object'
    ? appObj.productDetails
    : {}) as Record<string, Record<string, unknown>>

  const cinFee = Math.round(parseNumericText(pricing.cinFee, 300))
  const onsFee = Math.round(parseNumericText(pricing.onsFee, 500))
  const gpPct = parseNumericText(commercial.gpPct, 18)

  const results: ProductGroupRateConfig[] = []
  const carryIn = Array.isArray(appObj.carryIn) ? appObj.carryIn : []
  for (const name of carryIn) {
    if (typeof name === 'string' && name.trim()) {
      results.push({
        groupName: name.trim(),
        serviceType: 'CARRY_IN',
        minInspectionFee: cinFee,
        gpPct,
        isCustomGroup: false,
      })
    }
  }

  const onSite = Array.isArray(appObj.onSite) ? appObj.onSite : []
  for (const name of onSite) {
    if (typeof name === 'string' && name.trim()) {
      const d = details[name] || {}
      results.push({
        groupName: name.trim(),
        serviceType: 'ON_SITE',
        minInspectionFee: onsFee,
        gpPct,
        isCustomGroup: false,
        tasks: {
          repair: d.repair !== false,
          replacePart: d.replacePart !== false,
          install: Boolean(d.install),
        },
      })
    }
  }

  return results
}
