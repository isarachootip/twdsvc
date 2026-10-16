import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { queryActiveSitesForDropdown } from '@/lib/sites-query'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const user = await getCurrentUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sites = await queryActiveSitesForDropdown()
  return NextResponse.json(
    sites.map(s => ({ id: s.id, code: s.code, name: s.name, type: s.type }))
  )
}
