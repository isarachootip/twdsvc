import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { signAccessToken, generateRefreshToken, hashToken, ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS } from '@/lib/auth'

async function rotate(): Promise<boolean> {
  const store = await cookies()
  const raw = store.get('refresh_token')?.value
  if (!raw) return false
  const rt = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(raw) }, include: { user: true } })
  if (!rt || rt.revokedAt || rt.expiresAt < new Date() || !rt.user.active) return false
  const next = generateRefreshToken()
  await prisma.$transaction([
    prisma.refreshToken.update({ where: { id: rt.id }, data: { revokedAt: new Date() } }),
    prisma.refreshToken.create({
      data: {
        userId: rt.userId,
        tokenHash: hashToken(next),
        expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
      },
    }),
  ])
  const u = rt.user
  const access = await signAccessToken({
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    role: u.role,
    siteId: u.siteId,
    vendorCenterId: u.vendorCenterId,
    mustChangePassword: u.mustChangePassword,
  })
  const secure = process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false'
  store.set('access_token', access, { httpOnly: true, secure, sameSite: 'lax', maxAge: ACCESS_TTL_SECONDS, path: '/' })
  store.set('refresh_token', next, { httpOnly: true, secure, sameSite: 'lax', maxAge: REFRESH_TTL_SECONDS, path: '/' })
  return true
}

// POST — used by client when receiving 401
export async function POST() {
  const ok = await rotate()
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'refresh failed' }, { status: 401 })
}

// GET ?next=/path — used by middleware when access token expires during page navigation
export async function GET(req: NextRequest) {
  const nextPath = new URL(req.url).searchParams.get('next') || '/'
  const safe = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/'
  const ok = await rotate()
  const res = NextResponse.redirect(new URL(ok ? safe : `/login?next=${encodeURIComponent(safe)}`, req.url))
  if (!ok) {
    res.cookies.delete('access_token')
    res.cookies.delete('refresh_token')
  }
  return res
}
