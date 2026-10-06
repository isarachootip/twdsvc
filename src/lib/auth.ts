import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './db'
import crypto from 'crypto'
import { AsyncLocalStorage } from 'async_hooks'

export const authContextStorage = new AsyncLocalStorage<{ token?: string; user?: UserSession }>()

export function runWithAuthToken<T>(token: string, fn: () => Promise<T>): Promise<T> {
  return authContextStorage.run({ token }, fn)
}

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[auth] JWT_SECRET is not set — using development secret. Set JWT_SECRET in production!')
}
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'svc-new-secret-2026-dev-only')
export const ACCESS_TTL_SECONDS = 15 * 60        // 15 minutes in seconds
export const REFRESH_TTL_SECONDS = 7 * 24 * 3600 // 7 days in seconds

export interface UserSession {
  id: string
  username: string
  fullName: string
  role: string
  siteId: string | null
  vendorCenterId: string | null
  siteName?: string | null
  vendorLabel?: string | null
  mustChangePassword?: boolean
}

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function signAccessToken(user: UserSession): Promise<string> {
  return new SignJWT({
    sub: user.id, role: user.role, siteId: user.siteId, vendorCenterId: user.vendorCenterId,
    ...(user.mustChangePassword ? { mcp: true } : {}),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
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

export async function getCurrentUser(req?: Request): Promise<UserSession | null> {
  try {
    let token: string | undefined = authContextStorage.getStore()?.token

    if (!token && req) {
      const authHeader = req.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim()
      } else {
        const cookieHeader = req.headers.get('cookie')
        if (cookieHeader) {
          const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/)
          if (match) token = match[1]
        }
      }
    }

    if (!token) {
      try {
        const cookieStore = await cookies()
        token = cookieStore.get('access_token')?.value
      } catch {
        // Outside Next request context
      }
    }

    if (!token) return null
    const payload = await verifyAccessToken(token)
    if (!payload) return null

    const storedUser = authContextStorage.getStore()?.user
    if (storedUser && storedUser.id === payload.sub) {
      return storedUser
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.sub, active: true },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        siteId: true,
        vendorCenterId: true,
        mustChangePassword: true,
        site: { select: { name: true } },
        vendorCenter: { select: { code: true, vendorParent: { select: { code: true, name: true } } } },
      },
    })
    if (!user) return null
    const { site, vendorCenter, ...rest } = user
    return {
      ...rest,
      role: user.role.toString(),
      siteName: site?.name ?? null,
      vendorLabel: vendorCenter ? `${vendorCenter.vendorParent.code} ${vendorCenter.vendorParent.name}` : null,
    }
  } catch {
    return null
  }
}
