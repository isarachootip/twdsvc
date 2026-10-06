import { NextRequest, NextResponse } from 'next/server'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { prisma } from '@/lib/db'
import { issueLinkCode, unlinkLine } from '@/lib/services/line-link.service'

export const dynamic = 'force-dynamic'

const MIN_INTERVAL_MS = 60_000
const lastIssued = new Map<string, number>()

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(undefined, req)
    const row = await prisma.user.findUnique({ where: { id: user.id }, select: { lineUserId: true } })
    return NextResponse.json({ linked: Boolean(row?.lineUserId) })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(undefined, req)
    const now = Date.now()
    if (now - (lastIssued.get(user.id) ?? 0) < MIN_INTERVAL_MS) {
      throw new HttpError(429, 'กรุณารอ 1 นาทีก่อนขอรหัสใหม่')
    }
    lastIssued.set(user.id, now)
    const { code, expiresAt } = await issueLinkCode(user.id)
    return NextResponse.json({ code, expiresAt })
  } catch (e) {
    return handleError(e)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser(undefined, req)
    await unlinkLine(user.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
