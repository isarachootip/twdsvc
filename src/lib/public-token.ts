import crypto from 'crypto'
import type { TokenType } from '@prisma/client'
import { prisma } from './db'

// simple in-memory rate limit: 30 req/นาที/IP สำหรับ public endpoints (08 §6)
const hits = new Map<string, { n: number; t: number }>()
export function rateLimited(req: Request): boolean {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'local'
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || now - h.t > 60_000) { hits.set(ip, { n: 1, t: now }); return false }
  h.n++
  if (hits.size > 5000) hits.clear()
  return h.n > 30
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

