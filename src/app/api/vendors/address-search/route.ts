import { NextRequest, NextResponse } from 'next/server'
import { searchThaiAddress } from '@/lib/services/thai-address-search'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  if (query.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }
  const results = searchThaiAddress(query, 20)
  return NextResponse.json({ results })
}
