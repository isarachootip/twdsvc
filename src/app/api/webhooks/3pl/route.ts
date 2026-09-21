import { NextRequest, NextResponse } from 'next/server'
import { handle3PLWebhook } from '@/lib/threepl'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { trackingNo, status, eventTime, location } = body

    if (!trackingNo || !status) {
      return NextResponse.json({ error: 'Missing trackingNo or status' }, { status: 400 })
    }

    const result = await handle3PLWebhook({ trackingNo, status, eventTime, location })
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[3PL Webhook Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
