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

export const DEFAULT_GROUP_SKU_KEYWORDS: Record<string, string> = {
  'เครื่องใช้ไฟฟ้าขนาดเล็ก': 'พัดลม, เตารีด, เครื่องดูดฝุ่น, ไดร์เป่าผม, small appliance, fan, vacuum',
  'เครื่องใช้ไฟฟ้าในครัว': 'หม้อหุงข้าว, ไมโครเวฟ, เตาอบ, เครื่องปั่น, กระติกน้ำร้อน, เตาแม่เหล็ก, kitchen',
  'เครื่องใช้ไฟฟ้าประปา': 'เครื่องทำน้ำอุ่น, เครื่องทำน้ำร้อน, เครื่องกรองน้ำ, water heater',
  'เครื่องใช้ไฟฟ้าภายในสวน': 'เครื่องตัดหญ้า, เลื่อยโซ่, เครื่องเป่าใบไม้, เครื่องฉีดน้ำแรงดันสูง, lawn, garden',
  'ปั๊มน้ำ': 'ปั๊มน้ำ, ปั๊มแช่, ปั๊มจุ่ม, ปั๊มหอยโข่ง, water pump',
  'ปั๊มน้ำอัตโนมัติ': 'ปั๊มน้ำอัตโนมัติ, ปั๊มอัตโนมัติ, ปั๊มถังกลม, ปั๊มแรงดันคงที่, auto pump',
  'เครื่องมือช่าง': 'สว่าน, หินเจียร, เลื่อยวงเดือน, ตู้เชื่อม, เครื่องขัด, บล็อกไฟฟ้า, power tool, drill, grinder',
  'เครื่องปรับอากาศ': 'แอร์, เครื่องปรับอากาศ, คอยล์ร้อน, คอยล์เย็น, air conditioner',
  'เครื่องซักผ้า': 'เครื่องซักผ้า, เครื่องอบผ้า, washing machine, washer, dryer',
  'ตู้เย็น': 'ตู้เย็น, refrigerator, fridge',
  'ตู้แช่': 'ตู้แช่, ตู้แช่แข็ง, ตู้แช่เครื่องดื่ม, freezer',
  'ทีวี': 'ทีวี, โทรทัศน์, สมาร์ททีวี, television, smart tv',
  'เครื่องใช้ไฟฟ้าขนาดใหญ่': 'เครื่องล้างจาน, เตาอบฝัง, เครื่องดูดควัน, major appliance',
}

export async function ensureDefaultVendorServiceGroups(): Promise<void> {
  const existingCount = await prisma.vendorServiceGroup.count()
  if (existingCount === 0) {
    const seedRows = [
      ...DEFAULT_CIN_PRODUCT_GROUPS.map((name, idx) => ({
        serviceType: 'CARRY_IN' as const,
        name,
        minInspectionFee: 0,
        recommendedFee: 300,
        minGpPct: 0,
        defaultGpPct: 18,
        skuKeywords: DEFAULT_GROUP_SKU_KEYWORDS[name] ?? null,
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
        skuKeywords: DEFAULT_GROUP_SKU_KEYWORDS[name] ?? null,
        sortOrder: (idx + 1) * 10,
        active: true,
      })),
    ]
    await prisma.vendorServiceGroup.createMany({ data: seedRows, skipDuplicates: true })
    return
  }

  // Backfill default SKU keywords on pre-existing seeded rows that have null skuKeywords
  const missingKeywords = await prisma.vendorServiceGroup.findMany({
    where: { skuKeywords: null, name: { in: Object.keys(DEFAULT_GROUP_SKU_KEYWORDS) } },
    select: { id: true, name: true },
  })
  for (const row of missingKeywords) {
    const kw = DEFAULT_GROUP_SKU_KEYWORDS[row.name]
    if (kw) {
      await prisma.vendorServiceGroup.update({ where: { id: row.id }, data: { skuKeywords: kw } })
    }
  }
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
    ...(d.skuKeywords !== undefined ? { skuKeywords: d.skuKeywords?.trim() || null } : {}),
    sortOrder: d.sortOrder,
    active: d.active,
  }

  if (d.id) {
    return prisma.vendorServiceGroup.update({ where: { id: d.id }, data: payload })
  }

  return prisma.vendorServiceGroup.upsert({
    where: { serviceType_name: { serviceType: payload.serviceType, name: payload.name } },
    update: payload,
    create: payload,
  })
}

export async function promoteCustomGroupToMaster(params: {
  serviceType: VendorServiceMode
  name: string
  recommendedFee?: number
  defaultGpPct?: number
  skuKeywords?: string | null
}) {
  const cleanName = params.name.trim()
  if (!cleanName) throw new HttpError(400, 'กรุณาระบุชื่อกลุ่มสินค้า')

  const defaultFee = params.recommendedFee ?? (params.serviceType === 'ON_SITE' ? 500 : 300)
  const defaultGp = params.defaultGpPct ?? 18

  return prisma.vendorServiceGroup.upsert({
    where: { serviceType_name: { serviceType: params.serviceType, name: cleanName } },
    update: { active: true },
    create: {
      serviceType: params.serviceType,
      name: cleanName,
      minInspectionFee: 0,
      recommendedFee: Math.max(0, Math.round(defaultFee)),
      minGpPct: 0,
      defaultGpPct: Math.min(100, Math.max(0, defaultGp)),
      skuKeywords: params.skuKeywords?.trim() || DEFAULT_GROUP_SKU_KEYWORDS[cleanName] || null,
      sortOrder: 999,
      active: true,
    },
  })
}

export async function deleteVendorServiceGroup(id: number) {
  if (!id || Number.isNaN(id)) throw new HttpError(400, 'ระบุรหัสกลุ่มสินค้าไม่ถูกต้อง')
  const target = await prisma.vendorServiceGroup.findUnique({ where: { id } })
  if (!target) throw new HttpError(404, 'ไม่พบประเภทสินค้าที่ต้องการลบ')

  const [vendorCount, siblingCount, jobCount] = await Promise.all([
    prisma.vendorProductRate.count({ where: { serviceType: target.serviceType, groupName: target.name } }),
    prisma.vendorServiceGroup.count({ where: { name: target.name, id: { not: id } } }),
    prisma.job.count({ where: { productGroupName: target.name } }),
  ])

  if (vendorCount > 0 || (siblingCount === 0 && jobCount > 0)) {
    throw new HttpError(
      409,
      `ไม่สามารถลบ "${target.name}" ได้เนื่องจากมีข้อมูลคู่ค้า (${vendorCount}) หรือใบงาน (${jobCount}) ผูกอยู่ กรุณาใช้การปิดใช้งานแทน`
    )
  }

  return prisma.vendorServiceGroup.delete({ where: { id } })
}
