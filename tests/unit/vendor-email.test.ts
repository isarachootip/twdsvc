import { step1StoreSchema } from '../../src/lib/validations/vendor-setup.schema'
import { buildApprovalEmail } from '../../src/lib/services/vendor-email-template'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

const baseStore = {
  name: 'ร้านทดสอบ',
  type: 'บริษัทจำกัด' as const,
  taxId: '1234567890123',
  phone: '0812345678',
  branches: [
    {
      id: 'b1', branchName: 'สาขาหลัก', address: '1 ถนนทดสอบ', province: 'กรุงเทพมหานคร',
      amphoe: 'บางนา', phone: '0812345678', radius: 30, vip: false, express: false,
    },
  ],
}

function runEmailTests() {
  console.log('Running vendor-email unit tests...')

  // Test 1: email is required and must be valid
  assert(!step1StoreSchema.safeParse(baseStore).success, 'missing email must be rejected')
  assert(!step1StoreSchema.safeParse({ ...baseStore, email: 'not-an-email' }).success, 'invalid email must be rejected')
  assert(step1StoreSchema.safeParse({ ...baseStore, email: ' Shop@Example.com ' }).success, 'valid email must be accepted')
  console.log('✔ Test 1: email validation')

  // Test 2: template contains login details and escapes store name
  const mail = buildApprovalEmail({
    storeName: '<b>ร้าน</b> & Co',
    username: 'vd-2026-123456',
    tempPassword: 'Abcd2345efgh',
    loginUrl: 'https://svc.example.com/login',
  })
  assert(mail.subject.includes('อนุมัติ'), 'subject mentions approval')
  for (const part of ['vd-2026-123456', 'Abcd2345efgh', 'https://svc.example.com/login']) {
    assert(mail.text.includes(part) && mail.html.includes(part), `email must include ${part}`)
  }
  assert(!mail.html.includes('<b>ร้าน</b>') && mail.html.includes('&lt;b&gt;'), 'store name must be HTML-escaped')
  console.log('✔ Test 2: approval email content and escaping')

  console.log('All vendor-email tests passed successfully!')
}

runEmailTests()
