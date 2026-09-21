import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError } from '@/lib/api'
import { canViewCost, getJsonSetting } from '@/lib/settings'

interface Deduction {
  id: string
  vendorParentId: string
  jobNo?: string
  amount: number // Satang
  reason: string
  createdAt: string
  usedInBatch?: string | null
}

function bkkDate(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d) - 7 * 3600000)
}

// Compute cycles (05 §7) — bi-monthly or from PayoutCycleConfig
async function cycles() {
  const cfg = await prisma.payoutCycleConfig.findFirst({ where: { active: true } })
  const type = cfg?.cycleType ?? 'BIMONTHLY'
  const d1 = cfg?.dayOfMonth1 ?? 5
  const d2 = cfg?.dayOfMonth2 ?? 20
  const now = new Date(Date.now() + 7 * 3600000)
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const d = now.getUTCDate()
  const points: Date[] = []

  if (type === 'WEEKLY') {
    for (let i = -8; i <= 1; i++) {
      points.push(bkkDate(y, m, d - now.getUTCDay() + 7 * i + 5))
    }
  } else if (type === 'MONTHLY') {
    for (let i = -6; i <= 1; i++) {
      points.push(bkkDate(y, m + i, d1))
    }
  } else if (type === 'EVERY_15_DAYS') {
    for (let i = -6; i <= 1; i++) {
      points.push(bkkDate(y, m + i, 1))
      points.push(bkkDate(y, m + i, 16))
    }
  } else {
    // BIMONTHLY default
    for (let i = -4; i <= 1; i++) {
      points.push(bkkDate(y, m + i, d1))
      points.push(bkkDate(y, m + i, d2))
    }
  }

  points.sort((a, b) => a.getTime() - b.getTime())
  const list = []
  const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

  for (let i = 1; i < points.length; i++) {
    const to = points[i]
    const from = points[i - 1]
    const lbl = new Date(to.getTime() + 7 * 3600000)
    list.push({
      key: to.toISOString(),
      label: `รอบ ${lbl.getUTCDate()} ${TH_MONTHS[lbl.getUTCMonth()]} ${lbl.getUTCFullYear() + 543}`,
      from: new Date(from.getTime() + 7 * 3600000).toISOString().slice(0, 10),
      to: new Date(to.getTime() + 7 * 3600000 - 86400000).toISOString().slice(0, 10),
    })
  }

  const nowIso = new Date().toISOString()
  const current = list.find(c => c.key >= nowIso) ?? list[list.length - 1]
  return {
    list: list.filter(c => c.key <= (current?.key ?? nowIso)).reverse().slice(0, 8),
    current,
  }
}

// GET /api/reports/vd-payment?from=yyyy-mm-dd&to=yyyy-mm-dd
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(['ADMIN', 'EXECUTIVE'])
    const sp = new URL(req.url).searchParams
    const cyc = await cycles()
    const from = sp.get('from') || cyc.current?.from || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    const to = sp.get('to') || cyc.current?.to || new Date().toISOString().slice(0, 10)

    const fromDate = new Date(`${from}T00:00:00+07:00`)
    const toDate = new Date(`${to}T23:59:59.999+07:00`)

    // Find closed jobs with approved repair
    const jobs = await prisma.job.findMany({
      where: {
        type: 'CUSTOMER',
        stage: { in: ['CLOSED_REPAIRED', 'READY_FOR_PICKUP'] },
        closedAt: { gte: fromDate, lte: toDate },
      },
      include: {
        branch: { select: { id: true, name: true, nickname: true } },
        vendorCenter: {
          select: {
            id: true,
            code: true,
            gpPctOverride: true,
            vendorParent: { select: { id: true, code: true, name: true, defaultGpPct: true } },
          },
        },
        quotes: {
          where: { status: 'APPROVED' },
          select: { subtotal: true, total: true },
          orderBy: { version: 'desc' },
          take: 1,
        },
        payoutLines: {
          select: {
            id: true,
            status: true,
            batch: { select: { id: true, batchNo: true, status: true } },
          },
        },
      },
      orderBy: { closedAt: 'asc' },
    })

    const rows = jobs
      .filter(j => j.vendorCenter && (j.quotes[0]?.subtotal ?? 0) > 0)
      .map(j => {
        const vp = j.vendorCenter!.vendorParent
        const amountSatang = j.quotes[0]?.subtotal ?? 0
        const gpPct = j.vendorCenter!.gpPctOverride ?? vp.defaultGpPct
        const gpAmountSatang = Math.floor((amountSatang * gpPct) / 100 + 0.5)
        const netAmountSatang = amountSatang - gpAmountSatang
        const line = j.payoutLines.find(l => l.status !== 'PENDING') ?? j.payoutLines[0]

        return {
          id: j.id,
          jobId: j.id,
          jobNo: j.jobNo,
          vendorParentId: vp.id,
          vd: vp.code,
          vdCode: j.vendorCenter!.code,
          vdName: vp.name,
          branchId: j.branch.id,
          branch: j.branch.nickname || j.branch.name,
          store: j.branch.name,
          customer: j.customerName,
          customerName: j.customerName ?? '-',
          phone: j.customerPhone,
          customerPhone: j.customerPhone ?? '-',
          product: j.productName,
          productName: j.productName,
          brand: j.brandName,
          brandName: j.brandName,
          closedDate: j.closedAt ? j.closedAt.toISOString().slice(0, 10) : '',
          // Satang integer amounts
          amount: amountSatang,
          repairAmount: amountSatang,
          repairAmountSatang: amountSatang,
          gp: gpPct,
          gpPct,
          gpAmount: gpAmountSatang,
          gpAmountSatang,
          net: netAmountSatang,
          netAmount: netAmountSatang,
          netAmountSatang,
          status: line ? line.status : 'PENDING',
          batchNo: line?.batch.batchNo ?? null,
        }
      })

    const rawDeductions = await getJsonSetting<Deduction[]>('VENDOR_DEDUCTIONS')
    const deductions = (rawDeductions || []).filter(d => !d.usedInBatch)
    const costOk = await canViewCost(user.role)

    return NextResponse.json({
      from,
      to,
      cycles: cyc.list,
      currentCycle: cyc.current?.key ?? null,
      rows,
      deductions,
      canViewCost: costOk,
    })
  } catch (e) {
    return handleError(e)
  }
}
