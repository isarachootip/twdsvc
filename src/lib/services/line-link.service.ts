import { createHash, randomInt } from 'node:crypto'
import { prisma } from '@/lib/db'
import { HttpError } from '@/lib/api'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I
const CODE_LENGTH = 8
const TTL_MS = 10 * 60 * 1000

const hashCode = (code: string) => createHash('sha256').update(code).digest('hex')

function generateCode(): string {
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i++) out += ALPHABET[randomInt(ALPHABET.length)]
  return out
}

/** Returns the normalised code if the text looks like one, else null. */
export function extractLinkCode(text: string): string | null {
  const clean = text.toUpperCase().replace(/[\s-]/g, '')
  return new RegExp(`^[${ALPHABET}]{${CODE_LENGTH}}$`).test(clean) ? clean : null
}

/** Issues a fresh single-use code; any older unused codes for the user are invalidated. */
export async function issueLinkCode(userId: string): Promise<{ code: string; expiresAt: Date }> {
  const code = generateCode()
  const expiresAt = new Date(Date.now() + TTL_MS)
  await prisma.$transaction([
    prisma.lineLinkCode.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.lineLinkCode.create({ data: { userId, codeHash: hashCode(code), expiresAt } }),
  ])
  return { code, expiresAt }
}

/** Binds a LINE userId to the user who issued the code. 400 invalid/expired/used, 409 LINE already linked. */
export async function consumeLinkCode(code: string, lineUserId: string): Promise<{ userId: string }> {
  const row = await prisma.lineLinkCode.findUnique({ where: { codeHash: hashCode(code) } })
  if (!row || row.usedAt || row.expiresAt < new Date()) throw new HttpError(400, 'รหัสไม่ถูกต้องหรือหมดอายุ')

  const owner = await prisma.user.findUnique({ where: { lineUserId }, select: { id: true } })
  if (owner && owner.id !== row.userId) throw new HttpError(409, 'บัญชี LINE นี้ถูกเชื่อมกับผู้ใช้อื่นแล้ว')

  // updateMany guards against a concurrent double-use of the same code
  const claimed = await prisma.lineLinkCode.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: new Date() } })
  if (claimed.count !== 1) throw new HttpError(400, 'รหัสไม่ถูกต้องหรือหมดอายุ')
  await prisma.user.update({ where: { id: row.userId }, data: { lineUserId } })
  return { userId: row.userId }
}

export async function unlinkLine(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { lineUserId: null } })
}
