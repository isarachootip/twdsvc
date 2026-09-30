import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const cfg = await prisma.payoutCycleConfig.findFirst({ where: { active: true }, orderBy: { id: 'asc' } })
    return NextResponse.json(cfg ?? { id: null, cycleType: 'BIMONTHLY', dayOfMonth1: 5, dayOfMonth2: 20, active: true })
  } catch (e) {
    return handleError(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const b = await req.json()
    if (!['BIMONTHLY', 'EVERY_15_DAYS', 'WEEKLY', 'MONTHLY'].includes(b.cycleType)) {
      throw new HttpError(400, 'รูปแบบรอบจ่ายไม่ถูกต้อง')
    }
    const d1 = Math.round(Number(b.dayOfMonth1))
    const d2 = Math.round(Number(b.dayOfMonth2))
    if (!(d1 >= 1 && d1 <= 28) || !(d2 >= 1 && d2 <= 28)) {
      throw new HttpError(400, 'วันที่ในเดือนต้องอยู่ระหว่าง 1–28')
    }
    const existing = await prisma.payoutCycleConfig.findFirst({ orderBy: { id: 'asc' } })
    const data = { cycleType: b.cycleType, dayOfMonth1: d1, dayOfMonth2: d2, active: true }
    if (existing) {
      await prisma.payoutCycleConfig.update({ where: { id: existing.id }, data })
    } else {
      await prisma.payoutCycleConfig.create({ data })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
