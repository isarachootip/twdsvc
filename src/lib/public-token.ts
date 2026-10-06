import crypto from 'crypto'
import type { TokenType } from '@prisma/client'
import { prisma } from './db'

export interface RateLimitOptions {
  /** Separate counter namespace (e.g. 'vendor-apply'); default shares the legacy public bucket. */
  bucket?: string
  limit?: number
  windowMs?: number
}

// PostgreSQL-persisted rate limit: default 30 req/นาที/IP สำหรับ public endpoints (08 §6)
export async function rateLimited(req: Request, opts: RateLimitOptions = {}): Promise<boolean> {
  const { bucket, limit = 30, windowMs = 60_000 } = opts
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local'
  const now = Date.now()
  const key = bucket ? `ratelimit:${bucket}:${ip}` : `ratelimit:${ip}`
  const fresh = JSON.stringify({ count: 1, resetAt: now + windowMs })

  try {
    const entry = await prisma.systemSetting.findUnique({ where: { key } })
    if (!entry) {
      await prisma.systemSetting.upsert({ where: { key }, create: { key, value: fresh }, update: { value: fresh } })
      return false
    }

    const data = JSON.parse(entry.value) as { count: number; resetAt: number }
    if (now > data.resetAt) {
      await prisma.systemSetting.update({ where: { key }, data: { value: fresh } })
      return false
    }

    const newCount = data.count + 1
    await prisma.systemSetting.update({
      where: { key },
      data: { value: JSON.stringify({ count: newCount, resetAt: data.resetAt }) },
    })

    return newCount > limit
  } catch (err) {
    console.error('[rateLimited] DB check failed:', err)
    return false
  }
}

export async function findToken(token: string, type: TokenType | TokenType[]) {
  const types = Array.isArray(type) ? type : [type]
  const pt = await prisma.publicToken.findUnique({ where: { token } })
  if (!pt || !types.includes(pt.type)) return null
  return pt
}

export async function ensurePaymentToken(jobId: string): Promise<string> {
  const existing = await prisma.publicToken.findFirst({ where: { jobId, type: 'PAYMENT', usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } })
  if (existing) return existing.token
  const token = crypto.randomBytes(24).toString('base64url')
  await prisma.publicToken.create({ data: { jobId, type: 'PAYMENT', token, expiresAt: new Date(Date.now() + 7 * 86400000) } })
  return token
}

export async function ensureTrackingToken(jobId: string): Promise<string> {
  const existing = await prisma.publicToken.findFirst({ where: { jobId, type: 'TRACKING' }, orderBy: { createdAt: 'desc' } })
  if (existing) return existing.token
  const token = crypto.randomBytes(24).toString('base64url')
  await prisma.publicToken.create({ data: { jobId, type: 'TRACKING', token, expiresAt: new Date(Date.now() + 90 * 86400000) } })
  return token
}

export async function ensureCsatToken(jobId: string): Promise<string> {
  const existing = await prisma.publicToken.findFirst({ where: { jobId, type: 'CSAT', usedAt: null }, orderBy: { createdAt: 'desc' } })
  if (existing) return existing.token
  const token = crypto.randomBytes(24).toString('base64url')
  await prisma.publicToken.create({ data: { jobId, type: 'CSAT', token, expiresAt: new Date(Date.now() + 14 * 86400000) } })
  return token
}

export async function ensureDriverToken(jobId: string): Promise<string> {
  const existing = await prisma.publicToken.findFirst({ where: { jobId, type: 'DRIVER', usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } })
  if (existing) return existing.token
  const token = crypto.randomBytes(24).toString('base64url')
  await prisma.publicToken.create({ data: { jobId, type: 'DRIVER', token, expiresAt: new Date(Date.now() + 2 * 86400000) } })
  return token
}

