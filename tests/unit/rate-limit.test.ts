import assert from 'node:assert'
import { prisma } from '../../src/lib/db'
import { rateLimited } from '../../src/lib/public-token'

async function run() {
  console.log('--- Running Rate Limit Unit Tests ---')
  const ip = `test-${Date.now()}`
  const req = new Request('http://localhost/x', { headers: { 'x-forwarded-for': ip } })
  const opts = { bucket: 'unit-test', limit: 2, windowMs: 60_000 }

  // 1. Custom limit: first `limit` requests pass, the next is blocked
  assert.strictEqual(await rateLimited(req, opts), false)
  assert.strictEqual(await rateLimited(req, opts), false)
  assert.strictEqual(await rateLimited(req, opts), true)
  console.log('✔ 1. Custom limit enforced')

  // 2. Buckets are independent: a different bucket for the same IP is not blocked
  assert.strictEqual(await rateLimited(req, { ...opts, bucket: 'unit-test-other' }), false)
  console.log('✔ 2. Buckets isolated')

  // 3. Default call keeps legacy behaviour (30/min shared public bucket)
  assert.strictEqual(await rateLimited(req), false)
  console.log('✔ 3. Default behaviour unchanged')

  await prisma.systemSetting.deleteMany({ where: { key: { contains: ip } } })
  console.log('Rate limit tests passed!')
}

run().then(() => process.exit(0)).catch(e => { console.error('Rate limit test failed:', e); process.exit(1) })
