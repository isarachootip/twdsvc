import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireUser, handleError } from '@/lib/api'
import { canViewCost } from '@/lib/settings'
import { refreshBreaches } from '@/lib/sla-engine'
import {
  overviewRange, loadClosedJobs, summarize, openJobs, pipelineCounts, slaViolations, waitingParts,
  vdPerformance, vatRate, dashboardWidgets, inRange,
} from '@/lib/reports'

function pct(now: number, prior: number) {
  if (!prior) return now ? 100 : 0
  return Math.round(((now - prior) / Math.abs(prior)) * 100)
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(['ADMIN', 'EXECUTIVE'])
    await refreshBreaches(true)

    const sp = new URL(req.url).searchParams
    const period = sp.get('period') ?? 'weekly'
    const branchId = sp.get('branchId') || null
    const where: Prisma.JobWhereInput = branchId && branchId !== 'ALL' ? { branchId } : {}

    const { cur, prior, buckets } = overviewRange(period)
    const vat = await vatRate()
    const costOk = await canViewCost(user.role)

    const [closedCur, closedPrior, open] = await Promise.all([
      loadClosedJobs(cur.from, cur.to, where),
      loadClosedJobs(prior.from, prior.to, where),
      openJobs(where),
    ])

    const s = summarize(closedCur, vat)
    const sp2 = summarize(closedPrior, vat)

    const openedCur = await prisma.job.findMany({
      where: { AND: [where, { openedAt: { gte: cur.from, lt: cur.to } }] },
      select: { openedAt: true, closedAt: true, stage: true },
    })
    const openedPrior = await prisma.job.count({
      where: { AND: [where, { openedAt: { gte: prior.from, lt: prior.to } }] },
    })
    const closedAll = await prisma.job.findMany({
      where: { AND: [where, { closedAt: { gte: cur.from, lt: cur.to } }] },
      select: { closedAt: true },
    })

    const violations = slaViolations(open)
    const wpList = waitingParts(open)

    const perBucket = buckets.map(b => {
      const bs = summarize(closedCur.filter(j => inRange(j.closedAt, b)), vat)
      const inCount = openedCur.filter(j => inRange(j.openedAt, b)).length
      const doneCount = closedAll.filter(j => inRange(j.closedAt, b)).length
      return {
        label: b.label,
        revenue: bs.revenue,
        revenueBaht: Math.round(bs.revenue / 100),
        cost: bs.cost,
        profit: bs.gp,
        profitBaht: Math.round(bs.gp / 100),
        in: inCount,
        done: doneCount,
      }
    })

    const vd = vdPerformance(closedCur)
    const widgets = await dashboardWidgets()
    const pendingApproval = open.filter(j => j.stage === 'WAITING_APPROVAL').length
    const unit = period === 'weekly' ? 'จากช่วงก่อนหน้า' : period === 'monthly' ? 'จากปีก่อน' : 'จาก 3 ปีก่อนหน้า'

    const activeGrowth = pct(openedCur.length, openedPrior)
    const profitGrowth = pct(s.gp, sp2.gp)

    // Pipeline counts
    const pipeline = pipelineCounts(open.map(j => j.stage))

    // Finance data formatted for Recharts
    const financeData = perBucket.map(b => ({
      period: b.label,
      revenue: b.revenueBaht,
      cost: Math.round(b.cost / 100),
      profit: b.profitBaht,
      gpPct: b.revenue ? Math.round((b.profit / b.revenue) * 1000) / 10 : 0,
    }))

    // Trend data formatted for Recharts
    const trendData = perBucket.map(b => ({
      day: b.label,
      jobs: b.in,
      done: b.done,
    }))

    // GP Breakdown formatted for Recharts
    const gpBreakdown = [
      { name: 'ค่าอะไหล่', value: Math.round(s.gpParts / 100), satang: s.gpParts, color: '#185FA5' },
      { name: 'ค่าแรงช่าง', value: Math.round(s.gpLabor / 100), satang: s.gpLabor, color: '#1D9E75' },
      { name: 'ค่าดำเนินการ', value: Math.max(0, Math.round((s.gp - s.gpParts - s.gpLabor) / 100)), satang: Math.max(0, s.gp - s.gpParts - s.gpLabor), color: '#C8102E' },
    ]

    // Vendor ranking with top / bottom indicators
    const vdRanking = vd.map((v, i) => ({
      ...v,
      top: i === 0,
      bottom: i === vd.length - 1 && vd.length > 2,
    }))

    return NextResponse.json({
      periodLabel: cur.label,
      canViewCost: costOk,
      widgets,
      kpi: {
        active: openedCur.length,
        activeTrend: `${activeGrowth >= 0 ? '+' : ''}${activeGrowth}% ${unit}`,
        pending: pendingApproval,
        slaCritical: violations.length,
        profit: costOk ? s.gp : null,
        profitTrend: costOk ? `${profitGrowth >= 0 ? '+' : ''}${profitGrowth}% ${unit}` : null,
        // Named keys matching test F03-T02
        ACTIVE_JOBS: openedCur.length,
        PENDING_APPROVAL: pendingApproval,
        SLA_CRITICAL: violations.length,
        GROSS_PROFIT: costOk ? s.gp : null,
      },
      spark: {
        in: perBucket.map(b => b.in),
        revenue: perBucket.map(b => b.revenueBaht),
      },
      pipeline,
      financeData: costOk ? financeData : null,
      trendData,
      gpBreakdown: costOk ? gpBreakdown : null,
      gpDetails: costOk ? { labor: s.gpLabor, parts: s.gpParts, total: s.gp } : null,
      slaViolations: violations.slice(0, 50),
      waitingParts: wpList,
      vdRanking,
      vd,
      vdSummary: {
        avgOnTime: vd.length ? Math.round((vd.reduce((a, v) => a + v.onTime, 0) / vd.length) * 10) / 10 : 0,
        avgSla: vd.length ? Math.round((vd.reduce((a, v) => a + v.sla, 0) / vd.length) * 10) / 10 : 0,
        totalJobs: vd.reduce((a, v) => a + v.jobs, 0),
        activeVendors: await prisma.vendorParent.count({ where: { active: true } }),
      },
    })
  } catch (e) {
    return handleError(e)
  }
}
