import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { siteInputSchema } from '@/lib/validations/site-schema'

const TERMINAL_STAGES = ['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED', 'CANCELLED'] as const

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(['ADMIN'], req)
    const { id } = await params

    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        primaryRoutes: {
          include: {
            primaryCenter: { select: { id: true, code: true, vendorParent: { select: { name: true } } } },
            backupCenter: { select: { id: true, code: true, vendorParent: { select: { name: true } } } },
            dcSite: { select: { id: true, code: true, name: true } },
          },
        },
        users: {
          select: { id: true, username: true, fullName: true, role: true, active: true },
          take: 10,
        },
        _count: {
          select: { users: true, jobs: true },
        },
      },
    })

    if (!site) {
      throw new HttpError(404, 'ไม่พบข้อมูลสาขา/คลัง')
    }

    const openJobsCount = await prisma.job.count({
      where: {
        branchId: id,
        stage: { notIn: [...TERMINAL_STAGES] },
      },
    })

    return NextResponse.json({
      ...site,
      manager: site.districtManager ?? '',
      openJobsCount,
    })
  } catch (e) {
    return handleError(e)
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(['ADMIN'], req)
    const { id } = await params
    const raw = await req.json()
    const parsed = siteInputSchema.partial().parse(raw)

    const existing = await prisma.site.findUnique({ where: { id } })
    if (!existing) {
      throw new HttpError(404, 'ไม่พบข้อมูลสาขา/คลังที่ต้องการแก้ไข')
    }

    if (parsed.code && parsed.code.trim().toUpperCase() !== existing.code) {
      const codeConflict = await prisma.site.findUnique({
        where: { code: parsed.code.trim().toUpperCase() },
      })
      if (codeConflict) {
        throw new HttpError(400, `รหัสสาขา ${parsed.code.trim().toUpperCase()} มีอยู่ในระบบแล้ว`)
      }
    }

    const updated = await prisma.site.update({
      where: { id },
      data: {
        ...(parsed.code ? { code: parsed.code.trim().toUpperCase(), nickname: parsed.code.trim().toUpperCase() } : {}),
        ...(parsed.name ? { name: parsed.name.trim() } : {}),
        ...(parsed.type ? { type: parsed.type } : {}),
        ...(parsed.province !== undefined ? { province: parsed.province } : {}),
        ...(parsed.district !== undefined ? { district: parsed.district } : {}),
        ...(parsed.subdistrict !== undefined ? { subdistrict: parsed.subdistrict } : {}),
        ...(parsed.postalCode !== undefined ? { postalCode: parsed.postalCode } : {}),
        ...(parsed.address !== undefined ? { address: parsed.address } : {}),
        ...(parsed.googleMapsUrl !== undefined ? { googleMapsUrl: parsed.googleMapsUrl } : {}),
        ...(parsed.phone !== undefined ? { phone: parsed.phone } : {}),
        ...(parsed.storeManagerName !== undefined ? { storeManagerName: parsed.storeManagerName } : {}),
        ...(parsed.storeManagerPhone !== undefined ? { storeManagerPhone: parsed.storeManagerPhone } : {}),
        ...(parsed.storeEmail !== undefined ? { storeEmail: parsed.storeEmail } : {}),
        ...(parsed.openingHours !== undefined ? { openingHours: parsed.openingHours } : {}),
        ...(parsed.region !== undefined ? { region: parsed.region } : {}),
        ...(parsed.districtManager !== undefined ? { districtManager: parsed.districtManager } : {}),
        ...(parsed.active !== undefined ? { active: parsed.active } : {}),
      },
    })

    return NextResponse.json({ ok: true, site: updated })
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(['ADMIN'], req)
    const { id } = await params

    const existing = await prisma.site.findUnique({ where: { id } })
    if (!existing) {
      throw new HttpError(404, 'ไม่พบข้อมูลสาขา/คลัง')
    }

    const openJobsCount = await prisma.job.count({
      where: {
        branchId: id,
        stage: { notIn: [...TERMINAL_STAGES] },
      },
    })

    if (openJobsCount > 0) {
      throw new HttpError(
        400,
        `ไม่สามารถปิดการใช้งานสาขานี้ได้ เนื่องจากยังมีงานซ่อมที่กำลังดำเนินการอยู่ ${openJobsCount} รายการ`
      )
    }

    await prisma.site.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ ok: true, message: 'ปิดการใช้งานสาขาเรียบร้อยแล้ว' })
  } catch (e) {
    return handleError(e)
  }
}
