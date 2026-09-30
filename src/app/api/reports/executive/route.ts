import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError } from '@/lib/api'
import { canViewCost } from '@/lib/settings'
import {
  executiveRange, loadClosedJobs, summarize, approvalRate, csatAvg, tradeinConversion, openJobs,
  backlogAging, jobFinance, jobBreached, vatRate, vendorThreshold, waitingParts, inRange,
} from '@/lib/reports'

function pct(now: number, prior: number) {
  if (!prior) return now ? 100 : 0
  return Math.round(((now - prior) / Math.abs(prior)) * 1000) / 10
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser(['ADMIN', 'EXECUTIVE'], req)
    const period = new URL(req.url).searchParams.get('period') ?? 'month'
    const { cur, prior, buckets } = executiveRange(period)
    const vat = await vatRate()
    const costOk = await canViewCost(user.role)

    const trendFrom = buckets[0]?.from ?? cur.from
    const trendTo = buckets[buckets.length - 1]?.to ?? cur.to

    const [curJobs, priorJobs, trendJobs] = await Promise.all([
      loadClosedJobs(cur.from, cur.to),
      loadClosedJobs(prior.from, prior.to),
      loadClosedJobs(trendFrom, trendTo),
    ])

    const c = summarize(curJobs, vat)
    const p = summarize(priorJobs, vat)

    const [appr, apprPrior, csat, ti] = await Promise.all([
      approvalRate(cur.from, cur.to),
      approvalRate(prior.from, prior.to),
      csatAvg(cur.from, cur.to),
      tradeinConversion(cur.from, cur.to),
    ])

    const open = await openJobs()
    const backlog = backlogAging(open)

    // Branch ranking (Revenue in Satang)
    const branchMap = new Map<string, { name: string; revenue: number; n: number; ok: number }>()
    for (const j of curJobs) {
      const r = branchMap.get(j.branch.id) ?? { name: j.branch.name, revenue: 0, n: 0, ok: 0 }
      r.revenue += jobFinance(j, vat).revenue
      r.n++
      if (!jobBreached(j)) r.ok++
      branchMap.set(j.branch.id, r)
    }

    const branches = [...branchMap.values()]
      .map(b => ({
        name: b.name,
        revenue: Math.round(b.revenue), // Satang
        jobs: b.n,
        sla: b.n ? Math.round((b.ok / b.n) * 1000) / 10 : 0,
        top: false,
        bottom: false,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    if (branches.length > 0) branches[0].top = true
    if (branches.length > 1) branches[branches.length - 1].bottom = true

    // Vendor concentration (jobs opened in period)
    const opened = await prisma.job.groupBy({
      by: ['vendorCenterId'],
      where: { type: 'CUSTOMER', openedAt: { gte: cur.from, lt: cur.to }, vendorCenterId: { not: null } },
      _count: { _all: true },
    })
    const centers = await prisma.vendorCenter.findMany({
      where: { id: { in: opened.map(o => o.vendorCenterId!) } },
      select: { id: true, vendorParent: { select: { id: true, code: true, name: true } } },
    })

    const vmap = new Map<string, { name: string; n: number }>()
    for (const o of opened) {
      const vp = centers.find(cc => cc.id === o.vendorCenterId)?.vendorParent
      if (!vp) continue
      const r = vmap.get(vp.id) ?? { name: `${vp.code} ${vp.name}`, n: 0 }
      r.n += o._count._all
      vmap.set(vp.id, r)
    }

    const totalOpened = [...vmap.values()].reduce((s, v) => s + v.n, 0)
    const sortedV = [...vmap.values()].sort((a, b) => b.n - a.n)
    const VD_COLORS = ['#C8102E', '#185FA5', '#BA7517', '#6B6459', '#1D9E75']

    const vdConcentration = sortedV.slice(0, 3).map((v, i) => ({
      name: v.name,
      value: totalOpened ? Math.round((v.n / totalOpened) * 100) : 0,
      pct: totalOpened ? Math.round((v.n / totalOpened) * 100) : 0,
      color: VD_COLORS[i % VD_COLORS.length],
    }))

    if (sortedV.length > 3) {
      const rest = sortedV.slice(3).reduce((s, v) => s + v.n, 0)
      vdConcentration.push({
        name: `อื่นๆ (${sortedV.length - 3} ศูนย์)`,
        value: totalOpened ? Math.round((rest / totalOpened) * 100) : 0,
        pct: totalOpened ? Math.round((rest / totalOpened) * 100) : 0,
        color: '#6B6459',
      })
    }

    // Trend (in Satang and formatted for Recharts)
    const trend = buckets.map(b => {
      const bs = summarize(trendJobs.filter(j => inRange(j.closedAt, b)), vat)
      return {
        month: b.label,
        label: b.label,
        revenue: Math.round(bs.revenue / 100), // In Baht for chart display
        revenueSatang: bs.revenue,
        gp: Math.round(bs.gp / 100), // In Baht for chart display
        gpSatang: bs.gp,
        gpPct: bs.revenue ? Math.round((bs.gp / bs.revenue) * 1000) / 10 : 0,
      }
    })

    const cxTrend = await Promise.all(
      buckets.map(async b => ({
        month: b.label,
        label: b.label,
        csat: (await csatAvg(b.from, b.to)) ?? 4.5,
        approvalPct: await approvalRate(b.from, b.to),
        tradeinPct: await tradeinConversion(b.from, b.to),
      }))
    )

    // Attention items
    const threshold = await vendorThreshold()
    const attention: Array<{ t: string; s: string; level: 'HIGH' | 'MEDIUM' | 'LOW' | 'high' | 'medium' | 'watch' }> = []
    const now = new Date()
    const months = [0, 1, 2].map(i => ({
      from: new Date(now.getFullYear(), now.getMonth() - i, 1),
      to: new Date(now.getFullYear(), now.getMonth() - i + 1, 1),
    }))

    const last3 = await loadClosedJobs(months[2].from, months[0].to)
    const vendorMonthly = new Map<string, { name: string; months: Array<{ n: number; ok: number }> }>()
    for (const j of last3) {
      if (!j.vendorCenter) continue
      const vp = j.vendorCenter.vendorParent
      const idx = months.findIndex(m => j.closedAt && j.closedAt >= m.from && j.closedAt < m.to)
      if (idx < 0) continue
      const r = vendorMonthly.get(vp.id) ?? { name: `${vp.code} ${vp.name}`, months: [{ n: 0, ok: 0 }, { n: 0, ok: 0 }, { n: 0, ok: 0 }] }
      r.months[idx].n++
      if (!jobBreached(j)) r.months[idx].ok++
      vendorMonthly.set(vp.id, r)
    }

    for (const v of vendorMonthly.values()) {
      if (v.months.every(m => m.n > 0 && (m.ok / m.n) * 100 < threshold)) {
        attention.push({
          t: `${v.name} มี SLA Compliance ต่ำกว่ามาตรฐาน (${threshold}%) 3 เดือนติดต่อกัน`,
          s: 'ควรพิจารณาทบทวนสัญญาหรือแผนพัฒนาศักยภาพ',
          level: 'HIGH',
        })
      }
    }

    const oldBatches = await prisma.payoutBatch.findMany({
      where: { status: 'SENT', submittedAt: { lt: new Date(Date.now() - 30 * 86400000) } },
      select: { totalAmount: true },
    })
    if (oldBatches.length) {
      const sumBaht = Math.round(oldBatches.reduce((s, b) => s + b.totalAmount, 0) / 100)
      attention.push({
        t: 'ยอดค้างจ่าย VD สะสมเกิน 30 วัน',
        s: `฿${sumBaht.toLocaleString()} — กระทบความสัมพันธ์คู่ค้า`,
        level: 'MEDIUM',
      })
    }

    const lowest = [...branches].sort((a, b) => a.sla - b.sla)[0]
    if (lowest && lowest.sla < 85) {
      attention.push({
        t: `สาขา${lowest.name.replace(/^สาขา/, '')} SLA Compliance ต่ำสุดในเครือข่าย (${lowest.sla}%)`,
        s: 'ควรตรวจสอบขั้นตอนที่ล่าช้าในงานของสาขานี้',
        level: 'MEDIUM',
      })
    }

    const wp = waitingParts(open)
    if (wp.length) {
      const wpTotalBaht = Math.round(wp.reduce((s, w) => s + w.quoteTotal, 0) / 100)
      attention.push({
        t: `งานรออะไหล่ ${wp.length} รายการ`,
        s: `มูลค่าใบเสนอราคาที่ล่าช้าประมาณ ฿${wpTotalBaht.toLocaleString()}`,
        level: 'LOW',
      })
    }

    const top3 = vdConcentration.filter(v => !v.name.startsWith('อื่นๆ')).reduce((s, v) => s + v.pct, 0)
    const topBranch = branches[0]
    const revenueBaht = Math.round(c.revenue / 100)
    const gpBaht = Math.round(c.gp / 100)
    const revenueGrowth = pct(c.revenue, p.revenue)
    const gpGrowth = pct(c.gp, p.gp)
    const margin = c.revenue ? Math.round((c.gp / c.revenue) * 1000) / 10 : 0
    const marginPrior = p.revenue ? Math.round((p.gp / p.revenue) * 1000) / 10 : 0
    const avgTicket = c.closed ? Math.round(c.revenue / c.closed) : 0
    const avgTicketPrior = p.closed ? Math.round(p.revenue / p.closed) : 0

    const summary =
      `ภาพรวม ${cur.label}: รายได้รวมอยู่ที่ ฿${revenueBaht.toLocaleString()} ${revenueGrowth >= 0 ? 'เติบโต +' : 'ลดลง '}${Math.abs(revenueGrowth)}% จากงวดก่อน ` +
      `โดยมีอัตรากำไรขั้นต้นอยู่ที่ ${margin}% (${gpGrowth >= 0 ? '+' : ''}${gpGrowth}% MoM) ` +
      (topBranch ? `สาขา ${topBranch.name} ทำผลงานรายได้สูงสุดในเครือข่าย ` : '') +
      (vdConcentration.length ? `ขณะที่การกระจุกตัวของงานซ่อมสูงสุดอยู่ที่ ${vdConcentration[0].name} (${vdConcentration[0].pct}%) ${top3 > 60 ? 'อยู่ในระดับความเสี่ยงสูง (เกิน 60%) ควรพิจารณาขยายเครือข่าย VD เพิ่มเติม' : 'ยังอยู่ในเกณฑ์ที่ปลอดภัย'}` : '')

    return NextResponse.json({
      periodLabel: cur.label,
      canViewCost: costOk,
      summary,
      fin: costOk ? {
        revenue: c.revenue, // in Satang
        revenuePrior: p.revenue,
        gp: c.gp, // in Satang
        gpPrior: p.gp,
        cost: c.cost, // in Satang
        costPrior: p.cost,
        margin,
        marginPrior,
        revenueGrowth: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}%`,
        gpGrowth: `${gpGrowth >= 0 ? '+' : ''}${gpGrowth}%`,
        avgTicket, // in Satang
        avgTicketGrowth: `${pct(avgTicket, avgTicketPrior) >= 0 ? '+' : ''}${pct(avgTicket, avgTicketPrior)}%`,
      } : null,
      trend: costOk ? trend : null,
      ops: {
        sla: c.slaCompliance,
        slaPrior: p.slaCompliance,
        tat: c.tat,
        tatPrior: p.tat,
        approvalRate: appr,
        approvalPrior: apprPrior,
        backlog: backlog.list,
        backlogBuckets: backlog,
        backlogTotal: open.length,
        closed: c.closed,
      },
      branches: costOk ? branches : branches.map(b => ({ ...b, revenue: 0 })),
      vdConcentration,
      concentrationRisk: top3 > 60,
      cx: {
        csat: csat ?? 4.8,
        approvalRate: appr,
        tradeinConv: ti,
        trend: cxTrend,
      },
      attention,
    })
  } catch (e) {
    return handleError(e)
  }
}
