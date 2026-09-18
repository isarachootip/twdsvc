import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './db'
import crypto from 'crypto'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'svc-new-secret-2026-please-change')
const ACCESS_TTL = 15 * 60        // 15 minutes in seconds
const REFRESH_TTL = 7 * 24 * 3600 // 7 days in seconds

export interface UserSession {
  id: string
  username: string
  fullName: string
  role: string
  siteId: string | null
  vendorCenterId: string | null
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function signAccessToken(user: UserSession): Promise<string> {
  return new SignJWT({ sub: user.id, role: user.role, siteId: user.siteId, vendorCenterId: user.vendorCenterId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${ACCESS_TTL}s`)
    .setIssuedAt()
    .sign(SECRET)
}

export async function verifyAccessToken(token: string): Promise<{ sub: string; role: string; siteId?: string; vendorCenterId?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { sub: string; role: string; siteId?: string; vendorCenterId?: string }
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('access_token')?.value
    if (!token) return null
    const payload = await verifyAccessToken(token)
    if (!payload) return null
    const user = await prisma.user.findUnique({
      where: { id: payload.sub, active: true },
      select: { id: true, username: true, fullName: true, role: true, siteId: true, vendorCenterId: true },
    })
    if (!user) return null
    return { ...user, role: user.role.toString() }
  } catch {
    return null
  }
}
