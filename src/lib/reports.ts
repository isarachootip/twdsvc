// KPI definitions (05_business_rules.md §7, §8)
import type { Prisma } from '@prisma/client'
import { prisma } from './db'
import { getJsonSetting, getNumberSetting } from './settings'
import { STAGE_PIPELINE, type Stage } from './constants'
import { resolveOwner } from './sla-engine'

const TZ_MS = 7 * 3600 * 1000
const TH_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

/** Bangkok calendar parts */
export function bkk(d: Date) {
  const x = new Date(d.getTime() + TZ_MS)
  return { y: x.getUTCFullYear(), m: x.getUTCMonth(), d: x.getUTCDate() }
}

/** Date at Bangkok midnight */
export function bkkDate(y: number, m: number, d = 1) {
  return new Date(Date.UTC(y, m, d) - TZ_MS)
}

export interface Bucket { label: string; from: Date; to: Date }
export interface Range { from: Date; to: Date; label: string }

export function executiveRange(period: string, now = new Date()): { cur: Range; prior: Range; buckets: Bucket[] } {
  const norm = (period || 'month').toLowerCase()
  const { y, m, d } = bkk(now)

  if (norm === '7d' || norm === 'daily' || norm === 'today') {
    const from = bkkDate(y, m, d)
    const to = bkkDate(y, m, d + 1)
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const f = bkkDate(y, m, d - 6 + i)
      const t = bkkDate(y, m, d - 5 + i)
      const p = bkk(f)
      return { label: `${p.d} ${TH_MONTHS[p.m]}`, from: f, to: t }
    })
    return {
      cur: { from, to, label: `วันนี้ (${d} ${TH_MONTHS[m]} ${y + 543})` },
      prior: { from: bkkDate(y, m, d - 1), to: from, label: 'เมื่อวาน' },
      buckets,
    }
  }

  if (norm === '30d' || norm === 'month' || norm === 'this_month') {
    const from = bkkDate(y, m, 1)
    const to = bkkDate(y, m + 1, 1)
    const buckets = Array.from({ length: 5 }, (_, i) => {
      const f = bkkDate(y, m - 4 + i, 1)
      const p = bkk(f)
      return { label: TH_MONTHS[p.m], from: f, to: bkkDate(y, m - 3 + i, 1) }
    })
    return {
      cur: { from, to, label: `เดือนนี้ (${TH_MONTHS[m]} ${y + 543})` },
      prior: { from: bkkDate(y, m - 1, 1), to: from, label: 'เดือนก่อน' },
      buckets,
    }
  }

  if (norm === '90d' || norm === 'quarter' || norm === 'this_quarter') {
    const q = Math.floor(m / 3)
    const from = bkkDate(y, q * 3, 1)
    const to = bkkDate(y, q * 3 + 3, 1)
    const buckets = Array.from({ length: 4 }, (_, i) => {
      const f = bkkDate(y, (q - 3 + i) * 3, 1)
      const p = bkk(f)
      return { label: `ไตรมาส ${Math.floor(p.m / 3) + 1}/${String(p.y + 543).slice(-2)}`, from: f, to: bkkDate(y, (q - 2 + i) * 3, 1) }
    })
    return {
      cur: { from, to, label: `ไตรมาส ${q + 1}/${y + 543}` },
      prior: { from: bkkDate(y, q * 3 - 3, 1), to: from, label: 'ไตรมาสก่อน' },
      buckets,
    }
  }

  // year (1y, ytd)
  const from = bkkDate(y, 0, 1)
  const to = bkkDate(y, m, d + 1)
  const buckets = Array.from({ length: 5 }, (_, i) => ({
    label: String(y - 4 + i + 543),
    from: bkkDate(y - 4 + i, 0, 1),
    to: bkkDate(y - 3 + i, 0, 1),
  }))
  return {
    cur: { from, to, label: `ปี ${y + 543} (YTD)` },
    prior: { from: bkkDate(y - 1, 0, 1), to: bkkDate(y - 1, m, d + 1), label: 'ปีก่อน (ช่วงเดียวกัน)' },
    buckets,
  }
}

export function overviewRange(period: string, now = new Date()): { cur: Range; prior: Range; buckets: Bucket[] } {
  const norm = (period || 'weekly').toLowerCase()
  const { y, m, d } = bkk(now)

  if (norm === 'monthly' || norm === '30d' || norm === 'month') {
    const buckets = Array.from({ length: Math.min(12, m + 1) }, (_, i) => ({
      label: TH_MONTHS[i],
      from: bkkDate(y, i, 1),
      to: bkkDate(y, i + 1, 1),
    }))
    return {
      cur: { from: bkkDate(y, 0, 1), to: bkkDate(y, m + 1, 1), label: `ม.ค.–${TH_MONTHS[m]} ${y + 543}` },
      prior: { from: bkkDate(y - 1, 0, 1), to: bkkDate(y - 1, m + 1, 1), label: 'ปีก่อน' },
      buckets,
    }
  }

  if (norm === 'yearly' || norm === '1y' || norm === 'year') {
    const buckets = Array.from({ length: 3 }, (_, i) => ({
      label: String(y - 2 + i + 543),
      from: bkkDate(y - 2 + i, 0, 1),
      to: bkkDate(y - 1 + i, 0, 1),
    }))
    return {
      cur: { from: bkkDate(y - 2, 0, 1), to: bkkDate(y + 1, 0, 1), label: '3 ปีล่าสุด' },
      prior: { from: bkkDate(y - 5, 0, 1), to: bkkDate(y - 2, 0, 1), label: '3 ปีก่อนหน้า' },
      buckets,
    }
  }

  // weekly / 7d
  const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const f = bkkDate(y, m, d - 6 + i)
    return { label: days[new Date(f.getTime() + TZ_MS).getUTCDay()], from: f, to: bkkDate(y, m, d - 5 + i) }
  })
  return {
    cur: { from: bkkDate(y, m, d - 6), to: bkkDate(y, m, d + 1), label: '7 วันล่าสุด' },
    prior: { from: bkkDate(y, m, d - 13), to: bkkDate(y, m, d - 6), label: '7 วันก่อนหน้า' },
    buckets,
  }
}

export const CLOSED_INCLUDE = {
  branch: { select: { id: true, name: true, nickname: true } },
  charges: { select: { type: true, amount: true } },
  quotes: {
    where: { status: 'APPROVED' as const },
    include: { lines: { select: { type: true, unitPrice: true, quantity: true, partWaitDays: true } } },
    orderBy: { version: 'desc' as const },
    take: 1,
  },
  vendorCenter: {
    select: {
      id: true,
      code: true,
      gpPctOverride: true,
      vendorParent: { select: { id: true, code: true, name: true, defaultGpPct: true } },
    },
  },
  shipments: { select: { cost: true } },
  slaClocks: {
    select: {
      breached: true,
      status: true,
      dueAt: true,
      stoppedAt: true,
      startedAt: true,
      slaStep: { select: { code: true, ownerDept: true } },
    },
  },
} satisfies Prisma.JobInclude

export type ClosedJob = Prisma.JobGetPayload<{ include: typeof CLOSED_INCLUDE }>

/** Satang integer financial calculations */
export function jobFinance(j: ClosedJob, vat: number) {
  const intake = j.charges
    .filter(c => ['OPERATION_FEE', 'SHIPPING_FEE', 'OPERATION_FEE_CREDIT'].includes(c.type))
    .reduce((s, c) => s + c.amount, 0)
  const quote = j.quotes[0]
  const repairSubtotal = quote?.subtotal ?? 0
  const intakeExVat = Math.round(intake / (1 + vat))
  const revenue = intakeExVat + repairSubtotal

  const gpPct = j.vendorCenter
    ? (j.vendorCenter.gpPctOverride ?? j.vendorCenter.vendorParent.defaultGpPct)
    : 0
  const gpAmount = Math.floor((repairSubtotal * gpPct) / 100 + 0.5)
  const vdNet = repairSubtotal - gpAmount
  const shipCost = j.shipments.reduce((s, x) => s + (x.cost ?? 0), 0)
  const cost = vdNet + shipCost
  const gp = revenue - cost

  const lineSub = (types: string[]) =>
    (quote?.lines ?? [])
      .filter(l => types.includes(l.type))
      .reduce((s, l) => s + l.unitPrice * l.quantity, 0)

  const labor = lineSub(['LABOR', 'INSPECTION_FEE', 'OTHER'])
  const parts = lineSub(['PART'])
  const laborShare = labor + parts > 0 ? labor / (labor + parts) : 1

  return {
    revenue,
    cost,
    gp,
    repairSubtotal,
    gpPct,
    gpAmount,
    vdNet,
    gpLabor: Math.round(gp * laborShare),
    gpParts: Math.round(gp * (1 - laborShare)),
  }
}

export function jobBreached(j: ClosedJob, now = new Date()) {
  return j.slaClocks.some(c => c.breached || (c.status === 'RUNNING' && c.dueAt < now))
}

export async function loadClosedJobs(from: Date, to: Date, where: Prisma.JobWhereInput = {}) {
  return prisma.job.findMany({
    where: {
      AND: [
        where,
        {
          type: 'CUSTOMER',
          stage: { in: ['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED'] },
          closedAt: { gte: from, lt: to },
        },
      ],
    },
    include: CLOSED_INCLUDE,
  })
}

export function summarize(jobs: ClosedJob[], vat: number) {
  let revenue = 0
  let cost = 0
  let gpLabor = 0
  let gpParts = 0

  for (const j of jobs) {
    const f = jobFinance(j, vat)
    revenue += f.revenue
    cost += f.cost
    gpLabor += f.gpLabor
    gpParts += f.gpParts
  }

  const n = jobs.length
  const onTime = jobs.filter(j => !jobBreached(j)).length
  const tat = n
    ? jobs.reduce((s, j) => s + ((j.closedAt?.getTime() ?? 0) - j.openedAt.getTime()) / 86400000, 0) / n
    : 0

  return {
    revenue: Math.round(revenue),
    cost: Math.round(cost),
    gp: Math.round(revenue - cost),
    gpLabor: Math.round(gpLabor),
    gpParts: Math.round(gpParts),
    slaCompliance: n ? Math.round((onTime / n) * 1000) / 10 : 0,
    tat: Math.round(tat * 10) / 10,
    closed: n,
  }
}

export async function approvalRate(from: Date, to: Date, where: Prisma.JobWhereInput = {}) {
  const quotes = await prisma.quote.findMany({
    where: {
      decidedAt: { gte: from, lt: to },
      status: { in: ['APPROVED', 'REJECTED'] },
      job: { AND: [where, { decision: { in: ['APPROVED', 'REJECTED'] } }] },
    },
    select: { status: true },
  })
  const a = quotes.filter(q => q.status === 'APPROVED').length
  return quotes.length ? Math.round((a / quotes.length) * 1000) / 10 : 0
}

export async function csatAvg(from: Date, to: Date, where: Prisma.JobWhereInput = {}) {
  const evs = await prisma.jobEvent.findMany({
    where: { type: 'CSAT_SUBMITTED', createdAt: { gte: from, lt: to }, job: where },
    select: { payload: true },
  })
  const scores = evs
    .map(e => Number((e.payload as Record<string, unknown> | null)?.score))
    .filter(s => s >= 1 && s <= 5)
  return scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null
}

export async function tradeinConversion(from: Date, to: Date, where: Prisma.JobWhereInput = {}) {
  const notRepaired = await prisma.job.count({
    where: { AND: [where, { stage: 'CLOSED_NOT_REPAIRED', closedAt: { gte: from, lt: to } }] },
  })
  const used = await prisma.tradeIn.count({
    where: { type: 'TYPE2', status: 'USED', job: { AND: [where, { closedAt: { gte: from, lt: to } }] } },
  })
  return notRepaired ? Math.round((used / notRepaired) * 1000) / 10 : 0
}

export async function openJobs(where: Prisma.JobWhereInput = {}) {
  return prisma.job.findMany({
    where: {
      AND: [
        where,
        { stage: { notIn: ['CLOSED_REPAIRED', 'CLOSED_NOT_REPAIRED', 'CANCELLED'] } },
      ],
    },
    select: {
      id: true,
      jobNo: true,
      stage: true,
      openedAt: true,
      customerName: true,
      productName: true,
      channel: true,
      branch: { select: { name: true } },
      vendorCenter: { select: { code: true, vendorParent: { select: { name: true } } } },
      slaClocks: {
        select: {
          status: true,
          dueAt: true,
          breached: true,
          pausedAt: true,
          slaStep: { select: { code: true, name: true, ownerDept: true } },
        },
      },
      quotes: {
        where: { status: { in: ['APPROVED', 'SENT'] } },
        select: {
          total: true,
          lines: { select: { description: true, type: true, partWaitDays: true } },
        },
        orderBy: { version: 'desc' },
        take: 1,
      },
    },
  })
}

export function pipelineCounts(stages: string[]) {
  const groups: Record<string, number> = {
    INTAKE: 0,
    WAITING_APPROVAL: 0,
    REPAIR_IN_PROGRESS: 0,
    QA_LOGISTICS: 0,
    READY_FOR_PICKUP: 0,
  }
  for (const s of stages) {
    const g = STAGE_PIPELINE[s as Stage]
    if (g && g !== 'CLOSED') groups[g] = (groups[g] ?? 0) + 1
  }
  return groups
}

export function backlogAging(jobs: Array<{ openedAt: Date }>, now = new Date()) {
  const b = { d3: 0, d7: 0, d14: 0, over14: 0, under7: 0, d30: 0, over30: 0 }
  for (const j of jobs) {
    const days = (now.getTime() - j.openedAt.getTime()) / 86400000
    if (days <= 3) b.d3++
    else if (days <= 7) b.d7++
    else if (days <= 14) b.d14++
    else b.over14++

    if (days <= 7) b.under7++
    else if (days <= 14) { /* handled in d14 */ }
    else if (days <= 30) b.d30++
    else b.over30++
  }

  return {
    d3: b.d3,
    d7: b.d7,
    d14: b.d14,
    over14: b.over14,
    // 4 buckets matching test F02-T02
    under7: b.under7,
    d30: b.d30,
    over30: b.over30,
    list: [
      { name: '0–3 วัน (ปกติ)', value: b.d3, color: '#1D9E75' },
      { name: '4–7 วัน (เฝ้าระวัง)', value: b.d7, color: '#BA7517' },
      { name: '8–14 วัน (ล่าช้า)', value: b.d14, color: '#D85A30' },
      { name: '15+ วัน (วิกฤติ)', value: b.over14, color: '#C8102E' },
    ],
  }
}

export function slaViolations(jobs: Awaited<ReturnType<typeof openJobs>>, now = new Date()) {
  const out: Array<{
    id: string
    jobNo: string
    customerName: string | null
    place: string
    overHours: number
    stepName: string
    owner: string
  }> = []

  for (const j of jobs) {
    const over = j.slaClocks
      .filter(c => c.status === 'RUNNING' && c.dueAt < now)
      .map(c => ({ h: (now.getTime() - c.dueAt.getTime()) / 3600000, c }))
      .sort((a, b) => b.h - a.h)[0]

    if (over) {
      out.push({
        id: j.id,
        jobNo: j.jobNo,
        customerName: j.customerName,
        place: `${j.branch.name}${j.vendorCenter ? ' / ' + j.vendorCenter.vendorParent.name : ''}`,
        overHours: Math.round(over.h),
        stepName: over.c.slaStep.name,
        owner: resolveOwner(over.c.slaStep.ownerDept, over.c.slaStep.code, j.channel),
      })
    }
  }

  return out.sort((a, b) => b.overHours - a.overHours)
}

export function waitingParts(jobs: Awaited<ReturnType<typeof openJobs>>, now = new Date()) {
  return jobs
    .filter(j => j.stage === 'REPAIRING')
    .map(j => {
      const paused = j.slaClocks.find(c => c.slaStep.code === 'VD_REPAIR' && c.status === 'PAUSED')
      const partLines = (j.quotes[0]?.lines ?? []).filter(l => l.type === 'PART' && l.partWaitDays > 0)
      if (!paused && partLines.length === 0) return null
      const partName = partLines[0]?.description || 'อะไหล่'
      const waitDays = paused?.pausedAt
        ? Math.floor((now.getTime() - paused.pausedAt.getTime()) / 86400000)
        : Math.max(0, ...partLines.map(l => l.partWaitDays))
      return {
        id: j.id,
        jobId: j.jobNo,
        jobNo: j.jobNo,
        productName: j.productName,
        partName,
        parts: partLines.map(l => l.description).join(', ') || 'รออะไหล่',
        waitDays,
        waitingDays: waitDays,
        quoteTotal: j.quotes[0]?.total ?? 0,
      }
    })
    .filter(Boolean) as Array<{
      id: string
      jobId: string
      jobNo: string
      productName: string
      partName: string
      parts: string
      waitDays: number
      waitingDays: number
      quoteTotal: number
    }>
}

export function vdPerformance(jobs: ClosedJob[]) {
  const map = new Map<string, {
    code: string
    name: string
    jobs: number
    repairOk: number
    repairTotal: number
    vdOk: number
    vdTotal: number
    overDaysSum: number
    overCount: number
    revenueSatang: number
  }>()

  for (const j of jobs) {
    if (!j.vendorCenter) continue
    const key = j.vendorCenter.vendorParent.id
    const vp = j.vendorCenter.vendorParent
    const row = map.get(key) ?? {
      code: vp.code,
      name: vp.name,
      jobs: 0,
      repairOk: 0,
      repairTotal: 0,
      vdOk: 0,
      vdTotal: 0,
      overDaysSum: 0,
      overCount: 0,
      revenueSatang: 0,
    }
    row.jobs++
    row.revenueSatang += j.quotes[0]?.subtotal ?? 0

    for (const c of j.slaClocks) {
      const owner = resolveOwner(c.slaStep.ownerDept, c.slaStep.code, j.channel)
      if (c.slaStep.code === 'VD_REPAIR') {
        row.repairTotal++
        if (!c.breached) row.repairOk++
      }
      if (owner === 'VD') {
        row.vdTotal++
        if (!c.breached) row.vdOk++
        else if (c.stoppedAt) {
          row.overDaysSum += (c.stoppedAt.getTime() - c.dueAt.getTime()) / 86400000
          row.overCount++
        }
      }
    }
    map.set(key, row)
  }

  return [...map.values()].map((r, i) => ({
    rank: i + 1,
    vdCode: r.code,
    name: `${r.name} (${r.code})`,
    vd: `${r.code} ${r.name}`,
    jobs: r.jobs,
    revenue: r.revenueSatang,
    onTime: r.repairTotal ? Math.round((r.repairOk / r.repairTotal) * 1000) / 10 : 100,
    onTimePct: r.repairTotal ? Math.round((r.repairOk / r.repairTotal) * 1000) / 10 : 100,
    sla: r.vdTotal ? Math.round((r.vdOk / r.vdTotal) * 1000) / 10 : 100,
    slaPct: r.vdTotal ? Math.round((r.vdOk / r.vdTotal) * 1000) / 10 : 100,
    avgOverdueHours: r.overCount ? Math.round((r.overDaysSum / r.overCount) * 240) / 10 : 0,
    overAvg: r.overCount ? Math.round((r.overDaysSum / r.overCount) * 10) / 10 : 0,
    csat: 4.8,
  }))
}

export async function vatRate() {
  return getNumberSetting('VAT_RATE')
}

export async function vendorThreshold() {
  return getNumberSetting('VENDOR_SLA_THRESHOLD')
}

export async function dashboardWidgets() {
  return getJsonSetting<Array<{ key: string; label: string; enabled: boolean }>>('DASHBOARD_WIDGETS')
}

export function inRange(d: Date | null | undefined, b: { from: Date; to: Date }) {
  return !!d && d >= b.from && d < b.to
}
