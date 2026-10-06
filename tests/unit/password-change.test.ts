import bcrypt from 'bcryptjs'
import { prisma } from '../../src/lib/db'
import { validateNewPassword } from '../../src/lib/password-policy'
import { changePassword } from '../../src/lib/services/password.service'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

async function statusOf(fn: () => Promise<unknown>): Promise<number | null> {
  try { await fn() } catch (e) { return (e as { status?: number }).status ?? -1 }
  return null
}

async function run() {
  console.log('Running password-change tests...')

  // --- Policy (pure) ---
  assert(validateNewPassword('Short1', 'Old') !== null, 'too short must be rejected')
  assert(validateNewPassword('alllettersonly', 'Old') !== null, 'no digit must be rejected')
  assert(validateNewPassword('1234567890123', 'Old') !== null, 'no letter must be rejected')
  assert(validateNewPassword('SamePass12345', 'SamePass12345') !== null, 'same as current must be rejected')
  assert(validateNewPassword('a'.repeat(129) + '1', 'Old') !== null, 'too long must be rejected')
  assert(validateNewPassword('GoodPass12345', 'Old') === null, 'valid password accepted')
  console.log('✔ 1. Password policy')

  // --- Service (DB) ---
  const username = `pwtest-${Date.now()}`
  const oldPw = 'OldPass12345'
  const user = await prisma.user.create({
    data: { username, password: await bcrypt.hash(oldPw, 10), fullName: 'PW Test', role: 'VD', mustChangePassword: true },
  })
  await prisma.refreshToken.create({ data: { userId: user.id, tokenHash: `h-${user.id}`, expiresAt: new Date(Date.now() + 3600_000) } })

  try {
    assert((await statusOf(() => changePassword(user.id, 'WrongPass12345', 'NewPass123456'))) === 400, 'wrong current → 400')
    assert((await statusOf(() => changePassword(user.id, oldPw, 'weak'))) === 400, 'weak new → 400')
    assert((await statusOf(() => changePassword(user.id, oldPw, oldPw))) === 400, 'same password → 400')
    let u = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    assert(u.mustChangePassword === true, 'flag unchanged after failures')
    console.log('✔ 2. Rejections leave account untouched')

    await changePassword(user.id, oldPw, 'NewPass123456')
    u = await prisma.user.findUniqueOrThrow({ where: { id: user.id } })
    assert(u.mustChangePassword === false, 'flag cleared')
    assert(await bcrypt.compare('NewPass123456', u.password), 'new hash must verify')
    assert(!(await bcrypt.compare(oldPw, u.password)), 'old password must no longer work')
    const live = await prisma.refreshToken.count({ where: { userId: user.id, revokedAt: null } })
    assert(live === 0, 'all prior refresh tokens must be revoked')
    console.log('✔ 3. Success clears flag, rotates hash, revokes sessions')
  } finally {
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } })
    await prisma.user.delete({ where: { id: user.id } })
  }
  console.log('All password-change tests passed successfully!')
}

run().then(() => process.exit(0)).catch(e => { console.error('password-change test failed:', e); process.exit(1) })
