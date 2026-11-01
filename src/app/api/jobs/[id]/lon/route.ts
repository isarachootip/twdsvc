import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'
import {
  dispatchLonNotification,
  getLonEndpointToggles,
  listJobLonLogs,
} from '@/lib/services/lon-notify.service'
import { lonResendRequestSchema } from '@/lib/validations/lon.schema'

export const dynamic = 'force-dynamic'

const VIEW_ROLES = ['CS', 'GR', 'DC', 'S2', 'ADMIN', 'EXECUTIVE'] as const
const SEND_ROLES = ['CS', 'GR', 'S2', 'ADMIN'] as const

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser([...VIEW_ROLES], req)
    const { id } = await params
    const job = await prisma.job.findUnique({
      where: { id },
      select: { id: true, branchId: true, type: true },
    })
    if (!job) throw new HttpError(404, 'ไม่พบงานแจ้งซ่อม')
    if ((user.role === 'CS' || user.role === 'GR') && user.siteId && job.branchId !== user.siteId) {
      throw new HttpError(403, 'ไม่มีสิทธิ์เข้าถึงงานของสาขาอื่น')
    }

    const [logs, toggles] = await Promise.all([listJobLonLogs(job.id), getLonEndpointToggles()])
    return NextResponse.json({ logs, toggles })
  } catch (e) {
    return handleError(e)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser([...SEND_ROLES], req)
    const { id } = await params
    const raw = await req.json().catch(() => null)
    const parsed = lonResendRequestSchema.safeParse(raw)
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? 'รูปแบบคำสั่งส่ง LON ไม่ถูกต้อง')
    }

    const job = await prisma.job.findUnique({
      where: { id },
      select: { id: true, branchId: true, type: true },
    })
    if (!job) throw new HttpError(404, 'ไม่พบงานแจ้งซ่อม')
    if ((user.role === 'CS' || user.role === 'GR') && user.siteId && job.branchId !== user.siteId) {
      throw new HttpError(403, 'ไม่มีสิทธิ์ส่งแจ้งเตือนสำหรับงานสาขาอื่น')
    }
    if (job.type !== 'CUSTOMER') {
      throw new HttpError(400, 'ส่งแจ้งเตือน LON ได้เฉพาะงานซ่อมลูกค้าเท่านั้น')
    }

    const result = await dispatchLonNotification({
      jobId: job.id,
      type: parsed.data.type,
      statusLabel: parsed.data.statusLabel,
      triggeredBy: user.username,
      req,
    })
    const logs = await listJobLonLogs(job.id)
    return NextResponse.json({ result, logs })
  } catch (e) {
    return handleError(e)
  }
}
