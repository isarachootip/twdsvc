import { prisma } from '@/lib/db'
import { getIntegrationConfig } from '@/lib/services/integration-config.service'
import { sendLinePush, type SendLineResult } from '@/lib/line'

/** Pushes a plain text message to a user who has linked their LINE account. */
export async function pushToUser(userId: string, text: string): Promise<SendLineResult> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { lineUserId: true } })
  if (!user?.lineUserId) return { success: false, mode: 'live', error: 'ผู้ใช้ยังไม่ได้เชื่อมต่อ LINE' }
  return sendLinePush(user.lineUserId, [{ type: 'text', text }])
}

/** Replies to a webhook event (free, no push quota). Never throws. */
export async function replyText(replyToken: string, text: string): Promise<void> {
  const token = (await getIntegrationConfig()).LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ replyToken, messages: [{ type: 'text', text }] }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) console.error('[LINE Reply Error]', res.status)
  } catch (err) {
    console.error('[LINE Reply Exception]', err instanceof Error ? err.message : err)
  }
}
