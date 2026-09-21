import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { executeAction, isValidAction, type ActionType, type ActionInput } from '@/lib/state-machine'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role === 'EXECUTIVE') return NextResponse.json({ error: 'Executive ดูข้อมูลได้อย่างเดียว' }, { status: 403 })

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { action, ...input } = body as { action?: string } & ActionInput
  if (!action || !isValidAction(action)) {
    return NextResponse.json({ error: `ไม่รู้จัก action: ${action ?? '-'}` }, { status: 400 })
  }

  if (['customer_approve', 'customer_reject'].includes(action)) {
    return NextResponse.json({ error: 'action นี้ใช้ผ่านลิงก์ลูกค้าเท่านั้น' }, { status: 403 })
  }

  const result = await executeAction(id, action as ActionType, input, {
    userId: user.id,
    role: user.role,
    siteId: user.siteId,
    vendorCenterId: user.vendorCenterId,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 })
  }

  return NextResponse.json({ ...result.job, extra: result.extra })
}
