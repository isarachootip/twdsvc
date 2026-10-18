import { prisma } from '@/lib/db'
import { HttpError } from '@/lib/api'
import { getJsonSetting, setSetting } from '@/lib/settings'

export interface CenterInput {
  id?: string
  code: string
  zoneSiteId?: string | null
  address?: string | null
  phone?: string | null
  deliveryMethod: string
  gpPctOverride?: number | string | null
  repairSlaDaysOverride?: number | string | null
}

export interface VendorInput {
  id?: string
  code: string
  name: string
  defaultGpPct: number | string
  defaultRepairSlaDays: number | string
  repairWarrantyDays: number | string
  inspectionFeeCovered: number | string
  inspectionFeeNotCovered: number | string
  isBrandAuthorized: boolean
  brandIds: number[]
  sizeIds: number[]
  centers: CenterInput[]
}

const num = (v: unknown, d = 0) =>
  v === '' || v == null || Number.isNaN(Number(v)) ? d : Number(v)
const optNum = (v: unknown) =>
  v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v)

function validateVendorInput(v: VendorInput) {
  if (!v.code?.trim() || !v.name?.trim()) {
    throw new HttpError(400, 'กรุณากรอกรหัสและชื่อ VD หลักให้ครบถ้วน')
  }
  const gp = num(v.defaultGpPct, 18)
  if (gp < 0 || gp > 100) {
    throw new HttpError(400, `GP% ของ ${v.code} ต้องอยู่ระหว่าง 0–100`)
  }
  for (const c of v.centers || []) {
    if (!c.code?.trim()) throw new HttpError(400, `กรุณากรอกรหัสศูนย์ย่อยของ ${v.code}`)
    if (!['DC', 'DSD', 'DC_DSD'].includes(c.deliveryMethod)) {
      throw new HttpError(400, `วิธีรับ-ส่งของศูนย์ ${c.code} ไม่ถูกต้อง (DC/DSD/DC_DSD)`)
    }
  }
}

export async function upsertSingleVendor(v: VendorInput) {
  validateVendorInput(v)
  const sizes = (await getJsonSetting<Record<string, number[]>>('VENDOR_SIZES')) || {}

  const saved = await prisma.$transaction(async tx => {
    const data = {
      code: v.code.trim(),
      name: v.name.trim(),
      defaultGpPct: num(v.defaultGpPct, 18),
      defaultRepairSlaDays: num(v.defaultRepairSlaDays, 7),
      repairWarrantyDays: num(v.repairWarrantyDays, 30),
      inspectionFeeCovered: num(v.inspectionFeeCovered, 0),
      inspectionFeeNotCovered: num(v.inspectionFeeNotCovered, 300),
      isBrandAuthorized: !!v.isBrandAuthorized,
      active: true,
    }

    const parent = v.id
      ? await tx.vendorParent.update({ where: { id: v.id }, data })
      : await tx.vendorParent.upsert({ where: { code: data.code }, update: data, create: data })

    await tx.vendorBrand.deleteMany({ where: { vendorParentId: parent.id } })
    if (v.brandIds?.length) {
      await tx.vendorBrand.createMany({
        data: [...new Set(v.brandIds)].map(b => ({
          vendorParentId: parent.id,
          brandId: Number(b),
        })),
        skipDuplicates: true,
      })
    }

    const keepCenters: string[] = []
    for (const c of v.centers || []) {
      const cd = {
        code: c.code.trim(),
        vendorParentId: parent.id,
        zoneSiteId: c.zoneSiteId || null,
        address: c.address || null,
        phone: c.phone || null,
        deliveryMethod: c.deliveryMethod,
        gpPctOverride: optNum(c.gpPctOverride),
        repairSlaDaysOverride: optNum(c.repairSlaDaysOverride),
        active: true,
      }
      const center = c.id
        ? await tx.vendorCenter.update({ where: { id: c.id }, data: cd })
        : await tx.vendorCenter.upsert({ where: { code: cd.code }, update: cd, create: cd })
      keepCenters.push(center.id)
    }

    await tx.vendorCenter.updateMany({
      where: { vendorParentId: parent.id, id: { notIn: keepCenters } },
      data: { active: false },
    })

    return parent
  })

  sizes[saved.id] = (v.sizeIds ?? []).map(Number)
  await setSetting('VENDOR_SIZES', JSON.stringify(sizes))
  return saved
}

export async function deleteSingleVendor(id: string) {
  if (!id) throw new HttpError(400, 'ระบุ ID คู่ค้าที่ต้องการลบ')
  await prisma.$transaction(async tx => {
    await tx.vendorParent.update({
      where: { id },
      data: { active: false },
    })
    await tx.vendorCenter.updateMany({
      where: { vendorParentId: id },
      data: { active: false },
    })
  })
  return { ok: true }
}
