import { NextResponse } from 'next/server'
import { getBrandingSettings } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const branding = await getBrandingSettings()
    return NextResponse.json(branding)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to load branding'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
