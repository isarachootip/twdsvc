import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getIntegrationConfig } from '@/lib/services/integration-config.service'
import { verifyLineSignature } from '@/lib/line-signature'
import { extractLinkCode, consumeLinkCode } from '@/lib/services/line-link.service'
import { replyText } from '@/lib/line-push'
import { HttpError } from '@/lib/api'

export const dynamic = 'force-dynamic'

const webhookSchema = z.object({
  events: z.array(
    z.object({
      type: z.string(),
      replyToken: z.string().optional(),
      source: z.object({ userId: z.string().optional() }).optional(),
      message: z.object({ type: z.string(), text: z.string().optional() }).optional(),
    }),
  ),
})

async function handleTextEvent(text: string, lineUserId: string, replyToken: string) {
  const code = extractLinkCode(text)
  if (!code) {
    await replyText(replyToken, 'หากต้องการเชื่อมบัญชี ให้พิมพ์รหัส 8 หลักจากหน้า "เชื่อมต่อ LINE" ในระบบ')
    return
  }
  try {
    await consumeLinkCode(code, lineUserId)
    await replyText(replyToken, '✅ เชื่อมต่อบัญชี LINE สำเร็จแล้ว คุณจะได้รับการแจ้งเตือนผ่านช่องทางนี้')
  } catch (err) {
    const msg = err instanceof HttpError ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่'
    await replyText(replyToken, `❌ ${msg}`)
  }
}

export async function POST(req: NextRequest) {
  // Raw body is required: the signature is computed over the exact bytes LINE sent
  const raw = await req.text()
  const secret = (await getIntegrationConfig()).LINE_CHANNEL_SECRET
  if (!verifyLineSignature(raw, req.headers.get('x-line-signature'), secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let json: unknown
  try { json = JSON.parse(raw) } catch { return NextResponse.json({ error: 'Bad request' }, { status: 400 }) }
  const parsed = webhookSchema.safeParse(json)
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  for (const ev of parsed.data.events) {
    const userId = ev.source?.userId
    if (ev.type === 'message' && ev.message?.type === 'text' && ev.message.text && userId && ev.replyToken) {
      await handleTextEvent(ev.message.text, userId, ev.replyToken)
    }
  }
  return NextResponse.json({ status: 'ok' })
}
