import assert from 'node:assert'
import {
  isBkkVicinity,
  resolveBranchChannel,
  extractPostalCode,
  cleanBrandNames,
  parseVendorDataRows,
  parseVendorBrandRows,
  parseSkuPartRows,
} from '@/lib/parsers/vendor-matching-parser'
import type { RawVdDataRow, RawVendorBrandRow, RawSkuPartRow } from '@/lib/parsers/vendor-matching-types'

console.log('--- Running Vendor Matching Parser Unit Tests ---')

// 1. isBkkVicinity
assert.strictEqual(isBkkVicinity('กรุงเทพมหานคร'), true)
assert.strictEqual(isBkkVicinity('นนทบุรี'), true)
assert.strictEqual(isBkkVicinity('ภูเก็ต'), false)
assert.strictEqual(isBkkVicinity('เชียงใหม่'), false)
assert.strictEqual(isBkkVicinity(null, '10540'), true)
assert.strictEqual(isBkkVicinity(null, '50000'), false)

// 2. resolveBranchChannel
// Hybrid DC/Store:
assert.strictEqual(resolveBranchChannel('ตจว.ส่ง DC / กทม.ส่งสาขา', 'กรุงเทพมหานคร'), 'DSD')
assert.strictEqual(resolveBranchChannel('ตจว.ส่ง DC / กทม.ส่งสาขา', 'ขอนแก่น'), 'DC')
// Hybrid 3PL/Store:
assert.strictEqual(resolveBranchChannel('ตจว.ส่ง 3PL / กทม.ส่งสาขา', 'สมุทรปราการ'), 'DSD')
assert.strictEqual(resolveBranchChannel('ตจว.ส่ง 3PL / กทม.ส่งสาขา', 'เชียงใหม่'), 'TPL')
// Direct Store:
assert.strictEqual(resolveBranchChannel('Store', 'ภูเก็ต'), 'DSD')
assert.strictEqual(resolveBranchChannel('ส่งซ่อมที่ศูนย์บริการแบรนด์', 'สงขลา'), 'DSD')
// Pure DC:
assert.strictEqual(resolveBranchChannel('DC', 'กรุงเทพมหานคร'), 'DC')

// 3. extractPostalCode
assert.strictEqual(extractPostalCode('70 ถนนริมทางรถไฟ แขวงบางค้อ เขตจอมทอง กทม. 10150'), '10150')
assert.strictEqual(extractPostalCode('12/53 หมู่ 10 ปากเกร็ด จ.นนทบุรี 11120'), '11120')
assert.strictEqual(extractPostalCode('ไม่มีรหัส'), null)

// 4. cleanBrandNames
const b1 = cleanBrandNames('COMFEE, TOSHIBA')
assert.deepStrictEqual(b1.sort(), ['COMFEE', 'TOSHIBA'].sort())

const b2 = cleanBrandNames('G-SPORTS (G-sports, G-SPORT), OMA')
assert.ok(b2.includes('G-SPORTS'))
assert.ok(b2.includes('OMA'))

// 5. parseVendorDataRows
const mockVdRows: RawVdDataRow[] = [
  {
    'Vendor ID': 630211,
    'vendor name': 'ACCORD PREVAIL',
    Type: 'VD เข้าร่วมและเคยมีประวัติแจ้งซ่อม',
    'จุดรับสินค้า': 'DC',
    Address: 'กทม. 10150',
    'ON AVG (วัน)': 28,
  },
  {
    'Vendor ID': 620236,
    'vendor name': 'WIN FAVOUR',
    Type: 'VD ไม่เข้าร่วมแต่มีประวัติแจ้งซ่อม',
    'จุดรับสินค้า': '-',
    Address: '-',
    'ON AVG (วัน)': '-',
  },
]
const parsedVendors = parseVendorDataRows(mockVdRows)
assert.strictEqual(parsedVendors.length, 2)
assert.strictEqual(parsedVendors[0].vendorId, '630211')
assert.strictEqual(parsedVendors[0].active, true)
assert.strictEqual(parsedVendors[0].slaDays, 28)
assert.strictEqual(parsedVendors[1].vendorId, '620236')
assert.strictEqual(parsedVendors[1].active, false)

// 6. parseVendorBrandRows
const mockBrandRows: RawVendorBrandRow[] = [
  { 'รหัส VD': 630211, 'ชื่อ Vendor': 'ACCORD', 'รายชื่อ Brand ที่รับผิดชอบ': 'ACCORD, PREVAIL' },
]
const parsedBrands = parseVendorBrandRows(mockBrandRows)
assert.strictEqual(parsedBrands.length, 1)
assert.strictEqual(parsedBrands[0].brandNames.length, 2)

// 7. parseSkuPartRows
const mockSkuRows: RawSkuPartRow[] = [
  { SKU_Number: 60146617, 'ชื่อสินค้า': 'พัดลม', Brand: 'ACCORD', 'รหัส VD': 630211, 'ชื่อ VD': 'ACCORD' },
]
const parsedSkus = parseSkuPartRows(mockSkuRows)
assert.strictEqual(parsedSkus.length, 1)
assert.strictEqual(parsedSkus[0].sku, '60146617')
assert.strictEqual(parsedSkus[0].vendorNo, '630211')

console.log('✅ All Vendor Matching Parser Unit Tests Passed Successfully!')
