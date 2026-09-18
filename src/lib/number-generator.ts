import { prisma } from './db'

function getYYMM(): string {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  return `${yy}${mm}`
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

export async function generateJobNo(type: 'CUSTOMER' | 'STOCK'): Promise<string> {
  const prefix = type === 'STOCK' ? 'STK' : 'JB'
  const yymm = getYYMM()
  const key = `${prefix}-${yymm}`
  const seq = await nextSeq(key)
  return `${key}-${String(seq).padStart(5, '0')}`
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
