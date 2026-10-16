import { NextResponse } from 'next/server'
import { queryActiveBranchSites } from '@/lib/sites-query'

export const dynamic = 'force-dynamic'

// GET /api/vendors/public-sites — ดึงรายชื่อสาขา SVC ที่เปิดใช้งานจริง (แหล่งข้อมูลเดียวกับ /api/sites)
export async function GET() {
  try {
    const sites = await queryActiveBranchSites()
    return NextResponse.json(
      sites.map(s => ({
        id: s.id,
        code: s.code,
        nickname: s.nickname,
        name: s.name,
        province: s.province,
        region: s.region,
      }))
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
