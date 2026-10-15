import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { executeAction } from '@/lib/state-machine'

const SignSchema = z.object({
  type: z.enum(['INTAKE', 'PICKUP']),
  signatureUrl: z.string().min(10, 'ลายมือชื่อไม่ถูกต้อง'),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const pt = await prisma.publicToken.findUnique({
    where: { token },
    include: { job: true },
  })

  if (!pt || pt.type !== 'TRACKING') {
    return NextResponse.json({ error: 'Tracking link not found or expired' }, { status: 404 })
  }

  if (pt.expiresAt < new Date()) {
    return NextResponse.json({ error: 'ลิงก์หมดอายุแล้ว' }, { status: 400 })
  }

  const raw = await req.json().catch(() => ({}))
  const parsed = SignSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' }, { status: 400 })
  }

  const { type, signatureUrl } = parsed.data
  const actionName = type === 'INTAKE' ? 'cs_sign_intake' : 'cs_sign_pickup'

  const result = await executeAction(
    pt.job.id,
    actionName,
    { signatureUrl, version: pt.job.version },
    { userId: null, role: 'CUSTOMER' }
  )

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 })
  }

  return NextResponse.json({ success: true, ...result.extra })
}
