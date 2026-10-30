import { z } from 'zod'
import { productGroupRateSchema } from './vendor-product-group.schema'

const taxIdRegex = /^\d{13}$/
const spcodeRegex = /^\d{6}$/

export const addressSchema = z.object({
  line1: z.string().trim().min(1, 'กรุณาระบุที่อยู่สำนักงานใหญ่ (ข้อ 1.2)'),
  subdistrict: z.string().trim().min(1, 'กรุณาเลือกตำบล/แขวงสำนักงานใหญ่ (ข้อ 1.2)'),
  district: z.string().optional().default(''),
  province: z.string().optional().default(''),
  zip: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  note: z.string().optional().default(''),
})

export const centerBranchSchema = z.object({
  line1: z.string().trim().min(1, 'กรุณาระบุที่อยู่สาขาศูนย์บริการ (ข้อ 1.3)'),
  subdistrict: z.string().optional().default(''),
  district: z.string().optional().default(''),
  province: z.string().optional().default(''),
  zip: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  note: z.string().optional().default(''),
  contactName: z.string().trim().min(1, 'กรุณาระบุชื่อผู้ดูแลสาขา (ข้อ 1.3)'),
})

export const contactPersonSchema = z.object({
  name: z.string().trim().min(1, 'กรุณาระบุชื่อผู้ประสานงานหลัก (ข้อ 1.5)'),
  pos: z.string().optional().default(''),
  phone: z.string().trim().min(8, 'กรุณาระบุเบอร์โทรศัพท์ผู้ประสานงานหลัก (ข้อ 1.5)'),
  email: z.string().trim().email('กรุณาระบุอีเมลผู้ประสานงานหลักที่ถูกต้อง (ข้อ 1.5)'),
  line: z.string().optional().default(''),
})

export const vendorApplicationV6Schema = z.object({
  // 1
  supplierRegistered: z.enum(['เคยลงทะเบียนทำการค้ากับไทวัสดุ', 'ไม่เคยลงทะเบียนทำการค้ากับไทวัสดุ'], {
    errorMap: () => ({ message: 'กรุณาเลือกสถานะการลงทะเบียนคู่ค้า (ข้อ 1.0)' }),
  }),
  spcode: z.string().optional().default(''),
  entityType: z.string().min(1, 'กรุณาเลือกประเภทธุรกิจ (ข้อ 1.1)'),
  company: z.string().trim().min(1, 'กรุณาระบุชื่อบริษัท/ร้านค้า (ข้อ 1.1)'),
  regNo: z.string().optional().default(''),
  taxId: z.string().trim().regex(taxIdRegex, 'เลขประจำตัวผู้เสียภาษีต้องเป็นตัวเลข 13 หลัก (ข้อ 1.1)'),
  companyAddr: addressSchema,
  branchType: z.enum(['มีศูนย์บริการหลายสาขา', 'ศูนย์บริการเดียว']).default('ศูนย์บริการเดียว'),
  branches: z.array(centerBranchSchema).min(1, 'ต้องมีศูนย์บริการอย่างน้อย 1 สาขา (ข้อ 1.3)'),
  authorized: z.string().optional().default(''),
  authorizedBrands: z.array(z.object({
    brand: z.string(),
    productType: z.string(),
    certNo: z.string(),
    expireDate: z.string(),
  })).optional().default([]),
  primaryContact: contactPersonSchema,
  backupContact: z.object({
    name: z.string().optional().default(''),
    phone: z.string().optional().default(''),
    timeStart: z.string().optional().default(''),
    timeEnd: z.string().optional().default(''),
  }).optional().default({ name: '', phone: '', timeStart: '', timeEnd: '' }),
  authorizer: z.object({
    name: z.string().optional().default(''),
    pos: z.string().optional().default(''),
    phone: z.string().optional().default(''),
    email: z.string().optional().default(''),
  }).optional().default({ name: '', pos: '', phone: '', email: '' }),
  bank: z.object({
    accName: z.string().trim().min(1, 'กรุณาระบุชื่อบัญชีธนาคาร (ข้อ 1.8)'),
    accNo: z.string().trim().min(1, 'กรุณาระบุเลขที่บัญชีธนาคาร (ข้อ 1.8)'),
    bank: z.string().trim().min(1, 'กรุณาระบุชื่อธนาคาร (ข้อ 1.8)'),
    bankBranch: z.string().optional().default(''),
    vat20: z.enum(['มี', 'ไม่มี']).default('มี'),
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
  productGroupRates: z.array(productGroupRateSchema).default([]),
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
    sla: z.literal(true, { errorMap: () => ({ message: 'กรุณายินยอม SLA (ข้อ 10.2)' }) }),
    inspect: z.literal(true, { errorMap: () => ({ message: 'กรุณายินยอมให้ตรวจสถานที่ (ข้อ 10.2)' }) }),
    reportApp: z.literal(true, { errorMap: () => ({ message: 'กรุณายินยอมใช้ระบบปิดงาน (ข้อ 10.2)' }) }),
    training: z.literal(true, { errorMap: () => ({ message: 'กรุณายินยอมเข้าอบรม (ข้อ 10.2)' }) }),
    pdpa: z.literal(true, { errorMap: () => ({ message: 'กรุณายินยอมเงื่อนไข PDPA (ข้อ 10.2)' }) }),
    truth: z.literal(true, { errorMap: () => ({ message: 'กรุณารับรองว่าข้อมูลเป็นความจริง (ข้อ 10.2)' }) }),
  }),
  signName: z.string().trim().min(1, 'กรุณาระบุชื่อผู้มีอำนาจลงนาม (ข้อ 10.3)'),
  signPos: z.string().trim().min(1, 'กรุณาระบุตำแหน่งผู้มีอำนาจลงนาม (ข้อ 10.3)'),
}).refine(data => {
  if (data.supplierRegistered === 'เคยลงทะเบียนทำการค้ากับไทวัสดุ') {
    return spcodeRegex.test(data.spcode)
  }
  return true
}, { message: 'กรุณากรอก SPCODE เป็นตัวเลข 6 หลัก (ข้อ 1.0)', path: ['spcode'] })

export type VendorApplicationV6Input = z.infer<typeof vendorApplicationV6Schema>
