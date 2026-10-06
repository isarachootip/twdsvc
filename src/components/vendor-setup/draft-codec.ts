import { z } from 'zod'
import type { VendorSetupFormData } from './types'

export const DRAFT_KEY = 'svc.vendorDraft.v1'
const DRAFT_VERSION = 1

const branchSchema = z.object({
  id: z.string(),
  branchName: z.string(),
  address: z.string(),
  province: z.string(),
  amphoe: z.string(),
  phone: z.string(),
  photo: z.string().nullable(),
  radius: z.number(),
  vip: z.boolean(),
  express: z.boolean(),
})

const routeSchema = z.object({
  transport: z.enum(['pickup', 'dc', 'tpl']),
  days: z.array(z.string()),
  times: z.array(z.string()),
  frequency: z.string(),
  note: z.string(),
  transitDays: z.string(),
  vendorDeliveryAddressId: z.string().nullable(),
})

const formSchema = z.object({
  store: z.object({
    name: z.string(),
    type: z.enum(['บุคคลธรรมดา', 'ห้างหุ้นส่วนจำกัด', 'บริษัทจำกัด', 'วิสาหกิจชุมชน', '']),
    taxId: z.string(),
    phone: z.string(),
    lineId: z.string(),
    branches: z.array(branchSchema),
  }),
  expertise: z.object({
    appliances: z.record(z.boolean()),
    isBrandAuthorized: z.boolean(),
    defaultSlaDays: z.number(),
    warrantyDays: z.number(),
  }),
  coverage: z.object({ coverage: z.record(routeSchema) }),
  finance: z.object({
    bank: z.string(),
    accNo: z.string(),
    accName: z.string(),
    commission: z.boolean(),
    documents: z.object({
      idcard: z.string(),
      company: z.string(),
      license: z.string(),
      portfolio: z.array(z.string()),
    }),
  }),
  agreements: z.object({
    agreements: z.object({
      sla: z.boolean(),
      pdpa: z.boolean(),
      standard: z.boolean(),
      transportDamage: z.boolean(),
      warrantyRepeat: z.boolean(),
    }),
    signatureUrl: z.string(),
  }),
})

const draftSchema = z.object({
  v: z.literal(DRAFT_VERSION),
  step: z.number().int().min(1).max(5),
  form: formSchema,
})

export interface VendorDraft {
  step: number
  form: VendorSetupFormData
}

/** Returns a copy without bank details, uploaded documents and signature. */
export function pruneSensitive(form: VendorSetupFormData): VendorSetupFormData {
  return {
    ...form,
    finance: {
      ...form.finance,
      accNo: '',
      accName: '',
      documents: { idcard: '', company: '', license: '', portfolio: [] },
    },
    agreements: { ...form.agreements, signatureUrl: '' },
  }
}

export function serializeDraft(form: VendorSetupFormData, step: number): string {
  return JSON.stringify({ v: DRAFT_VERSION, step, form: pruneSensitive(form) })
}

export function parseDraft(raw: string | null): VendorDraft | null {
  if (!raw) return null
  try {
    const parsed = draftSchema.safeParse(JSON.parse(raw))
    return parsed.success ? { step: parsed.data.step, form: parsed.data.form } : null
  } catch {
    return null
  }
}
