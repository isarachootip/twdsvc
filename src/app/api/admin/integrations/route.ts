import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { getIntegrationConfigMasked, saveIntegrationConfig } from '@/lib/services/integration-config.service'

export const dynamic = 'force-dynamic'

const patchSchema = z.record(z.string(), z.union([z.string().max(1000), z.null()]))

export async function GET(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    return NextResponse.json({
      fields: await getIntegrationConfigMasked(),
      encryptionReady: Boolean(process.env.CONFIG_ENCRYPTION_KEY),
    })
  } catch (e) {
    return handleError(e)
  }
}

// PUT { KEY: string | null, ... } — secret '' keeps the current value, null deletes it
export async function PUT(req: NextRequest) {
  try {
    await requireUser(['ADMIN'], req)
    const parsed = patchSchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) throw new HttpError(400, 'รูปแบบข้อมูลไม่ถูกต้อง')
    await saveIntegrationConfig(parsed.data)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
