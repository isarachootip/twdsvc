import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import {
  getCurrentUser, signAccessToken, generateRefreshToken, hashToken, ACCESS_TTL_SECONDS, REFRESH_TTL_SECONDS,
} from '@/lib/auth'
import { handleError, HttpError } from '@/lib/api'
import { changePassword } from '@/lib/services/password.service'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  currentPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน').max(200),
  newPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านใหม่').max(200),
})

/**
 * Deliberately uses getCurrentUser instead of requireUser: users with a temporary password
 * are blocked by requireUser everywhere else, but must be able to reach this endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    const current = await getCurrentUser(req)
    if (!current) throw new HttpError(401, 'Unauthorized')

    const parsed = bodySchema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง')

    await changePassword(current.id, parsed.data.currentPassword, parsed.data.newPassword)

    // All refresh tokens were revoked, so issue a fresh session (flag now false) to keep this device signed in
    const fresh = await getCurrentUser(req)
    const user = fresh ?? current
    const access = await signAccessToken({ ...user, mustChangePassword: false })
    const refreshRaw = generateRefreshToken()
    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hashToken(refreshRaw), expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000) },
    })

    const store = await cookies()
    const secure = process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE !== 'false'
    store.set('access_token', access, { httpOnly: true, secure, sameSite: 'lax', maxAge: ACCESS_TTL_SECONDS, path: '/' })
    store.set('refresh_token', refreshRaw, { httpOnly: true, secure, sameSite: 'lax', maxAge: REFRESH_TTL_SECONDS, path: '/' })

    return NextResponse.json({ ok: true, role: user.role })
  } catch (e) {
    return handleError(e)
  }
}
