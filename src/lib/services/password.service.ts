import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { HttpError } from '@/lib/api'
import { validateNewPassword } from '@/lib/password-policy'

/**
 * Changes a user's password. Wrong current password and policy violations are both 400 —
 * the caller is already authenticated, so 401 would wrongly trigger the client's session-expired flow.
 * Clears mustChangePassword and revokes every refresh token (other devices are signed out).
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId, active: true }, select: { password: true } })
  if (!user) throw new HttpError(401, 'Unauthorized')

  if (!(await bcrypt.compare(currentPassword, user.password))) throw new HttpError(400, 'รหัสผ่านปัจจุบันไม่ถูกต้อง')
  const problem = validateNewPassword(newPassword, currentPassword)
  if (problem) throw new HttpError(400, problem)

  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: hash, mustChangePassword: false, failedLoginCount: 0, lockedUntil: null },
    }),
    prisma.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ])
}
