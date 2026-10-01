import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { getJsonSetting, setSetting } from '@/lib/settings'
import { siteInputSchema } from '@/lib/validations/site-schema'

const TERMINAL_STAGES = ['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED', 'CANCELLED'] as const

export async function GET(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const [sites, managers, openJobsGroup] = await Promise.all([
      prisma.site.findMany({
        where: activeOnly ? { active: true } : undefined,
        orderBy: [{ type: 'asc' }, { code: 'asc' }],
        include: {
          _count: { select: { users: true, jobs: true } },
          primaryRoutes: {
            include: {
              primaryCenter: { select: { code: true, vendorParent: { select: { name: true } } } },
            },
          },
        },
      }),
      getJsonSetting<Record<string, string>>('DISTRICT_MANAGERS'),
      prisma.job.groupBy({
        by: ['branchId'],
        where: { stage: { notIn: [...TERMINAL_STAGES] } },
        _count: { id: true },
      }),
    ])

    const openJobsMap = new Map(openJobsGroup.map(g => [g.branchId, g._count.id]))

    return NextResponse.json(
      sites.map(s => ({
        ...s,
        manager: s.districtManager || (managers || {})[s.id] || '',
        openJobsCount: openJobsMap.get(s.id) ?? 0,
      }))
    )
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const raw = await req.json()
    const parsed = siteInputSchema.parse(raw)

    const code = parsed.code.trim().toUpperCase()
    const existing = await prisma.site.findUnique({ where: { code } })
    if (existing) {
      throw new HttpError(400, `รหัสสาขา/คลัง ${code} มีอยู่ในระบบแล้ว`)
    }

    const created = await prisma.site.create({
      data: {
        code,
        name: parsed.name.trim(),
        nickname: parsed.nickname?.trim() || code,
        type: parsed.type,
        province: parsed.province || 'กรุงเทพมหานคร',
        district: parsed.district || null,
        subdistrict: parsed.subdistrict || null,
        postalCode: parsed.postalCode || null,
        address: parsed.address || null,
        googleMapsUrl: parsed.googleMapsUrl || null,
        phone: parsed.phone || null,
        storeManagerName: parsed.storeManagerName || null,
        storeManagerPhone: parsed.storeManagerPhone || null,
        storeEmail: parsed.storeEmail || null,
        openingHours: parsed.openingHours || null,
        region: parsed.region || null,
        districtManager: parsed.districtManager || null,
        active: parsed.active ?? true,
      },
    })

    if (parsed.districtManager) {
      const managers = (await getJsonSetting<Record<string, string>>('DISTRICT_MANAGERS')) || {}
      managers[created.id] = parsed.districtManager
      await setSetting('DISTRICT_MANAGERS', JSON.stringify(managers))
    }

    return NextResponse.json({ ok: true, site: created }, { status: 201 })
  } catch (e) {
    return handleError(e)
  }
}

interface LegacySiteIn {
  id?: string
  code: string
  name: string
  type: 'BRANCH' | 'DC'
  manager?: string
  address?: string
  phone?: string
  province?: string
}

export async function PUT(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const body = await req.json()

    // Handle legacy bulk array
    if (Array.isArray(body)) {
      const list: LegacySiteIn[] = body
      const managers: Record<string, string> = {}

      for (const s of list) {
        if (!s.code?.trim() || !s.name?.trim()) {
          throw new HttpError(400, 'กรุณากรอกรหัสและชื่อสาขา/คลังให้ครบ')
        }
      }

      await prisma.$transaction(async tx => {
        const keep: string[] = []
        for (const s of list) {
          const data = {
            code: s.code.trim().toUpperCase(),
            name: s.name.trim(),
            nickname: s.code.trim().toUpperCase(),
            type: s.type === 'DC' ? ('DC' as const) : ('BRANCH' as const),
            address: s.address || null,
            phone: s.phone || null,
            province: s.province || 'กรุงเทพมหานคร',
            districtManager: s.manager || null,
            active: true,
          }
          const site = s.id
            ? await tx.site.update({ where: { id: s.id }, data })
            : await tx.site.upsert({ where: { code: data.code }, update: data, create: data })
          keep.push(site.id)
          if (data.type === 'BRANCH' && s.manager) {
            managers[site.id] = s.manager
          }
        }
        await tx.site.updateMany({ where: { id: { notIn: keep } }, data: { active: false } })
      })

      await setSetting('DISTRICT_MANAGERS', JSON.stringify(managers))
      return NextResponse.json({ ok: true })
    }

    // Handle single object update
    const parsed = siteInputSchema.parse(body)
    if (!parsed.id) {
      throw new HttpError(400, 'กรุณาระบุ id ของสาขาที่ต้องการแก้ไข')
    }

    const updated = await prisma.site.update({
      where: { id: parsed.id },
      data: {
        code: parsed.code.trim().toUpperCase(),
        name: parsed.name.trim(),
        nickname: parsed.nickname?.trim() || parsed.code.trim().toUpperCase(),
        type: parsed.type,
        province: parsed.province || 'กรุงเทพมหานคร',
        district: parsed.district || null,
        subdistrict: parsed.subdistrict || null,
        postalCode: parsed.postalCode || null,
        address: parsed.address || null,
        googleMapsUrl: parsed.googleMapsUrl || null,
        phone: parsed.phone || null,
        storeManagerName: parsed.storeManagerName || null,
        storeManagerPhone: parsed.storeManagerPhone || null,
        storeEmail: parsed.storeEmail || null,
        openingHours: parsed.openingHours || null,
        region: parsed.region || null,
        districtManager: parsed.districtManager || null,
        active: parsed.active ?? true,
      },
    })

    if (parsed.districtManager !== undefined) {
      const managers = (await getJsonSetting<Record<string, string>>('DISTRICT_MANAGERS')) || {}
      managers[updated.id] = parsed.districtManager || ''
      await setSetting('DISTRICT_MANAGERS', JSON.stringify(managers))
    }

    return NextResponse.json({ ok: true, site: updated })
  } catch (e) {
    return handleError(e)
  }
}
