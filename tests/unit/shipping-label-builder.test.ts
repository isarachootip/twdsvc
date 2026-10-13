import assert from 'node:assert'
import {
  buildThaiwasaduLabel,
  formatThaiNumericDate,
  buildKexLabel,
  formatKexTracking,
} from '@/lib/shipping-labels'
import type { JobView } from '@/lib/job-view'

console.log('--- Running Shipping Label Builder Unit Tests ---')

// 1. Date formatting
const dt = new Date('2026-10-13T09:00:00Z')
const formattedDate = formatThaiNumericDate(dt)
assert.strictEqual(formattedDate, '13/10/2569', 'Date should be 13/10/2569 in Buddhist era')

// Mock JobView
const baseMockJob = {
  id: 'job-123',
  jobNo: 'RP-2610-00123',
  type: 'CUSTOMER',
  stage: 'GR_RECEIVED',
  stageLabel: 'GR รับสินค้าแล้ว',
  stageBadge: 'b-amber',
  channel: 'DC',
  version: 1,
  openedAt: dt,
  stageEnteredAt: dt,
  closedAt: null,
  decision: 'PENDING',
  customerName: 'คุณสมชาย ใจดี',
  customerPhone: '08x-xxx-xxxx',
  productName: 'SAMSUNG WA13',
  brandName: 'เครื่องซักผ้า',
  sku: 'SAM-WA13',
  serialNo: 'SN1234567890',
  symptom: 'ซักแล้วน้ำไม่ระบาย มีเสียงดัง',
  hasWarranty: false,
  shippingMethod: 'STANDARD',
  receiverName: null,
  branch: {
    id: 'b-bna',
    name: 'สาขาบางนา',
    nickname: 'BNA',
    address: 'บางนา ตราด',
  },
  vendor: {
    centerId: 'vc-1',
    centerCode: 'VD-0088-1',
    code: 'VD-0088',
    name: 'บ.ช่างเจริญ',
    deliveryMethod: 'DC',
    address: 'ถ.บางนา-ตราด',
    phone: '02-xxx-xxxx',
    inspectionFee: 0,
    repairWarrantyDays: 30,
  },
  sla: null,
  overdue: false,
  overdueOwner: null,
  maxOverHours: 0,
  money: null,
  unpaid: false,
  intakeUnpaid: false,
  outboundShipment: null,
  inboundShipment: null,
  location: 'A-00-01',
  quote: null,
  items: [],
} as unknown as JobView

// 2. DC Label Building
const dcLabel = buildThaiwasaduLabel(baseMockJob, { box: '1/1', now: dt })
assert.strictEqual(dcLabel.type, 'DC')
assert.strictEqual(dcLabel.headerBadge, 'ผ่าน DC')
assert.strictEqual(dcLabel.jobNo, 'RP-2610-00123')
assert.strictEqual(dcLabel.qrValue, 'RP-2610-00123')
assert.strictEqual(dcLabel.box, '1/1')
assert.strictEqual(dcLabel.origin.name, 'สาขาบางนา')
assert.strictEqual(dcLabel.origin.code, 'BNA')
assert.strictEqual(dcLabel.destinations.length, 2, 'DC route should have 2 steps')
assert.strictEqual(dcLabel.destinations[0].stepType, 'คลังสินค้า DC')
assert.strictEqual(dcLabel.destinations[0].name, 'คลังสินค้า DC วังน้อย')
assert.strictEqual(dcLabel.destinations[1].stepType, 'ศูนย์ซ่อม VD - VD-0088-1')
assert.strictEqual(dcLabel.destinations[1].name, 'บ.ช่างเจริญ')
assert.strictEqual(dcLabel.destinations[1].isHighlighted, true)
assert.strictEqual(dcLabel.product.serialNo, 'S/N: SN1234567890')

// 3. Direct VD Label Building
const vdJob = { ...baseMockJob, channel: 'VD' } as unknown as JobView
const vdLabel = buildThaiwasaduLabel(vdJob, { box: '1/1', now: dt })
assert.strictEqual(vdLabel.type, 'VD')
assert.strictEqual(vdLabel.headerBadge, 'ส่งตรง VD')
assert.strictEqual(vdLabel.destinations.length, 1, 'VD direct should have 1 step')
assert.strictEqual(vdLabel.destinations[0].stepType, 'ศูนย์ซ่อม VD - VD-0088-1')
assert.strictEqual(vdLabel.destinations[0].isHighlighted, true)

// 4. KEX 3PL Label Building
const tplJob = { ...baseMockJob, channel: 'TPL' } as unknown as JobView
const kexLabel = buildKexLabel(tplJob, { trackingNo: 'KEX100150586451', now: dt })
assert.strictEqual(kexLabel.type, 'KEX')
assert.strictEqual(kexLabel.trackingNo, 'KEX 100 150 586 451')
assert.strictEqual(kexLabel.barcodeValue, 'KEX100150586451')
assert.strictEqual(kexLabel.recipient.name, 'บ.ช่างเจริญ')
assert.strictEqual(kexLabel.pieces, '1 Of 1')

console.log('✓ All Shipping Label Builder Tests Passed!')
