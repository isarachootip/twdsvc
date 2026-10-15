import assert from 'node:assert'
import {
  buildThaiwasaduLabel,
  formatThaiNumericDate,
  buildKexLabel,
  formatKexTracking,
  buildReturnBoxLabel,
  buildLogisticsBoxLabel,
  deriveBranchSortCode,
  normalizeReturnLabelData,
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

// 5. Return Box Label Building (VD -> 3PL -> Branch)
const rs4Job = {
  ...baseMockJob,
  jobNo: 'RS4-14102026-0001',
  channel: 'TPL',
  decision: 'APPROVED',
  branch: { id: 'b-rs4', name: 'สาขารังสิต คลอง4', nickname: null, address: 'รังสิต-นครนายก คลอง 4' },
  vendor: {
    ...baseMockJob.vendor,
    code: '610150',
    name: 'K.T.MAX CO.LTD.(BRANCH 1)',
  },
} as unknown as JobView

assert.strictEqual(deriveBranchSortCode('RS4-14102026-0001', null, 'สาขารังสิต คลอง4'), 'RS4')
assert.strictEqual(deriveBranchSortCode('RP-2610-00123', 'BNA', 'สาขาบางนา'), 'BNA')

const vdTplReturn = buildReturnBoxLabel(rs4Job, {
  source: 'VD',
  trackingNo: 'TPL-2610-000005',
  now: dt,
})
assert.strictEqual(vdTplReturn.title, 'ใบปะหน้ากล่อง (ขาส่งคืน)')
assert.strictEqual(vdTplReturn.headerBadge, 'ขาส่งคืน • 3PL')
assert.strictEqual(vdTplReturn.jobNo, 'RS4-14102026-0001')
assert.strictEqual(vdTplReturn.trackingNo, 'TPL-2610-000005')
assert.strictEqual(vdTplReturn.destination?.name, 'สาขารังสิต คลอง4')
assert.strictEqual(vdTplReturn.destination?.code, 'RS4')
assert.strictEqual(vdTplReturn.origin?.name, '610150 K.T.MAX CO.LTD.(BRANCH 1)')
assert.strictEqual(vdTplReturn.product?.repairOutcome, 'ซ่อมเสร็จพร้อมส่งคืน')

// 6. Return Box Label Building (DC -> Branch & Rejected Job)
const rejectedJob = { ...baseMockJob, decision: 'REJECTED' } as unknown as JobView
const dcReturn = buildReturnBoxLabel(rejectedJob, { source: 'DC', now: dt })
assert.strictEqual(dcReturn.title, 'ใบปะหน้ากล่อง (ขาคืน)')
assert.strictEqual(dcReturn.headerBadge, 'ขาคืนสาขา • จากคลัง DC')
assert.strictEqual(dcReturn.origin?.name, 'คลังสินค้า DC วังน้อย')
assert.strictEqual(dcReturn.destination?.code, 'BNA')
assert.strictEqual(dcReturn.product?.repairOutcome, 'ลูกค้าไม่อนุมัติซ่อม (คืนสภาพเดิม)')

// 7. Normalize Legacy LabelData into ReturnBoxLabelData
const legacyNorm = normalizeReturnLabelData({
  title: 'ใบปะหน้ากล่อง (ขาส่งคืน)',
  subtitle: 'จาก 610150 K.T.MAX CO.LTD.(BRANCH 1) (Auto Book 3PL #TPL-2610-000005)',
  jobNo: 'RS4-14102026-0001',
  rows: [
    ['สาขาปลายทาง', 'สาขารังสิต คลอง4'],
    ['ช่องทางส่งคืน', '3PL'],
  ],
})
assert.strictEqual(legacyNorm.headerBadge, 'ขาส่งคืน • 3PL')
assert.strictEqual(legacyNorm.destination?.code, 'RS4')
assert.strictEqual(legacyNorm.destination?.name, 'สาขารังสิต คลอง4')
assert.strictEqual(legacyNorm.trackingNo, 'TPL-2610-000005')

// 8. Logistics Box Label Building across all routes (100x150mm standardized box label)
const grToDcLabel = buildLogisticsBoxLabel(baseMockJob, 'GR_TO_DC', { now: dt })
assert.strictEqual(grToDcLabel.title, 'ใบปะหน้ากล่อง (ขารับเข้าคลัง DC)')
assert.strictEqual(grToDcLabel.headerBadge, 'ขารับเข้า • สาขา → คลัง DC')
assert.strictEqual(grToDcLabel.origin?.name, 'ไทวัสดุ สาขาบางนา')
assert.strictEqual(grToDcLabel.destination?.name, 'คลังสินค้า DC วังน้อย')
assert.strictEqual(grToDcLabel.destination?.code, 'DC')

const dcToVdLabel = buildLogisticsBoxLabel(baseMockJob, 'DC_TO_VD', { now: dt })
assert.strictEqual(dcToVdLabel.title, 'ใบปะหน้ากล่อง (ขาส่งซ่อม VD)')
assert.strictEqual(dcToVdLabel.headerBadge, 'ขาส่งซ่อม • คลัง DC → VD')
assert.strictEqual(dcToVdLabel.origin?.name, 'คลังสินค้า DC วังน้อย')
assert.strictEqual(dcToVdLabel.destination?.name, 'VD-0088 บ.ช่างเจริญ')
assert.strictEqual(dcToVdLabel.destination?.code, 'VD-0088')

const grToVdLabel = buildLogisticsBoxLabel(baseMockJob, 'GR_TO_VD', { now: dt })
assert.strictEqual(grToVdLabel.title, 'ใบปะหน้ากล่อง (ขาส่งซ่อม VD)')
assert.strictEqual(grToVdLabel.headerBadge, 'ขาส่งซ่อม • สาขา → VD')
assert.strictEqual(grToVdLabel.origin?.name, 'ไทวัสดุ สาขาบางนา')
assert.strictEqual(grToVdLabel.destination?.code, 'VD-0088')

const dcToBranchLabel = buildLogisticsBoxLabel(baseMockJob, 'DC_TO_BRANCH', { now: dt })
assert.strictEqual(dcToBranchLabel.title, 'ใบปะหน้ากล่อง (ขาคืน)')
assert.strictEqual(dcToBranchLabel.destination?.code, 'BNA')

console.log('✓ All Shipping Label Builder Tests Passed!')

