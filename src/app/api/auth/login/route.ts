import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { signAccessToken, generateRefreshToken, hashToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true, username: true, fullName: true, role: true,
        siteId: true, vendorCenterId: true,
        password: true, active: true,
        failedLoginCount: true, lockedUntil: true,
      },
    })

    if (!user || !user.active) {
      return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    // Check account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000)
      return NextResponse.json({ error: `บัญชีถูกล็อค กรุณารอ ${minutes} นาที` }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      const newCount = (user.failedLoginCount ?? 0) + 1
      const lockData = newCount >= 5
        ? { failedLoginCount: newCount, lockedUntil: new Date(Date.now() + 15 * 60 * 1000) }
        : { failedLoginCount: newCount }
      await prisma.user.update({ where: { id: user.id }, data: lockData })
      return NextResponse.json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    // Reset failed login count
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null } })

    const session = {
      id: user.id, username: user.username, fullName: user.fullName,
      role: user.role.toString(), siteId: user.siteId, vendorCenterId: user.vendorCenterId,
    }

    const accessToken = await signAccessToken(session)
    const refreshRaw = generateRefreshToken()
    const refreshHash = hashToken(refreshRaw)

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    })

    const cookieStore = await cookies()
    cookieStore.set('access_token', accessToken, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 15 * 60, path: '/',
    })
    cookieStore.set('refresh_token', refreshRaw, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', maxAge: 7 * 24 * 3600, path: '/',
    })

    return NextResponse.json({
      id: session.id, username: session.username,
      fullName: session.fullName, role: session.role,
      siteId: session.siteId, vendorCenterId: session.vendorCenterId,
    })
  } catch (e) {
    console.error('[login]', e)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 })
  }
}
