import crypto from 'crypto'
import { encryptSecret, decryptSecret, isEncrypted } from '../../src/lib/config/config-crypto'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const KEY = crypto.randomBytes(32).toString('base64')
const OTHER_KEY = crypto.randomBytes(32).toString('base64')

function throws(fn: () => unknown): boolean {
  try { fn() } catch { return true }
  return false
}

function runCryptoTests() {
  console.log('Running config-crypto unit tests...')

  // Test 1: round trip, plaintext never visible
  const stored = encryptSecret('super-secret-token+/=', KEY)
  assert(isEncrypted(stored) && stored.startsWith('enc:v1:'), 'must be tagged enc:v1:')
  assert(!stored.includes('super-secret-token'), 'ciphertext must not contain plaintext')
  assert(decryptSecret(stored, KEY) === 'super-secret-token+/=', 'round trip must restore the value')
  console.log('✔ Test 1: round trip')

  // Test 2: random IV
  assert(encryptSecret('same', KEY) !== encryptSecret('same', KEY), 'IV must be random per encryption')
  console.log('✔ Test 2: unique IV')

  // Test 3: tamper / wrong key → null, never throws
  const parts = stored.split(':')
  parts[4] = Buffer.from('tampered').toString('base64')
  assert(decryptSecret(parts.join(':'), KEY) === null, 'tampered ciphertext → null')
  assert(decryptSecret(stored, OTHER_KEY) === null, 'wrong key → null')
  assert(decryptSecret('garbage', KEY) === null, 'garbage → null')
  assert(decryptSecret('plain-not-encrypted', KEY) === null, 'unencrypted value → null')
  console.log('✔ Test 3: tamper and wrong key rejected')

  // Test 4: bad keys fail loudly on encrypt
  assert(throws(() => encryptSecret('x', undefined)), 'missing key must throw')
  assert(throws(() => encryptSecret('x', 'short')), 'short key must throw')
  assert(throws(() => encryptSecret('x', Buffer.alloc(16).toString('base64'))), '16-byte key must throw')
  console.log('✔ Test 4: invalid key rejected')

  console.log('All config-crypto tests passed successfully!')
}

runCryptoTests()
