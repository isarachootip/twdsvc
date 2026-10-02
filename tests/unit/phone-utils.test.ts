import assert from 'node:assert'
import { sanitizePhone, formatPhone, isValidThaiPhone } from '@/lib/phone-utils'

console.log('--- Running Phone Utils Unit Tests ---')

// 1. sanitizePhone
assert.strictEqual(sanitizePhone('081-234-5678'), '0812345678', 'Should strip hyphens')
assert.strictEqual(sanitizePhone('081 234 5678'), '0812345678', 'Should strip spaces')
assert.strictEqual(sanitizePhone('abc081-234-5678xyz'), '0812345678', 'Should strip letters')
assert.strictEqual(sanitizePhone('081234567899999'), '0812345678', 'Should truncate to max 10 digits')
assert.strictEqual(sanitizePhone(''), '', 'Should handle empty string')

// 2. formatPhone
assert.strictEqual(formatPhone('0812345678'), '081-234-5678', '10-digit mobile format')
assert.strictEqual(formatPhone('0874953015'), '087-495-3015', '10-digit mobile format test 2')
assert.strictEqual(formatPhone('087-495-3015'), '087-495-3015', 'Already formatted mobile should stay formatted')
assert.strictEqual(formatPhone('021234567'), '02-123-4567', '9-digit landline format')
assert.strictEqual(formatPhone(null), '-', 'Null phone should return dash')
assert.strictEqual(formatPhone(undefined), '-', 'Undefined phone should return dash')
assert.strictEqual(formatPhone(''), '-', 'Empty phone should return dash')
assert.strictEqual(formatPhone('123'), '123', 'Short/unrecognized input returned as-is')

// 3. isValidThaiPhone
assert.strictEqual(isValidThaiPhone('0812345678'), true, 'Valid 10-digit mobile starting with 08')
assert.strictEqual(isValidThaiPhone('0912345678'), true, 'Valid 10-digit mobile starting with 09')
assert.strictEqual(isValidThaiPhone('0612345678'), true, 'Valid 10-digit mobile starting with 06')
assert.strictEqual(isValidThaiPhone('081-234-5678'), true, 'Valid formatted mobile')
assert.strictEqual(isValidThaiPhone('081234567'), false, 'Only 9 digits is invalid for mobile')
assert.strictEqual(isValidThaiPhone('1812345678'), false, 'Does not start with 0')
assert.strictEqual(isValidThaiPhone(''), false, 'Empty is invalid')

console.log('✅ All Phone Utils Unit Tests Passed!')
