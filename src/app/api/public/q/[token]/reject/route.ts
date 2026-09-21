import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { executeAction } from '@/lib/state-machine'
import { JobStage } from '@prisma/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const pt = await prisma.publicToken.findUnique({
    where: { token },
    include: {
      job: {
        include: {
          quotes: { orderBy: { version: 'desc' }, take: 1 },
        },
      },
    },
  })

  if (!pt || pt.type !== 'QUOTE' || pt.usedAt) {
    return NextResponse.json({ error: 'Token invalid or already used' }, { status: 400 })
  }

  if (pt.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 400 })
  }

  const job = pt.job
  // S7: Stage check
  if (job.stage !== JobStage.WAITING_APPROVAL) {
    return NextResponse.json({ error: 'งานไม่ได้อยู่ในขั้นตอนรอลูกค้าอนุมัติ' }, { status: 400 })
  }

  const quote = job.quotes[0]
  if (!quote) return NextResponse.json({ error: 'No quote found' }, { status: 404 })
  if (['APPROVED', 'REJECTED'].includes(quote.status)) {
    return NextResponse.json({ error: 'Quote already decided' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))

  // S7: Delegate to executeAction with optimistic locking (Contract S7)
  const result = await executeAction(
    job.id,
    'customer_reject',
    {
      version: body?.version !== undefined ? Number(body.version) : job.version,
      reason: body.reason,
      note: body.note ?? (body.reason ? `ลูกค้าไม่อนุมัติ: ${body.reason}` : 'ลูกค้าไม่อนุมัติผ่านลิงก์'),
    },
    { userId: null, role: 'CUSTOMER' }
  )

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 })
  }

  return NextResponse.json({ success: true, ...result.extra })
}
