import assert from 'node:assert'
import { encodeCode128 } from '@/lib/barcode-128'
import {
  deriveSortCode,
  estimatePackageMetrics,
  formatTrackingNo,
  buildCaseA3PlLabel,
} from '@/lib/threepl-label'

console.log('--- Running 3PL Shipping Label Unit Tests ---')

// 1. Code 128 barcode encoding
const barcodeResult = encodeCode128('TH2610100045217A')
assert.ok(barcodeResult.bars.length > 0, 'Barcode should produce bars')
assert.ok(barcodeResult.totalWidth > 100, 'Barcode total width should exceed quiet zone')
assert.strictEqual(encodeCode128('').bars.length, 0, 'Empty string produces empty bars')

// 2. Tracking number formatting
const formatted = formatTrackingNo('TH2610100045217A')
assert.strictEqual(formatted, 'TH 2610 1000 4521 7A', 'Tracking number should be space-segmented')

// 3. Sort code derivation
const sortBkk = deriveSortCode('10310', 'LPW')
assert.ok(sortBkk.startsWith('N12-LPW-'), 'Sort code for Bangkok should begin with N12-LPW-')
const sortOther = deriveSortCode('11000', 'DC')
assert.ok(sortOther.startsWith('C05-DC-'), 'Sort code for 11xxx should begin with C05-DC-')

// 4. Package metrics estimation
const sMetrics = estimatePackageMetrics('1')
assert.strictEqual(sMetrics.weight, '1.25 kg', 'Size 1/S should have 1.25 kg weight')
assert.strictEqual(sMetrics.dimensions, '30×20×15', 'Size 1/S should be 30x20x15')

const lMetrics = estimatePackageMetrics(3)
assert.strictEqual(lMetrics.weight, '8.00 kg', 'Size 3/L should have 8.00 kg weight')
assert.strictEqual(lMetrics.dimensions, '55×40×35', 'Size 3/L should be 55x40x35')

// 5. Case A 3PL Label building (Branch -> Vendor, Non-COD)
const label = buildCaseA3PlLabel({
  jobNo: 'SO-2026-008812',
  productName: 'สว่านโรตารี่ Makita HR2470',
  symptom: 'มอเตอร์ไม่หมุน',
  sizeCategoryId: 1,
  openedAt: new Date('2026-10-10T10:00:00Z'),
  branch: {
    name: 'ไทวัสดุ สาขาบางนา',
    phone: '02-xxx-5600',
    address: 'ต.บางเสาธง อ.บางเสาธง จ.สมุทรปราการ 10570',
    postalCode: '10570',
    province: 'สมุทรปราการ',
  },
  vendor: {
    name: 'ศูนย์บริการมากีต้า',
    centerCode: 'LPW-03',
    phone: '08x-xxx-4417',
    address: '99/12 หมู่บ้านพฤกษา ซอยลาดพร้าว 71 ถนนลาดพร้าว แขวงสะพานสอง เขตวังทองหลาง กรุงเทพมหานคร',
    postalCode: '10310',
    province: 'กรุงเทพฯ',
  },
  trackingNo: 'TH2610100045217A',
})

assert.strictEqual(label.orderNo, 'SO-2026-008812', 'Order number should match jobNo')
assert.strictEqual(label.isCod, false, 'Case A must be NON-COD')
assert.strictEqual(label.codAmount, 0, 'COD amount must be 0')
assert.strictEqual(label.trackingNo, 'TH 2610 1000 4521 7A', 'Tracking number should be formatted')
assert.strictEqual(label.sender.name, 'ไทวัสดุ สาขาบางนา', 'Sender should be branch')
assert.ok(label.recipient.name.includes('ศูนย์บริการมากีต้า'), 'Recipient should be vendor')
assert.strictEqual(label.recipient.postalCode, '10310', 'Postal code should be 10310')
assert.strictEqual(label.recipient.province, 'กรุงเทพฯ', 'Province should be Bangkok')

console.log('✅ 3PL Shipping Label Unit Tests Passed')
