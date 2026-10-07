import assert from 'node:assert'
import { resolveDestination } from '@/lib/queue-destination'
import { STAGE_LABELS } from '@/lib/constants'

console.log('--- Running Queue Destination Unit Tests ---')

const labels = { receive: 'รับจาก CS', pack: 'Pack สินค้า', handoff: 'ส่งมอบขนส่ง' }
const tabs = {
  receive: [{ id: 'a' }],
  pack: [{ id: 'job-1' }],
  gr_received: [{ id: 'job-1' }], // alias key — ต้องไม่ถูกใช้
  handoff: [{ id: 'b' }],
}

// 1. งานอยู่ในแท็บของหน้านี้ → ชื่อแท็บ
assert.strictEqual(
  resolveDestination({ jobId: 'job-1', stage: 'GR_RECEIVED', tabs, labels }),
  'Pack สินค้า',
  'Job found in a tab should resolve to that tab label',
)

// 2. งานออกจากหน้านี้ไปแล้ว → ชื่อสถานะใหม่
assert.strictEqual(
  resolveDestination({ jobId: 'job-x', stage: 'OUTBOUND_TO_DC', tabs, labels }),
  STAGE_LABELS.OUTBOUND_TO_DC,
  'Job not in any tab should resolve to the new stage label',
)

// 3. alias key ที่ไม่มีใน labels ต้องถูกข้าม
assert.strictEqual(
  resolveDestination({ jobId: 'only-alias', stage: 'GR_RECEIVED', tabs: { gr_received: [{ id: 'only-alias' }] }, labels }),
  STAGE_LABELS.GR_RECEIVED,
  'Alias keys absent from labels must be ignored',
)

// 4. stage ไม่รู้จัก / ไม่มี → null
assert.strictEqual(resolveDestination({ jobId: 'job-x', stage: 'UNKNOWN_STAGE', tabs, labels }), null, 'Unknown stage → null')
assert.strictEqual(resolveDestination({ jobId: 'job-x', stage: undefined, tabs, labels }), null, 'Missing stage → null')

// 5. งานยังอยู่แท็บเดิม (เช่น dispatch_pickup) → ชื่อแท็บเดิม
assert.strictEqual(
  resolveDestination({ jobId: 'b', stage: 'GR_PACKED', tabs, labels }),
  'ส่งมอบขนส่ง',
  'Job staying in the same tab resolves to its current tab label',
)

// 6. ไม่มี labels (API เก่า) → ใช้ชื่อสถานะ
assert.strictEqual(
  resolveDestination({ jobId: 'job-1', stage: 'GR_RECEIVED', tabs, labels: undefined }),
  STAGE_LABELS.GR_RECEIVED,
  'Missing labels map falls back to stage label',
)

console.log('✅ Queue Destination Unit Tests Passed')
