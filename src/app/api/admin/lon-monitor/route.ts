import { NextRequest, NextResponse } from 'next/server'
import { requireUser, handleError, HttpError } from '@/lib/api'
import {
  fetchRemoteLonReport,
  getLonMonitorReport,
  lonMonitorQuerySchema,
} from '@/lib/services/lon-monitor.service'
import { getLonEndpointToggles } from '@/lib/services/lon-toggles.service'

export const dynamic = 'force-dynamic'

const MONITOR_ROLES = ['ADMIN', 'EXECUTIVE', 'CS'] as const

export async function GET(req: NextRequest) {
  try {
    await requireUser([...MONITOR_ROLES], req)
    const sp = new URL(req.url).searchParams
    const raw = {
      search: sp.get('search') ?? undefined,
      status: sp.get('status') || undefined,
      type: sp.get('type') || undefined,
      from: sp.get('from') || undefined,
      to: sp.get('to') || undefined,
      limit: sp.get('limit') || undefined,
    }

    const parsed = lonMonitorQuerySchema.safeParse(raw)
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? 'พารามิเตอร์ตัวกรองไม่ถูกต้อง')
    }

    const includeRemote = sp.get('remote') === '1'
    const [report, toggles, remote] = await Promise.all([
      getLonMonitorReport(parsed.data),
      getLonEndpointToggles(),
      includeRemote
        ? fetchRemoteLonReport({
            keyword: parsed.data.search,
            from: parsed.data.from,
            to: parsed.data.to,
          })
        : Promise.resolve(null),
    ])

    return NextResponse.json({
      ...report,
      toggles,
      remote,
    })
  } catch (e) {
    return handleError(e)
  }
}
