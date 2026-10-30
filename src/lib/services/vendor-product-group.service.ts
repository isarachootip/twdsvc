import { prisma } from '@/lib/db'
import { HttpError } from '@/lib/api'
import {
  vendorServiceGroupInputSchema,
  type VendorServiceGroupInput,
  type VendorServiceMode,
} from '../validations/vendor-product-group.schema'

export const DEFAULT_CIN_PRODUCT_GROUPS = [
  'เครื่องใช้ไฟฟ้าขนาดเล็ก',
  'เครื่องใช้ไฟฟ้าในครัว',
  'เครื่องใช้ไฟฟ้าประปา',
  'เครื่องใช้ไฟฟ้าภายในสวน',
  'ปั๊มน้ำ',
  'ปั๊มน้ำอัตโนมัติ',
  'เครื่องมือช่าง',
]

export const DEFAULT_ONS_PRODUCT_GROUPS = [
  'ปั๊มน้ำ',
  'เครื่องปรับอากาศ',
  'เครื่องซักผ้า',
  'ตู้เย็น',
  'ตู้แช่',
  'ปั๊มน้ำอัตโนมัติ',
  'ทีวี',
  'เครื่องใช้ไฟฟ้าขนาดใหญ่',
]

export async function ensureDefaultVendorServiceGroups(): Promise<void> {
  const existingCount = await prisma.vendorServiceGroup.count()
  if (existingCount > 0) return

  const seedRows = [
    ...DEFAULT_CIN_PRODUCT_GROUPS.map((name, idx) => ({
      serviceType: 'CARRY_IN' as const,
      name,
      minInspectionFee: 0,
      recommendedFee: 300,
      minGpPct: 0,
      defaultGpPct: 18,
      sortOrder: (idx + 1) * 10,
      active: true,
    })),
    ...DEFAULT_ONS_PRODUCT_GROUPS.map((name, idx) => ({
      serviceType: 'ON_SITE' as const,
      name,
      minInspectionFee: 0,
      recommendedFee: 500,
      minGpPct: 0,
      defaultGpPct: 18,
      sortOrder: (idx + 1) * 10,
      active: true,
    })),
  ]

  await prisma.vendorServiceGroup.createMany({
    data: seedRows,
    skipDuplicates: true,
  })
}

export async function listVendorServiceGroups(options?: { activeOnly?: boolean }) {
  await ensureDefaultVendorServiceGroups()
  return prisma.vendorServiceGroup.findMany({
    where: options?.activeOnly ? { active: true } : undefined,
    orderBy: [{ serviceType: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
  })
}

export async function upsertVendorServiceGroup(raw: VendorServiceGroupInput) {
  const parsed = vendorServiceGroupInputSchema.safeParse(raw)
  if (!parsed.success) {
    throw new HttpError(400, parsed.error.issues[0]?.message ?? 'ข้อมูลกลุ่มสินค้าไม่ถูกต้อง')
  }
  const d = parsed.data
  const payload = {
    serviceType: d.serviceType,
    name: d.name.trim(),
    minInspectionFee: d.minInspectionFee,
    recommendedFee: d.recommendedFee,
    minGpPct: d.minGpPct,
    defaultGpPct: d.defaultGpPct,
    sortOrder: d.sortOrder,
    active: d.active,
  }

  if (d.id) {
    return prisma.vendorServiceGroup.update({
      where: { id: d.id },
      data: payload,
    })
  }

  return prisma.vendorServiceGroup.upsert({
    where: {
      serviceType_name: {
        serviceType: payload.serviceType,
        name: payload.name,
      },
    },
    update: payload,
    create: payload,
  })
}

export async function promoteCustomGroupToMaster(params: {
  serviceType: VendorServiceMode
  name: string
  recommendedFee?: number
  defaultGpPct?: number
}) {
  const cleanName = params.name.trim()
  if (!cleanName) throw new HttpError(400, 'กรุณาระบุชื่อกลุ่มสินค้า')

  const defaultFee = params.recommendedFee ?? (params.serviceType === 'ON_SITE' ? 500 : 300)
  const defaultGp = params.defaultGpPct ?? 18

  return prisma.vendorServiceGroup.upsert({
    where: {
      serviceType_name: {
        serviceType: params.serviceType,
        name: cleanName,
      },
    },
    update: { active: true },
    create: {
      serviceType: params.serviceType,
      name: cleanName,
      minInspectionFee: 0,
      recommendedFee: Math.max(0, Math.round(defaultFee)),
      minGpPct: 0,
      defaultGpPct: Math.min(100, Math.max(0, defaultGp)),
      sortOrder: 999,
      active: true,
    },
  })
}

export async function deleteVendorServiceGroup(id: number) {
  if (!id || Number.isNaN(id)) throw new HttpError(400, 'ระบุรหัสกลุ่มสินค้าไม่ถูกต้อง')
  return prisma.vendorServiceGroup.delete({ where: { id } })
}
