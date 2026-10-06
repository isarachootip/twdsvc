import { generateTempPassword, usernameForParent } from '../../src/lib/services/vendor-account.service'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

function runAccountTests() {
  console.log('Running vendor-account unit tests...')

  // Test 1: password length / charset / uniqueness
  const seen = new Set<string>()
  for (let i = 0; i < 200; i++) {
    const p = generateTempPassword()
    assert(p.length === 12, `password must be 12 chars, got ${p.length}`)
    assert(/^[A-HJ-NP-Za-km-z2-9]+$/.test(p), `password has ambiguous/invalid chars: ${p}`)
    assert(/[A-Z]/.test(p) && /[a-z]/.test(p) && /[2-9]/.test(p), `password must mix upper, lower, digit: ${p}`)
    seen.add(p)
  }
  assert(seen.size === 200, 'passwords must not collide in 200 draws')
  console.log('✔ Test 1: temp password format and uniqueness')

  // Test 2: username derivation
  assert(usernameForParent('VD-2026-123456') === 'vd-2026-123456', 'username is lower-cased parent code')
  console.log('✔ Test 2: username derived from parent code')

  console.log('All vendor-account tests passed successfully!')
}

runAccountTests()
