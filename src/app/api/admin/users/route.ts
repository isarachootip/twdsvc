import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, handleError, HttpError } from '@/lib/api'
import { Role } from '@prisma/client'

const ROLES: Role[] = ['CS', 'GR', 'DC', 'VD', 'S2', 'ADMIN', 'EXECUTIVE']

export async function GET() {
  try {
    await requireUser(['ADMIN'])
    const users = await prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        active: true,
        siteId: true,
        vendorCenterId: true,
        lockedUntil: true,
        createdAt: true,
        site: { select: { code: true, name: true } },
        vendorCenter: { select: { code: true } },
      },
    })
    return NextResponse.json(users)
  } catch (e) {
    return handleError(e)
  }
}

// POST — สร้างผู้ใช้ / PUT — แก้ไข (password ว่าง = ไม่เปลี่ยน)
async function save(req: NextRequest, create: boolean) {
  const me = await requireUser(['ADMIN'])
  const b = await req.json()
  if (!ROLES.includes(b.role)) throw new HttpError(400, 'Role ไม่ถูกต้อง')
  if (!String(b.fullName ?? '').trim()) throw new HttpError(400, 'กรุณากรอกชื่อ-นามสกุล')
  if (['CS', 'GR', 'S2', 'DC'].includes(b.role) && !b.siteId) {
    throw new HttpError(400, 'Role นี้ต้องผูกกับสาขา/คลัง')
  }
  if (b.role === 'VD' && !b.vendorCenterId) {
    throw new HttpError(400, 'Role VD ต้องผูกกับศูนย์ซ่อม')
  }
  if (b.password && String(b.password).length < 10) {
    throw new HttpError(400, 'รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร')
  }

  const data = {
    fullName: String(b.fullName).trim(),
    email: b.email || null,
    role: b.role as Role,
    siteId: ['CS', 'GR', 'S2', 'DC'].includes(b.role) ? b.siteId : null,
    vendorCenterId: b.role === 'VD' ? b.vendorCenterId : null,
    active: b.active !== false,
  }

  if (create) {
    if (!/^[a-z0-9_.-]{3,}$/i.test(String(b.username ?? ''))) {
      throw new HttpError(400, 'username ต้องเป็นตัวอักษร/ตัวเลขอย่างน้อย 3 ตัว')
    }
    if (!b.password) throw new HttpError(400, 'กรุณากำหนดรหัสผ่าน')
    const u = await prisma.user.create({
      data: {
        ...data,
        username: String(b.username).trim(),
        password: await bcrypt.hash(String(b.password), 12),
      },
    })
    return NextResponse.json({ id: u.id }, { status: 201 })
  }

  if (!b.id) throw new HttpError(400, 'missing id')
  if (b.id === me.id && (data.role !== 'ADMIN' || !data.active)) {
    throw new HttpError(400, 'ไม่สามารถลดสิทธิ์/ปิดบัญชีของตัวเองได้')
  }

  await prisma.user.update({
    where: { id: b.id },
    data: {
      ...data,
      ...(b.password
        ? {
            password: await bcrypt.hash(String(b.password), 12),
            failedLoginCount: 0,
            lockedUntil: null,
          }
        : {}),
      ...(b.unlock ? { failedLoginCount: 0, lockedUntil: null } : {}),
    },
  })

  if (!data.active) {
    await prisma.refreshToken.updateMany({
      where: { userId: b.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  try {
    return await save(req, true)
  } catch (e) {
    return handleError(e)
  }
}

export async function PUT(req: NextRequest) {
  try {
    return await save(req, false)
  } catch (e) {
    return handleError(e)
  }
}
