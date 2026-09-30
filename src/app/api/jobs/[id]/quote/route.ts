import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { executeAction, type ActionInput } from '@/lib/state-machine'

export const dynamic = 'force-dynamic'

// GET /api/jobs/[id]/quote -> returns active quote, all quotes, and associated job
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['VD', 'ADMIN', 'CS', 'EXECUTIVE'], req)
    const { id } = await params

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        quotes: {
          include: { lines: true },
          orderBy: { version: 'desc' },
        },
        vendorCenter: { include: { vendorParent: true } },
      },
    })
    if (!job) throw new HttpError(404, 'ไม่พบงานนี้')

    // Scoping for VD
    if (user.role === 'VD' && (!user.vendorCenterId || job.vendorCenterId !== user.vendorCenterId)) {
      throw new HttpError(403, 'ไม่มีสิทธิ์เข้าถึงงานของศูนย์ซ่อมอื่น')
    }

    const latestQuote = job.quotes[0] ?? null
    return NextResponse.json({
      job: { id: job.id, jobNo: job.jobNo, stage: job.stage, vendorCenterId: job.vendorCenterId },
      quote: latestQuote,
      quotes: job.quotes,
    })
  } catch (e) {
    return handleError(e)
  }
}

// POST /api/jobs/[id]/quote -> create / revise quote
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(['VD', 'ADMIN'], req)
    const { id } = await params

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      throw new HttpError(400, 'Invalid JSON')
    }

    const job = await prisma.job.findUnique({
      where: { id },
      include: { vendorCenter: true, quotes: true },
    })
    if (!job) throw new HttpError(404, 'ไม่พบงานนี้')

    // Scoping for VD
    if (user.role === 'VD' && (!user.vendorCenterId || job.vendorCenterId !== user.vendorCenterId)) {
      throw new HttpError(403, 'ไม่มีสิทธิ์เข้าถึงงานของศูนย์ซ่อมอื่น')
    }

    // Determine action: vd_revise_quote or vd_submit_quote
    const isRevise = body.action === 'vd_revise_quote' || body.revise === true || (job.stage === 'WAITING_APPROVAL' && body.action !== 'vd_submit_quote')
    const action = isRevise ? 'vd_revise_quote' : 'vd_submit_quote'

    const input: ActionInput = {
      version: body.version !== undefined ? Number(body.version) : job.version,
      repairDays: Number(body.repairDays) || 1,
      vendorNote: typeof body.vendorNote === 'string' ? body.vendorNote : undefined,
      vendorCenterId: (body.vendorCenterId as string) || (user.role === 'ADMIN' ? undefined : (user.vendorCenterId ?? undefined)),
      lines: Array.isArray(body.lines) ? body.lines : [],
    }

    const result = await executeAction(id, action, input, {
      userId: user.id,
      role: user.role,
      siteId: user.siteId,
      vendorCenterId: user.vendorCenterId,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 })
    }

    // Retrieve updated job quotes
    const updatedJob = await prisma.job.findUnique({
      where: { id },
      include: { quotes: { include: { lines: true }, orderBy: { version: 'desc' } } },
    })
    const createdQuote = updatedJob?.quotes[0] ?? null

    return NextResponse.json({
      success: true,
      quote: createdQuote,
      job: result.job,
      extra: result.extra,
    }, { status: 201 })
  } catch (e) {
    return handleError(e)
  }
}
