import { NextRequest, NextResponse } from 'next/server'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { getSettings, setSetting, SETTING_DEFAULTS } from '@/lib/settings'

export async function GET() {
  try {
    await requireUser(['ADMIN'])
    return NextResponse.json(await getSettings())
  } catch (e) {
    return handleError(e)
  }
}

// PUT { KEY: value, ... }
export async function PUT(req: NextRequest) {
  try {
    await requireUser(['ADMIN'])
    const body: Record<string, unknown> = await req.json()
    for (const [k, v] of Object.entries(body)) {
      if (!(k in SETTING_DEFAULTS)) throw new HttpError(400, `ไม่รู้จักค่าตั้ง ${k}`)
      const val = typeof v === 'string' ? v : JSON.stringify(v)
      if (k === 'VAT_RATE' && !(Number(val) >= 0 && Number(val) < 1)) {
        throw new HttpError(400, 'VAT ต้องอยู่ระหว่าง 0–1 (เช่น 0.07)')
      }
      if (['QUOTE_EXPIRY_DAYS', 'TRADEIN_COUPON_VALID_DAYS'].includes(k) && !(Number(val) >= 1)) {
        throw new HttpError(400, `${k} ต้อง ≥ 1`)
      }
      await setSetting(k, val)
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return handleError(e)
  }
}
