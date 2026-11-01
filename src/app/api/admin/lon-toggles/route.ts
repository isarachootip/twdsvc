import { NextRequest, NextResponse } from 'next/server'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { getLonEndpointToggles, saveLonEndpointToggles } from '@/lib/services/lon-toggles.service'
import { lonEndpointTogglesSchema } from '@/lib/validations/lon.schema'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const toggles = await getLonEndpointToggles()
    return NextResponse.json({ toggles })
  } catch (e) {
    return handleError(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const raw = await req.json().catch(() => null)
    const parsed = lonEndpointTogglesSchema.safeParse(raw)
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? 'ข้อมูลสวิตช์ LON ไม่ถูกต้อง')
    }
    const toggles = await saveLonEndpointToggles(parsed.data)
    return NextResponse.json({ toggles })
  } catch (e) {
    return handleError(e)
  }
}
