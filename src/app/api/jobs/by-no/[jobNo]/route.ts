import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, jobScope, handleError } from '@/lib/api'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobNo: string }> }) {
  try {
    const user = await requireUser()
    const { jobNo } = await params
    const scope = await jobScope(user)
    const job = await prisma.job.findFirst({
      where: { AND: [scope, { jobNo: { equals: decodeURIComponent(jobNo).trim(), mode: 'insensitive' } }] },
      select: { id: true, jobNo: true, stage: true },
    })
    if (!job) return NextResponse.json({ error: 'ไม่พบเลขงานนี้' }, { status: 404 })
    return NextResponse.json(job)
  } catch (e) {
    return handleError(e)
  }
}
