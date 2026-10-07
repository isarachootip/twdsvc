import assert from 'node:assert'
import { findJobTab } from '@/lib/job-locator'

console.log('--- Running Job Locator Unit Tests ---')

const tabs = {
  receive: [{ id: 'a', jobNo: 'JB-2609-00015' }],
  pack: [{ id: 'b', jobNo: 'SSM-07102026-0001' }],
  gr_received: [{ id: 'b', jobNo: 'SSM-07102026-0001' }], // alias — ไม่อยู่ใน tabKeys
}
const keys = ['receive', 'pack', 'handoff'] as const

// 1. เจอในแท็บ → คืน tab + jobId
assert.deepStrictEqual(findJobTab(tabs, keys, 'SSM-07102026-0001'), { tab: 'pack', jobId: 'b' }, 'Found in pack tab')

// 2. ไม่สนตัวพิมพ์เล็ก/ใหญ่ + ตัดช่องว่างหัวท้าย
assert.deepStrictEqual(findJobTab(tabs, keys, '  jb-2609-00015 '), { tab: 'receive', jobId: 'a' }, 'Case-insensitive & trimmed')

// 3. ไม่เจอ → null
assert.strictEqual(findJobTab(tabs, keys, 'JB-0000-00000'), null, 'Not found → null')

// 4. query ว่าง → null
assert.strictEqual(findJobTab(tabs, keys, '   '), null, 'Empty query → null')

// 5. ค้นตามลำดับ tabKeys เท่านั้น (ข้าม alias ที่ไม่อยู่ใน keys)
assert.strictEqual(findJobTab({ gr_received: tabs.gr_received }, keys, 'SSM-07102026-0001'), null, 'Ignores keys not listed')

// 6. แท็บที่ไม่มีข้อมูล (undefined) ไม่ทำให้พัง
assert.strictEqual(findJobTab({}, keys, 'JB-2609-00015'), null, 'Missing tab arrays are safe')

console.log('✅ Job Locator Unit Tests Passed')
