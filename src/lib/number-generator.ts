import { prisma } from './db'

function getYYMM(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  return `${yy}${mm}`
}

function getDDMMYYYY(date: Date = new Date()): string {
  const bkk = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const dd = String(bkk.getDate()).padStart(2, '0')
  const mm = String(bkk.getMonth() + 1).padStart(2, '0')
  const yyyy = String(bkk.getFullYear())
  return `${dd}${mm}${yyyy}`
}

async function nextSeq(prefix: string): Promise<number> {
  const result = await prisma.runningNumber.upsert({
    where: { prefix },
    update: { lastSeq: { increment: 1 } },
    create: { prefix, lastSeq: 1 },
    select: { lastSeq: true },
  })
  return result.lastSeq
}

export async function generateJobNo(branchId?: string | null, date: Date = new Date()): Promise<string> {
  let branchCode = 'HQ'
  const cleanId = (branchId === 'CUSTOMER' || branchId === 'STOCK') ? null : branchId

  if (cleanId) {
    const site = await prisma.site.findUnique({
      where: { id: cleanId },
      select: { nickname: true, code: true },
    })
    if (site) {
      const candidate = (site.nickname || site.code || 'HQ').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
      if (candidate) branchCode = candidate
    }
  }

  const ddmmyyyy = getDDMMYYYY(date)
  const key = `JOB-${branchCode}-${ddmmyyyy}`
  const seq = await nextSeq(key)
  return `${branchCode}-${ddmmyyyy}-${String(seq).padStart(4, '0')}`
}

export async function generateQuoteNo(): Promise<string> {
  const yymm = getYYMM()
  const key = `QT-${yymm}`
  const seq = await nextSeq(key)
  return `${key}-${String(seq).padStart(5, '0')}`
}

export async function generateTradeInNo(): Promise<string> {
  const yymm = getYYMM()
  const key = `TI-${yymm}`
  const seq = await nextSeq(key)
  return `${key}-${String(seq).padStart(5, '0')}`
}

export async function generateTrackingNo(prefix = 'TPL'): Promise<string> {
  const yymm = getYYMM()
  const key = `${prefix}-${yymm}`
  const seq = await nextSeq(key)
  return `${key}-${String(seq).padStart(6, '0')}`
}
