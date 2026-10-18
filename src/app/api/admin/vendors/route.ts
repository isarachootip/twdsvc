import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError } from '@/lib/api'
import { getJsonSetting } from '@/lib/settings'
import {
  type VendorInput,
  upsertSingleVendor,
  deleteSingleVendor,
} from '@/lib/services/vendor-admin.service'

export async function GET(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
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

// POST — บันทึกหรือสร้าง Vendor รายเดี่ยว (Per-Vendor Save)
export async function POST(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const body: VendorInput = await req.json()
    const saved = await upsertSingleVendor(body)
    return NextResponse.json({ ok: true, data: saved })
  } catch (e) {
    return handleError(e)
  }
}

// DELETE — ปิดการใช้งาน Vendor รายเดี่ยว
export async function DELETE(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      const body = await req.json().catch(() => ({}))
      await deleteSingleVendor(body.id)
    } else {
      await deleteSingleVendor(id)
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}

// PUT — บันทึกรวมทั้งหน้า (รักษาความเข้ากันได้ย้อนหลัง)
export async function PUT(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const list: VendorInput[] = await req.json()
    for (const v of list) {
      await upsertSingleVendor(v)
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
