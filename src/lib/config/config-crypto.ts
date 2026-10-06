import crypto from 'crypto'

const PREFIX = 'enc:v1:'
const KEY_BYTES = 32

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX)
}

function parseKey(keyB64: string | undefined): Buffer {
  if (!keyB64) throw new Error('CONFIG_ENCRYPTION_KEY ยังไม่ได้ตั้งค่าใน .env')
  const key = Buffer.from(keyB64, 'base64')
  if (key.length !== KEY_BYTES) throw new Error('CONFIG_ENCRYPTION_KEY ต้องเป็นกุญแจ 32 ไบต์ (base64)')
  return key
}

/** AES-256-GCM. Stored as enc:v1:<iv>:<tag>:<ciphertext> (base64 parts). Throws if the key is missing/invalid. */
export function encryptSecret(plain: string, keyB64: string | undefined = process.env.CONFIG_ENCRYPTION_KEY): string {
  const key = parseKey(keyB64)
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`
}

/** Returns null (never throws) for tampered data, wrong key, or values that are not encrypted. */
export function decryptSecret(stored: string, keyB64: string | undefined = process.env.CONFIG_ENCRYPTION_KEY): string | null {
  if (!isEncrypted(stored)) return null
  try {
    const key = parseKey(keyB64)
    const [ivB64, tagB64, dataB64] = stored.slice(PREFIX.length).split(':')
    if (!ivB64 || !tagB64 || !dataB64) return null
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
