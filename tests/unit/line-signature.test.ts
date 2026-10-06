import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { verifyLineSignature } from '../../src/lib/line-signature'

const secret = 'test-secret'
const body = '{"events":[]}'
const good = createHmac('sha256', secret).update(body).digest('base64')

assert.equal(verifyLineSignature(body, good, secret), true)
console.log('✔ 1. valid signature accepted')

assert.equal(verifyLineSignature(body + ' ', good, secret), false)
console.log('✔ 2. tampered body rejected')

assert.equal(verifyLineSignature(body, null, secret), false)
assert.equal(verifyLineSignature(body, 'short', secret), false)
assert.equal(verifyLineSignature(body, good, ''), false)
console.log('✔ 3. missing/short signature or empty secret rejected')

console.log('All line-signature tests passed successfully!')
