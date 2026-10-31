import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, handleError, HttpError } from '@/lib/api'
import {
  listVendorServiceGroups,
  upsertVendorServiceGroup,
  promoteCustomGroupToMaster,
  deleteVendorServiceGroup,
} from '@/lib/services/vendor-product-group.service'
import { getProductTypeMasterOverview } from '@/lib/services/product-type-master.service'
import {
  vendorServiceTypeSchema,
  vendorServiceGroupInputSchema,
} from '@/lib/validations/vendor-product-group.schema'

export const dynamic = 'force-dynamic'

const promoteSchema = z.object({
  action: z.literal('PROMOTE'),
  serviceType: vendorServiceTypeSchema,
  name: z.string().trim().min(1, 'กรุณาระบุชื่อกลุ่มสินค้า').max(120),
  recommendedFee: z.number().int().min(0).optional(),
  defaultGpPct: z.number().min(0).max(100).optional(),
  skuKeywords: z.string().trim().max(500).nullable().optional(),
})

export async function GET(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const { searchParams } = new URL(req.url)
    if (searchParams.get('overview') === '1') {
      return NextResponse.json(await getProductTypeMasterOverview())
    }
    const groups = await listVendorServiceGroups({ activeOnly: false })
    return NextResponse.json(groups)
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const raw: unknown = await req.json().catch(() => null)
    if (!raw || typeof raw !== 'object') {
      throw new HttpError(400, 'รูปแบบข้อมูลไม่ถูกต้อง')
    }

    if ('action' in raw && (raw as Record<string, unknown>).action === 'PROMOTE') {
      const parsed = promoteSchema.safeParse(raw)
      if (!parsed.success) {
        throw new HttpError(400, parsed.error.issues[0]?.message ?? 'ข้อมูลกลุ่มสินค้าไม่ถูกต้อง')
      }
      const saved = await promoteCustomGroupToMaster(parsed.data)
      return NextResponse.json({ ok: true, data: saved })
    }

    const parsed = vendorServiceGroupInputSchema.safeParse(raw)
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? 'ข้อมูลกลุ่มสินค้าไม่ถูกต้อง')
    }
    const saved = await upsertVendorServiceGroup(parsed.data)
    return NextResponse.json({ ok: true, data: saved })
  } catch (error) {
    return handleError(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    if (!Number.isInteger(id) || id <= 0) {
      throw new HttpError(400, 'กรุณาระบุรหัสกลุ่มสินค้าที่ต้องการลบ')
    }
    await deleteVendorServiceGroup(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleError(error)
  }
}
