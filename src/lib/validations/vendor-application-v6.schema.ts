import { z } from 'zod'

const phoneRegex = /^[0-9+\-\s()]{8,20}$/
const taxIdRegex = /^\d{13}$/
const spcodeRegex = /^\d{6}$/

export const addressSchema = z.object({
  line1: z.string().min(1, 'กรุณาระบุที่อยู่'),
  subdistrict: z.string().min(1, 'กรุณาระบุตำบล/แขวง'),
  district: z.string().min(1, 'กรุณาระบุอำเภอ/เขต'),
  province: z.string().min(1, 'กรุณาระบุจังหวัด'),
  zip: z.string().regex(/^\d{5}$/, 'รหัสไปรษณีย์ต้องเป็นเลข 5 หลัก'),
  phone: z.string().optional().default(''),
  note: z.string().optional().default(''),
})

export const centerBranchSchema = addressSchema.extend({
  contactName: z.string().min(1, 'กรุณาระบุชื่อผู้ดูแลสาขา'),
})

export const contactPersonSchema = z.object({
  name: z.string().min(2, 'กรุณาระบุชื่อ-นามสกุล'),
  pos: z.string().min(1, 'กรุณาระบุตำแหน่ง'),
  phone: z.string().regex(phoneRegex, 'เบอร์โทรศัพท์ 8-20 หลัก'),
  email: z.string().email('กรุณาระบุอีเมลที่ถูกต้อง'),
  line: z.string().optional().default(''),
})

export const vendorApplicationV6Schema = z.object({
  // 1
  supplierRegistered: z.enum(['เคยลงทะเบียนทำการค้ากับไทวัสดุ', 'ไม่เคยลงทะเบียนทำการค้ากับไทวัสดุ']),
  spcode: z.string().optional().default(''),
  entityType: z.string().min(1, 'กรุณาเลือกประเภทธุรกิจ'),
  company: z.string().min(2, 'กรุณาระบุชื่อบริษัท/ร้านค้า'),
  regNo: z.string().optional().default(''),
  taxId: z.string().regex(taxIdRegex, 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก'),
  companyAddr: addressSchema,
  branchType: z.enum(['มีศูนย์บริการหลายสาขา', 'ศูนย์บริการเดียว']),
  branches: z.array(centerBranchSchema).min(1, 'ต้องมีศูนย์บริการอย่างน้อย 1 สาขา'),
  authorized: z.string(),
  authorizedBrands: z.array(z.object({
    brand: z.string(),
    productType: z.string(),
    certNo: z.string(),
    expireDate: z.string(),
  })).optional().default([]),
  primaryContact: contactPersonSchema,
  backupContact: z.object({
    name: z.string().min(2, 'กรุณาระบุชื่อผู้ติดต่อสำรอง'),
    phone: z.string().regex(phoneRegex, 'เบอร์โทรศัพท์ 8-20 หลัก'),
    timeStart: z.string().optional().default(''),
    timeEnd: z.string().optional().default(''),
  }),
  authorizer: z.object({
    name: z.string().min(2, 'กรุณาระบุชื่อผู้มีอำนาจอนุมัติ'),
    pos: z.string().min(1, 'กรุณาระบุตำแหน่ง'),
    phone: z.string().regex(phoneRegex, 'เบอร์โทรศัพท์ 8-20 หลัก'),
    email: z.string().email('กรุณาระบุอีเมลที่ถูกต้อง'),
  }),
  bank: z.object({
    accName: z.string().min(2, 'กรุณาระบุชื่อบัญชี'),
    accNo: z.string().min(8, 'เลขที่บัญชีอย่างน้อย 8 หลัก'),
    bank: z.string().min(1, 'กรุณาระบุธนาคาร'),
    bankBranch: z.string().optional().default(''),
    vat20: z.enum(['มี', 'ไม่มี']),
  }),

  // 2
  cinProducts: z.array(z.string()).default([]),
  cinBrands: z.array(z.string()).default([]),
  cinReceiveMethod: z.string().default(''),
  onsProducts: z.array(z.string()).default([]),
  onsBrands: z.array(z.string()).default([]),
  productDetails: z.record(z.string(), z.object({
    repair: z.boolean(),
    replacePart: z.boolean(),
    install: z.boolean(),
  })).default({}),
  productNote: z.string().optional().default(''),

  // 3
  techTotal: z.number().min(0).default(0),
  techOut: z.number().min(0).default(0),
  onsTech: z.number().min(0).default(0),
  onsTeams: z.number().min(0).default(0),
  onsCapDay: z.number().min(0).default(0),
  onsCapMonth: z.number().min(0).default(0),
  onsBackup: z.number().min(0).default(0),

  // 4
  cinDays: z.array(z.string()).default([]),
  cinOpen: z.string().default(''),
  cinClose: z.string().default(''),
  cinPickDays: z.array(z.string()).default([]),
  cinPickStart: z.string().default(''),
  cinPickEnd: z.string().default(''),
  onsDays: z.array(z.string()).default([]),
  onsHours: z.string().default(''),
  onsAppt: z.string().default(''),
  onsFast: z.number().min(0).default(0),
  onsQueue: z.number().min(0).default(0),

  // 5
  onsRadius: z.string().default('30 กม.'),
  coverage: z.record(z.string(), z.object({
    onsite: z.boolean(),
    respBranchIdx: z.number(),
  })).default({}),

  // 6
  cinFee: z.string().default(''),
  onsFee: z.string().default(''),
  feeCondition: z.string().default(''),
  priceNote: z.string().optional().default(''),

  // 7
  gpPct: z.string().default('18%'),
  creditTerm: z.string().default('30 วัน'),
  billingCycle: z.string().default('ทุกวันที่ 25'),

  // 8
  cinSlaDays: z.string().default('7 วัน'),
  onsSlaApptHours: z.string().default('24 ชม.'),
  onsSlaArrivalDays: z.string().default('3 วัน'),

  // 9
  damageLiability: z.string().default(''),
  safetyStandards: z.array(z.string()).default([]),
  onsiteTools: z.array(z.string()).default([]),

  // 10
  documents: z.record(z.string(), z.string()).default({}),
  agreements: z.object({
    sla: z.literal(true, { errorMap: () => ({ message: 'กรุณายินยอม SLA' }) }),
    inspect: z.literal(true, { errorMap: () => ({ message: 'กรุณายินยอมให้ตรวจสถานที่' }) }),
    reportApp: z.literal(true, { errorMap: () => ({ message: 'กรุณายินยอมใช้ระบบปิดงาน' }) }),
    training: z.literal(true, { errorMap: () => ({ message: 'กรุณายินยอมเข้าอบรม' }) }),
    pdpa: z.literal(true, { errorMap: () => ({ message: 'กรุณายินยอมเงื่อนไข PDPA' }) }),
    truth: z.literal(true, { errorMap: () => ({ message: 'กรุณารับรองว่าข้อมูลเป็นความจริง' }) }),
  }),
  signName: z.string().min(2, 'กรุณาระบุชื่อผู้ลงนาม'),
  signPos: z.string().min(1, 'กรุณาระบุตำแหน่งผู้ลงนาม'),
}).refine(data => {
  if (data.supplierRegistered === 'เคยลงทะเบียนทำการค้ากับไทวัสดุ') {
    return spcodeRegex.test(data.spcode)
  }
  return true
}, { message: 'กรุณากรอก SPCODE เป็นตัวเลข 6 หลัก', path: ['spcode'] })

export type VendorApplicationV6Input = z.infer<typeof vendorApplicationV6Schema>
