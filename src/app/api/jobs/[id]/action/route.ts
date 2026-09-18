import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { executeAction, ActionType, ActionInput } from '@/lib/state-machine'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { action, ...input } = body as { action: ActionType } & ActionInput

  if (!action) return NextResponse.json({ error: 'Missing action' }, { status: 400 })

  const result = await executeAction(id, action, input, {
    userId: user.id,
    role: user.role,
    siteId: user.siteId,
    vendorCenterId: user.vendorCenterId,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json(result.job)
}
