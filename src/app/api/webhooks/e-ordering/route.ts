import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { handleError, HttpError } from '@/lib/api'
import { getIntegrationConfig } from '@/lib/services/integration-config.service'
import { EOrderingWebhookPayloadSchema } from '@/lib/validations/eordering.schema'
import { confirmEOrderingWebhook } from '@/lib/services/eordering.service'

function verifySecret(provided: string | null, expected: string): boolean {
  if (!expected) return true
  if (!provided) return false
  const a = Buffer.from(provided.trim())
  const b = Buffer.from(expected.trim())
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/**
 * POST /api/webhooks/e-ordering
 * รับแจ้งผลการชำระเงินจากระบบ E-ordering เมื่อลูกค้าสแกน QR จ่ายเงินสำเร็จ
 */
export async function POST(req: NextRequest) {
  try {
    const cfg = await getIntegrationConfig()
    const secret = cfg.EORDERING_WEBHOOK_SECRET.trim()
    if (secret) {
      const headerSecret =
        req.headers.get('x-eordering-secret') ??
        req.headers.get('x-webhook-secret') ??
        req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
        null
      if (!verifySecret(headerSecret, secret)) {
        throw new HttpError(401, 'Invalid E-ordering webhook secret')
      }
    }

    const rawBody: unknown = await req.json().catch(() => null)
    const parsed = EOrderingWebhookPayloadSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? 'รูปแบบข้อมูล Webhook ไม่ถูกต้อง')
    }

    const result = await confirmEOrderingWebhook(parsed.data)
    return NextResponse.json(result)
  } catch (e) {
    return handleError(e)
  }
}
