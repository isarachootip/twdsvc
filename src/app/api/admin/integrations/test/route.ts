import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { getIntegrationConfig } from '@/lib/services/integration-config.service'
import { createSmtpTransport, readSmtpSettings } from '@/lib/services/smtp-transport'

export const dynamic = 'force-dynamic'

const bodySchema = z.discriminatedUnion('target', [
  z.object({ target: z.literal('line') }),
  z.object({ target: z.literal('smtp') }),
  z.object({ target: z.literal('smtp-send'), to: z.string().trim().email('อีเมลผู้รับไม่ถูกต้อง') }),
])

const MIN_INTERVAL_MS = 5000
const lastCall = new Map<string, number>()
const TIMEOUT_MS = 10_000

interface TestResult {
  ok: boolean
  message: string
}

async function testLine(token: string): Promise<TestResult> {
  if (!token) return { ok: false, message: 'ยังไม่ได้ตั้งค่า Channel Access Token' }
  const res = await fetch('https://api.line.me/v2/bot/info', {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (res.status === 401) return { ok: false, message: 'Access Token ไม่ถูกต้องหรือหมดอายุ' }
  if (!res.ok) return { ok: false, message: `LINE ตอบกลับสถานะ ${res.status}` }
  const info = (await res.json().catch(() => ({}))) as { displayName?: string; basicId?: string }
  return { ok: true, message: `เชื่อมต่อสำเร็จ: ${info.displayName ?? 'LINE OA'}${info.basicId ? ` (${info.basicId})` : ''}` }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(['ADMIN'], req)
    const parsed = bodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'รูปแบบข้อมูลไม่ถูกต้อง')

    const now = Date.now()
    if (now - (lastCall.get(user.id) ?? 0) < MIN_INTERVAL_MS) throw new HttpError(429, 'ทดสอบถี่เกินไป กรุณารอสักครู่')
    lastCall.set(user.id, now)

    const cfg = await getIntegrationConfig()
    const body = parsed.data

    if (body.target === 'line') return NextResponse.json(await testLine(cfg.LINE_CHANNEL_ACCESS_TOKEN))

    const smtp = readSmtpSettings(cfg)
    if (!smtp) return NextResponse.json({ ok: false, message: 'ยังไม่ได้ตั้งค่า SMTP Host และอีเมลผู้ส่ง' })
    const transport = createSmtpTransport(smtp)
    await transport.verify()
    if (body.target === 'smtp') return NextResponse.json({ ok: true, message: 'เชื่อมต่อ SMTP สำเร็จ' })

    await transport.sendMail({
      from: smtp.from,
      to: body.to,
      subject: 'ทดสอบการส่งอีเมล — Thaiwasadu Service Center',
      text: 'อีเมลนี้ส่งจากปุ่มทดสอบในหน้าตั้งค่าระบบ หากคุณได้รับแสดงว่าตั้งค่า SMTP ถูกต้อง',
    })
    return NextResponse.json({ ok: true, message: `ส่งอีเมลทดสอบไปที่ ${body.to} แล้ว` })
  } catch (e) {
    if (e instanceof HttpError) return handleError(e)
    // Network/SMTP errors: return a short message only, never the raw error (may echo credentials/hosts)
    console.error('[integrations/test]', e instanceof Error ? e.message : e)
    return NextResponse.json({ ok: false, message: 'เชื่อมต่อไม่สำเร็จ กรุณาตรวจสอบโฮสต์ พอร์ต และข้อมูลล็อกอิน' })
  }
}
