import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { HttpError } from '@/lib/api'

// Ambiguous characters (I, O, l, 0, 1) are excluded so the password can be read out / typed reliably
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghijkmnopqrstuvwxyz'
const DIGIT = '23456789'
const ALL = UPPER + LOWER + DIGIT
const PASSWORD_LENGTH = 12

const pick = (set: string) => set[crypto.randomInt(set.length)]

/** 12-char random password guaranteed to contain upper, lower and digit. */
export function generateTempPassword(): string {
  const chars = [pick(UPPER), pick(LOWER), pick(DIGIT)]
  while (chars.length < PASSWORD_LENGTH) chars.push(pick(ALL))
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

export function usernameForParent(parentCode: string): string {
  return parentCode.toLowerCase()
}

export interface VendorCredentials {
  username: string
  tempPassword: string
}

export interface CreateVendorUserInput {
  parentCode: string
  storeName: string
  centerId: string | null
  email?: string | null
  preserveExisting?: boolean
}

/**
 * Creates or links the VD login for an approved vendor inside the approval transaction.
 * When `preserveExisting` is true and the username already exists (e.g. registered SPCODE vendor),
 * links centerId/email if missing without overwriting the existing password, returning `null`.
 */
export async function createVendorUser(
  tx: Prisma.TransactionClient,
  input: CreateVendorUserInput
): Promise<VendorCredentials | null> {
  const username = usernameForParent(input.parentCode)
  const cleanEmail = input.email?.trim() || null

  if (input.preserveExisting) {
    const existing = await tx.user.findUnique({ where: { username } })
    if (existing) {
      await tx.user.update({
        where: { id: existing.id },
        data: {
          vendorCenterId: existing.vendorCenterId ?? input.centerId,
          email: existing.email ?? cleanEmail,
          active: true,
        },
      })
      return null
    }
  }

  const tempPassword = generateTempPassword()
  try {
    await tx.user.create({
      data: {
        username,
        password: await bcrypt.hash(tempPassword, 12),
        fullName: input.storeName,
        email: cleanEmail,
        role: 'VD',
        vendorCenterId: input.centerId,
        mustChangePassword: true,
      },
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new HttpError(409, `ชื่อผู้ใช้ ${username} มีอยู่ในระบบแล้ว`)
    }
    throw e
  }
  return { username, tempPassword }
}
