import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { findToken, rateLimited } from '@/lib/public-token'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (rateLimited(req)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const { token } = await params
  const pt = await findToken(token, 'CSAT')
  if (!pt) return NextResponse.json({ error: 'ลิงก์ไม่ถูกต้อง' }, { status: 404 })
  const job = await prisma.job.findUnique({
    where: { id: pt.jobId },
    include: { branch: { select: { name: true } } },
  })
  if (!job) return NextResponse.json({ error: 'ไม่พบงาน' }, { status: 404 })
  return NextResponse.json({
    jobNo: job.jobNo,
    productName: job.productName,
    brandName: job.brandName,
    branchName: job.branch.name,
    submitted: !!pt.usedAt,
    expired: pt.expiresAt < new Date(),
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (rateLimited(req)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const { token } = await params
  const pt = await findToken(token, 'CSAT')
  if (!pt || pt.usedAt || pt.expiresAt < new Date()) {
    return NextResponse.json({ error: 'ลิงก์นี้ถูกใช้แล้วหรือหมดอายุ' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const score = Math.round(Number(body.score ?? body.rating ?? 5))
  const qualityScore = body.qualityScore ? Math.round(Number(body.qualityScore)) : score
  const speedScore = body.speedScore ? Math.round(Number(body.speedScore)) : score
  const comment = String(body.comment ?? '').slice(0, 1000)
  const aspects = Array.isArray(body.aspects) ? body.aspects : []

  if (!(score >= 1 && score <= 5)) {
    return NextResponse.json({ error: 'กรุณาให้คะแนน 1–5 ดาว' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.jobEvent.create({
      data: {
        jobId: pt.jobId,
        type: 'CSAT_SUBMITTED',
        actorRole: 'CUSTOMER',
        payload: {
          score,
          qualityScore,
          speedScore,
          aspects,
          comment,
        },
        note: `ลูกค้าประเมินความพึงพอใจ: ${score} ดาว (คุณภาพ: ${qualityScore}, ความเร็ว: ${speedScore})`,
      },
    }),
    prisma.publicToken.update({
      where: { id: pt.id },
      data: { usedAt: new Date() },
    }),
  ])

  return NextResponse.json({ success: true, rating: score })
}

