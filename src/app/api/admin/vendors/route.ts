import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { getJsonSetting, setSetting } from '@/lib/settings'

export async function GET() {
  try {
    await requireUser(['ADMIN'])
    const [vendors, sizes] = await Promise.all([
      prisma.vendorParent.findMany({
        where: { active: true },
        include: {
          brands: { include: { brand: true } },
          centers: { where: { active: true }, orderBy: { code: 'asc' } },
        },
        orderBy: { code: 'asc' },
      }),
      getJsonSetting<Record<string, number[]>>('VENDOR_SIZES'),
    ])
    return NextResponse.json(
      vendors.map(v => ({
        ...v,
        brandIds: v.brands.map(b => b.brandId),
        sizeIds: (sizes || {})[v.id] ?? [],
      }))
    )
  } catch (e) {
    return handleError(e)
  }
}

interface CenterIn {
  id?: string
  code: string
  zoneSiteId?: string | null
  address?: string | null
  phone?: string | null
  deliveryMethod: string
  gpPctOverride?: number | string | null
  repairSlaDaysOverride?: number | string | null
}

interface VendorIn {
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
  centers: CenterIn[]
}

const num = (v: unknown, d = 0) => (v === '' || v == null || Number.isNaN(Number(v)) ? d : Number(v))
const optNum = (v: unknown) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v))

// PUT — บันทึก Vendor Portal ทั้งหน้า
export async function PUT(req: NextRequest) {
  try {
    await requireUser(['ADMIN'])
    const list: VendorIn[] = await req.json()
    for (const v of list) {
      if (!v.code?.trim() || !v.name?.trim()) {
        throw new HttpError(400, 'กรุณากรอกรหัสและชื่อ VD หลักให้ครบ')
      }
      const gp = num(v.defaultGpPct, 18)
      if (gp < 0 || gp > 100) {
        throw new HttpError(400, `GP% ของ ${v.code} ต้องอยู่ระหว่าง 0–100`)
      }
      for (const c of v.centers) {
        if (!c.code?.trim()) throw new HttpError(400, `กรุณากรอกรหัสศูนย์ย่อยของ ${v.code}`)
        if (!['DC', 'DSD', 'DC_DSD'].includes(c.deliveryMethod)) {
          throw new HttpError(400, `วิธีรับ-ส่งของ ${c.code} ไม่ถูกต้อง`)
        }
      }
    }

    const sizes = (await getJsonSetting<Record<string, number[]>>('VENDOR_SIZES')) || {}

    await prisma.$transaction(async tx => {
      const keepParents: string[] = []
      for (const v of list) {
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
        keepParents.push(parent.id)

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
        sizes[parent.id] = (v.sizeIds ?? []).map(Number)

        const keepCenters: string[] = []
        for (const c of v.centers) {
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
      }

      await tx.vendorParent.updateMany({ where: { id: { notIn: keepParents } }, data: { active: false } })
      await tx.vendorCenter.updateMany({ where: { vendorParentId: { notIn: keepParents } }, data: { active: false } })
    })

    await setSetting('VENDOR_SIZES', JSON.stringify(sizes))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
