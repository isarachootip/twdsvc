import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[LINE Webhook Received]', JSON.stringify(body, null, 2))

    // Acknowledge webhook immediately (LINE expects 200 OK)
    return NextResponse.json({ status: 'ok' })
  } catch (err: any) {
    console.error('[LINE Webhook Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
