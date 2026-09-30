import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    return NextResponse.json(await prisma.promotionConfig.findMany({ orderBy: [{ status: 'asc' }, { startDate: 'desc' }] }))
  } catch (e) {
    return handleError(e)
  }
}

interface PromoIn {
  id?: string
  name: string
  tradeInType: 'TYPE1' | 'TYPE2'
  sizeCategoryId: number | null
  subDept?: string | null
  discountPct: number
  startDate: string
  endDate: string
  status: string
}

// PUT — บันทึกโปรโมชั่น
export async function PUT(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const list: PromoIn[] = await req.json()
    await prisma.$transaction(async tx => {
      const keep: string[] = []
      for (const p of list) {
        const pct = Number(p.discountPct)
        if (!p.name?.trim()) throw new HttpError(400, 'กรุณากรอกชื่อโปร')
        if (!(pct >= 0 && pct <= 100)) throw new HttpError(400, `ส่วนลดของ "${p.name}" ต้องอยู่ระหว่าง 0–100%`)
        if (!p.startDate || !p.endDate || p.startDate > p.endDate) throw new HttpError(400, `ช่วงวันที่ของ "${p.name}" ไม่ถูกต้อง`)
        const data = {
          name: p.name.trim(),
          tradeInType: p.tradeInType === 'TYPE2' ? ('TYPE2' as const) : ('TYPE1' as const),
          sizeCategoryId: p.sizeCategoryId ? Number(p.sizeCategoryId) : null,
          subDept: p.subDept || null,
          discountPct: pct,
          startDate: new Date(`${p.startDate}T00:00:00+07:00`),
          endDate: new Date(`${p.endDate}T23:59:59+07:00`),
          status: ['ACTIVE', 'DRAFT', 'CLOSED'].includes(p.status) ? p.status : 'DRAFT',
        }
        const row = p.id
          ? await tx.promotionConfig.update({ where: { id: p.id }, data })
          : await tx.promotionConfig.create({ data })
        keep.push(row.id)
      }
      await tx.promotionConfig.updateMany({ where: { id: { notIn: keep } }, data: { status: 'CLOSED' } })
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
