import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { getJsonSetting, setSetting } from '@/lib/settings'

export async function GET(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const [sites, managers] = await Promise.all([
      prisma.site.findMany({
        where: { active: true },
        orderBy: [{ type: 'asc' }, { code: 'asc' }],
        include: { _count: { select: { users: true, jobs: true } } },
      }),
      getJsonSetting<Record<string, string>>('DISTRICT_MANAGERS'),
    ])
    return NextResponse.json(
      sites.map(s => ({
        ...s,
        manager: (managers || {})[s.id] ?? '',
      }))
    )
  } catch (e) {
    return handleError(e)
  }
}

interface SiteIn {
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
    const list: SiteIn[] = await req.json()
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
  } catch (e) {
    return handleError(e)
  }
}
