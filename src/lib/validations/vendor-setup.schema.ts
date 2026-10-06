import { z } from 'zod'

export const branchItemSchema = z.object({
  id: z.string(),
  branchName: z.string().min(1, 'กรุณาระบุชื่อสาขา'),
  address: z.string().min(1, 'กรุณาระบุที่อยู่'),
  province: z.string().min(1, 'กรุณาระบุจังหวัด'),
  amphoe: z.string().optional().default(''),
  phone: z.string().min(9, 'กรุณาระบุเบอร์โทรศัพท์ที่ถูกต้อง'),
  photo: z.string().nullable().optional(),
  radius: z.number().min(5).max(200).default(30),
  vip: z.boolean().default(false),
  express: z.boolean().default(false),
})

export const step1StoreSchema = z.object({
  name: z.string().min(2, 'กรุณาระบุชื่อร้าน / บริษัท'),
  type: z.enum(['บุคคลธรรมดา', 'ห้างหุ้นส่วนจำกัด', 'บริษัทจำกัด', 'วิสาหกิจชุมชน'], {
    required_error: 'กรุณาเลือกประเภทธุรกิจ',
  }),
  taxId: z.string().regex(/^\d{13}$/, 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก'),
  phone: z.string().min(9, 'กรุณาระบุเบอร์โทรหลัก'),
  lineId: z.string().optional().default(''),
  branches: z.array(branchItemSchema).min(1, 'ต้องมีสาขาอย่างน้อย 1 สาขา').max(10, 'เพิ่มได้สูงสุด 10 สาขา'),
})

export const step2ExpertiseSchema = z.object({
  appliances: z.record(z.string(), z.boolean()).refine(
    val => Object.values(val).some(v => v === true),
    { message: 'กรุณาเลือกประเภทงานซ่อมอย่างน้อย 1 รายการ' }
  ),
  isBrandAuthorized: z.boolean().default(false),
  defaultSlaDays: z.number().min(1).max(60).default(7),
  warrantyDays: z.number().min(30).max(365).default(90),
})

export const routeCoverageItemSchema = z.object({
  transport: z.enum(['pickup', 'dc', 'tpl']),
  days: z.array(z.string()).default(['mon', 'tue', 'wed', 'thu', 'fri']),
  times: z.array(z.string()).default(['morning', 'afternoon']),
  frequency: z.string().default('สัปดาห์ละ 2 ครั้ง'),
  note: z.string().optional().default(''),
  transitDays: z.string().optional().default('2-3'),
  vendorDeliveryAddressId: z.string().nullable().optional(),
})

export const step3CoverageSchema = z.object({
  coverage: z.record(z.string(), routeCoverageItemSchema).refine(
    val => Object.keys(val).length > 0,
    { message: 'กรุณาเลือกสาขา SVC ที่ต้องการให้บริการอย่างน้อย 1 สาขา' }
  ),
})

export const step4FinanceSchema = z.object({
  bank: z.string().min(1, 'กรุณาเลือกธนาคาร'),
  accNo: z.string().min(8, 'เลขที่บัญชีไม่ถูกต้อง'),
  accName: z.string().min(2, 'กรุณาระบุชื่อบัญชี'),
  commission: z.literal(true, {
    errorMap: () => ({ message: 'กรุณายินยอมเงื่อนไขการหักค่าอะไหล่และภาษี 3%' }),
  }),
  documents: z.object({
    idcard: z.string().min(1, 'กรุณาอัปโหลดสำเนาบัตรประชาชน / หนังสือรับรอง'),
    company: z.string().optional().default(''),
    license: z.string().optional().default(''),
    portfolio: z.array(z.string()).optional().default([]),
  }),
})

export const step5AgreementsSchema = z.object({
  agreements: z.object({
    sla: z.literal(true, { errorMap: () => ({ message: 'กรุณายอมรับ SLA การซ่อม' }) }),
    pdpa: z.literal(true, { errorMap: () => ({ message: 'กรุณายินยอมเงื่อนไข PDPA' }) }),
    standard: z.literal(true, { errorMap: () => ({ message: 'กรุณายอมรับมาตรฐานราคาและอะไหล่แท้' }) }),
    transportDamage: z.literal(true, { errorMap: () => ({ message: 'กรุณายอมรับความรับผิดชอบการขนส่ง' }) }),
    warrantyRepeat: z.literal(true, { errorMap: () => ({ message: 'กรุณายอมรับการรับประกันงานซ่อมซ้ำ 90 วัน' }) }),
  }),
  signatureUrl: z.string().min(1, 'กรุณาลงลายเซ็นดิจิทัล'),
})

export const fullVendorApplicationSchema = z.object({
  store: step1StoreSchema,
  expertise: step2ExpertiseSchema,
  coverage: step3CoverageSchema,
  finance: step4FinanceSchema,
  agreements: step5AgreementsSchema,
})

export type FullVendorApplicationInput = z.infer<typeof fullVendorApplicationSchema>
export type BranchItem = z.infer<typeof branchItemSchema>
export type RouteCoverageItem = z.infer<typeof routeCoverageItemSchema>
