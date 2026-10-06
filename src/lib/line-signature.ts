import { createHmac, timingSafeEqual } from 'node:crypto'

/** Verifies LINE's X-Line-Signature (HMAC-SHA256 of raw body, base64). */
export function verifyLineSignature(
  rawBody: string,
  signature: string | null,
  channelSecret: string,
): boolean {
  if (!signature || !channelSecret) return false
  const expected = createHmac('sha256', channelSecret).update(rawBody).digest()
  const given = Buffer.from(signature, 'base64')
  if (given.length !== expected.length) return false
  return timingSafeEqual(given, expected)
}
