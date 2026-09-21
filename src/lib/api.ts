import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { getCurrentUser, type UserSession } from './auth'
import { prisma } from './db'

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function requireUser(roles?: string[]): Promise<UserSession> {
  const user = await getCurrentUser()
  if (!user) throw new HttpError(401, 'Unauthorized')
  if (roles && !roles.includes(user.role)) throw new HttpError(403, 'ไม่มีสิทธิ์ใช้งานส่วนนี้')
  return user
}

export function handleError(e: unknown) {
  if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status })
  console.error('[api]', e)
  const msg = e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'
  return NextResponse.json({ error: msg }, { status: 500 })
}

/** Data scope (08 §4) */
export async function jobScope(user: UserSession): Promise<Prisma.JobWhereInput> {
  switch (user.role) {
    case 'ADMIN':
    case 'EXECUTIVE':
      return {}
    case 'CS':
    case 'GR':
    case 'S2':
      return { branchId: user.siteId ?? '__none__' }
    case 'VD':
      return { vendorCenterId: user.vendorCenterId ?? '__none__' }
    case 'DC': {
      // DC sees channel=DC jobs from branches within user's DC route coverage
      if (!user.siteId) return { channel: 'DC' }
      const routes = await prisma.branchVendorRoute.findMany({ where: { dcSiteId: user.siteId }, select: { branchId: true } })
      if (routes.length === 0) return { channel: 'DC' }
      return { channel: 'DC', branchId: { in: [...new Set(routes.map(r => r.branchId))] } }
    }
    default:
      return { id: '__none__' }
  }
}

export async function assertJobInScope(user: UserSession, jobId: string) {
  const scope = await jobScope(user)
  const found = await prisma.job.findFirst({ where: { AND: [{ id: jobId }, scope] }, select: { id: true } })
  if (!found) throw new HttpError(404, 'ไม่พบงานนี้ หรือไม่มีสิทธิ์เข้าถึง')
}
