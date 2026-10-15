import assert from 'node:assert/strict'
import {
  generatePickupSlipNo,
  buildPickupSlipData,
  parsePickupItemsText,
  formatPickupItemsText,
  extractPickupSlipMeta,
} from '../src/lib/pickup-slip'
import { findJobTab, findJobsByScan } from '../src/lib/job-locator'
import type { JobView } from '../src/lib/job-view'

function mockJob(overrides: Partial<JobView> = {}): JobView {
  return {
    id: 'job-1',
    jobNo: 'BNA-15102026-0001',
    type: 'CUSTOMER',
    stage: 'GR_PACKED',
    stageLabel: 'แพ็คสินค้าแล้ว',
    stageBadge: 'b-blue',
    channel: 'DC',
    version: 1,
    openedAt: new Date('2026-10-15T02:00:00Z'),
    stageEnteredAt: new Date('2026-10-15T02:30:00Z'),
    closedAt: null,
    decision: 'PENDING',
    customerName: 'คุณสมชาย ใจดี',
    customerPhone: '081-234-5678',
    productName: 'เครื่องซักผ้า SAMSUNG WA13',
    brandName: 'SAMSUNG',
    sku: 'SKU-001',
    serialNo: 'SN1234567890',
    symptom: 'ซักแล้วน้ำไม่ระบาย',
    hasWarranty: true,
    shippingMethod: 'STANDARD',
    receiverName: 'พนักงาน GR บางนา',
    branch: {
      id: 'b-bna',
      name: 'สาขาบางนา',
      nickname: 'BNA',
      address: 'บางนา กรุงเทพฯ',
    },
    vendor: {
      centerId: 'vc-1',
      centerCode: 'SAM-BKK',
      code: 'SAMSUNG',
      name: 'ศูนย์บริการซัมซุง',
      deliveryMethod: 'DC',
      address: 'กรุงเทพฯ',
      phone: '02-689-3232',
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
    outboundShipment: {
      id: 'ship-1',
      legType: 'BRANCH_TO_DC',
      carrier: 'DC_FLEET',
      status: 'PENDING_DISPATCH',
      trackingNo: null,
      driverToken: null,
      dispatchedAt: null,
      pickedUpAt: null,
      deliveredAt: null,
      createdAt: new Date('2026-10-15T02:30:00Z'),
      pickupSlipNo: null,
      pickupSlip: null,
    },
    inboundShipment: null,
    location: 'A-03-02',
    quote: null,
    items: [],
    ...overrides,
  }
}

async function runTests() {
  console.log('Running pickup-slip tests...')

  // 1. Document number generation
  const docNo1 = generatePickupSlipNo('GR_TO_DC', 'BNA', '2026-10-15', 1)
  assert.equal(docNo1, 'PU-261015-BNA-DC01')

  const docNo2 = generatePickupSlipNo('GR_TO_VD', 'BNA', '2026-10-15', 2)
  assert.equal(docNo2, 'PU-261015-BNA-VD02')

  const docNo3 = generatePickupSlipNo('DC_TO_VD', 'DC', '2026-10-15', 1)
  assert.equal(docNo3, 'PU-261015-DC-VD01')

  const docNo4 = generatePickupSlipNo('DC_TO_GR', 'BNA', '2026-10-15', 1)
  assert.equal(docNo4, 'PU-261015-DC-BNA01')

  // 2. Build pickup slip from multiple jobs of the same branch
  const j1 = mockJob()
  const j2 = mockJob({
    id: 'job-2',
    jobNo: 'BNA-15102026-0002',
    customerName: 'คุณมานี มีสุข',
    productName: 'พัดลมตั้งพื้น HATARI HT-S18',
    serialNo: 'SN8800123',
    symptom: 'ใบพัดไม่หมุน',
    location: 'A-03-05',
  })

  const slip = buildPickupSlipData([j1, j2], 'GR_TO_DC', {
    scheduledDate: '2026-10-15',
    scheduledTime: '10:00',
  })

  assert.equal(slip.route, 'GR_TO_DC')
  assert.equal(slip.docNo, 'PU-261015-BNA-DC01')
  assert.equal(slip.items.length, 2)
  assert.equal(slip.totalJobs, 2)
  assert.equal(slip.totalBoxes, 2)
  assert.equal(slip.originName.includes('บางนา'), true)
  assert.equal(slip.destName.includes('DC'), true)

  // 3. Format and parse items text
  const text = formatPickupItemsText(slip.items)
  const parsed = parsePickupItemsText(text, slip.items)
  assert.equal(parsed.length, 2)
  assert.equal(parsed[0].jobNo, 'BNA-15102026-0001')
  assert.equal(parsed[1].jobNo, 'BNA-15102026-0002')

  // 4. Extract saved pickupSlip meta from job events
  const meta = extractPickupSlipMeta(
    [
      {
        type: 'SHIPMENT_DISPATCHED',
        payload: {
          legType: 'BRANCH_TO_DC',
          pickupSlip: {
            pickupSlipNo: 'PU-261015-BNA-DC05',
            driverName: 'นายสมศักดิ์ ขับดี',
            driverPhone: '089-111-2222',
            vehiclePlate: '1กข 1234',
            carrierLabel: 'รถ DC',
            scheduledDate: '2026-10-15',
            scheduledTime: '10:00',
            boxCount: 2,
          },
        },
        createdAt: new Date('2026-10-15T03:00:00Z'),
      },
    ],
    'BRANCH_TO_DC',
  )
  assert.ok(meta)
  assert.equal(meta.pickupSlipNo, 'PU-261015-BNA-DC05')
  assert.equal(meta.driverName, 'นายสมศักดิ์ ขับดี')
  assert.equal(meta.vehiclePlate, '1กข 1234')

  // 5. Barcode scan locator supports both jobNo and pickupSlipNo (PU-...)
  const tabs = {
    receive: [],
    pack: [],
    handoff: [
      { id: 'job-1', jobNo: 'BNA-15102026-0001', outboundShipment: { pickupSlipNo: 'PU-261015-BNA-DC05' } },
      { id: 'job-2', jobNo: 'BNA-15102026-0002', outboundShipment: { pickupSlipNo: 'PU-261015-BNA-DC05' } },
    ],
  }
  const byJob = findJobTab(tabs, ['receive', 'pack', 'handoff'], 'BNA-15102026-0002')
  assert.deepEqual(byJob, { tab: 'handoff', jobId: 'job-2' })

  const bySlip = findJobTab(tabs, ['receive', 'pack', 'handoff'], 'PU-261015-BNA-DC05')
  assert.deepEqual(bySlip, { tab: 'handoff', jobId: 'job-1' })

  const multiScan = findJobsByScan(tabs, ['receive', 'pack', 'handoff'], 'pu-261015-bna-dc05')
  assert.deepEqual(multiScan, { tab: 'handoff', jobIds: ['job-1', 'job-2'] })

  console.log('✓ All pickup-slip tests passed!')
}

runTests().catch(err => {
  console.error(err)
  process.exit(1)
})
