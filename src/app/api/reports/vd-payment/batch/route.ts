import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { getJsonSetting, setSetting } from '@/lib/settings'

interface Deduction {
  id: string
  vendorParentId: string
  jobNo?: string
  amount: number
  reason: string
  createdAt: string
  usedInBatch?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser(['ADMIN', 'EXECUTIVE'], req)
    const { jobIds, periodFrom, periodTo, from, to } = await req.json()

    if (!Array.isArray(jobIds) || jobIds.length === 0) {
      throw new HttpError(400, 'กรุณาเลือกรายการอย่างน้อย 1 รายการ')
    }

    // Check if any job is already in an active payout batch (prevent double settlement: F18-T05)
    const jobs = await prisma.job.findMany({
      where: {
        id: { in: jobIds },
        payoutLines: { none: { status: { in: ['SENT', 'PAID'] } } },
      },
      include: {
        vendorCenter: {
          select: {
            id: true,
            gpPctOverride: true,
            vendorParent: { select: { id: true, defaultGpPct: true } },
          },
        },
        quotes: {
          where: { status: 'APPROVED' },
          select: { subtotal: true },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    })

    if (!jobs.length) {
      throw new HttpError(400, 'รายการที่เลือกถูกส่งทำจ่ายไปแล้วทั้งหมด')
    }

    const deductions = (await getJsonSetting<Deduction[]>('VENDOR_DEDUCTIONS')) || []
    const now = new Date()
    const yymm = new Date(now.getTime() + 7 * 3600000).toISOString().slice(2, 7).replace('-', '')
    const seq = await prisma.runningNumber.upsert({
      where: { prefix: `PB-${yymm}` },
      update: { lastSeq: { increment: 1 } },
      create: { prefix: `PB-${yymm}`, lastSeq: 1 },
    })
    const batchNo = `PB-${yymm}-${String(seq.lastSeq).padStart(4, '0')}`

    const vendorIds = new Set(
      jobs.map(j => j.vendorCenter?.vendorParent.id).filter(Boolean) as string[]
    )
    const applied = deductions.filter(d => !d.usedInBatch && vendorIds.has(d.vendorParentId))

    // Integer satang calculation
    const lines = jobs.map(j => {
      const amountSatang = j.quotes[0]?.subtotal ?? 0
      const gpPct = j.vendorCenter
        ? (j.vendorCenter.gpPctOverride ?? j.vendorCenter.vendorParent.defaultGpPct)
        : 0
      const gpAmountSatang = Math.floor((amountSatang * gpPct) / 100 + 0.5)
      const netAmountSatang = amountSatang - gpAmountSatang

      return {
        jobId: j.id,
        vendorCenterId: j.vendorCenter?.id ?? null,
        repairAmount: amountSatang,
        gpPct,
        gpAmount: gpAmountSatang,
        netAmount: netAmountSatang,
        status: 'SENT' as const,
      }
    })

    const totalNet = lines.reduce((s, l) => s + l.netAmount, 0)
    const totalDeductions = applied.reduce((s, d) => s + d.amount, 0)
    const totalAmount = Math.max(0, totalNet - totalDeductions)

    const fromDate = periodFrom || from ? new Date(periodFrom || from) : now
    const toDate = periodTo || to ? new Date(periodTo || to) : now

    const batch = await prisma.payoutBatch.create({
      data: {
        batchNo,
        periodFrom: fromDate,
        periodTo: toDate,
        status: 'SENT',
        totalAmount,
        submittedAt: now,
        createdBy: user.username,
        lines: { create: lines },
      },
    })

    if (applied.length) {
      await setSetting(
        'VENDOR_DEDUCTIONS',
        JSON.stringify(
          deductions.map(d =>
            applied.some(a => a.id === d.id) ? { ...d, usedInBatch: batchNo } : d
          )
        )
      )
    }

    return NextResponse.json({
      success: true,
      batchNo: batch.batchNo,
      count: lines.length,
      total: totalAmount,
    })
  } catch (e) {
    return handleError(e)
  }
}
