import { describe, it, expect, setTier } from '../framework/core'
import { normalizeThaiMobilePhone, orderLonPayloadBySwagger } from '../../src/lib/validations/lon.schema'
import { buildLonNotificationRequest, type LonJobSource } from '../../src/lib/services/lon-mapper'

setTier('Tier 1')

const SAMPLE_JOB: LonJobSource = {
  jobNo: 'TWBN2601070001',
  stage: 'REPAIRING',
  customerName: 'คุณพฤหัส ศุกร์',
  customerPhone: '081-234-5678',
  sku: '60000205',
  productName: 'สว่านกระแทกไร้สาย 18V',
  brandName: 'BOSCH',
  serialNo: 'SR440',
  symptom: 'เครื่องไม่เปิดติด',
  openedAt: new Date('2026-01-07T03:30:00.000Z'),
  closedAt: new Date('2026-01-12T08:00:00.000Z'),
  branch: {
    name: 'ไทวัสดุ สาขาบางนา',
    phone: '02-101-9999',
  },
  items: [
    {
      sku: '60000205',
      productName: 'สว่านกระแทกไร้สาย 18V',
      quantity: 1,
      symptom: 'เครื่องไม่เปิดติด',
    },
  ],
  operationFeeAmount: 300,
  activeQuote: {
    total: 1650,
    repairDays: 5,
    repairWarrantyDays: 30,
    vendorNote: 'เปลี่ยนชุดสวิตช์และแปรงถ่าน',
    lines: [
      { description: 'ชุดสวิตช์ควบคุม', quantity: 1, unitPrice: 1200 },
      { description: 'ค่าแรงช่าง', quantity: 1, unitPrice: 450 },
    ],
  },
  tokens: {
    tracking: 'trk_123',
    quote: 'qt_456',
    payment: 'pay_789',
    csat: 'csat_999',
  },
}

describe('Unit: LON Payload Mapper & Phone Normalizer', () => {
  it('LMP-01: normalizeThaiMobilePhone validates and normalizes Thai mobile formats', () => {
    expect(normalizeThaiMobilePhone('081-234-5678')).toBe('0812345678')
    expect(normalizeThaiMobilePhone('+66 89 111 2222')).toBe('0891112222')
    expect(normalizeThaiMobilePhone('0651234567')).toBe('0651234567')
    expect(normalizeThaiMobilePhone('02-123-4567')).toBeNull()
    expect(normalizeThaiMobilePhone('12345')).toBeNull()
    expect(normalizeThaiMobilePhone(null)).toBeNull()
  })

  it('LMP-02: buildLonNotificationRequest maps SEND_TO_REPAIR to exact 9 Swagger fields and order', () => {
    const req = buildLonNotificationRequest(SAMPLE_JOB, 'SEND_TO_REPAIR', {
      baseUrl: 'https://svc.thaiwatsadu.com/',
      now: new Date('2026-01-07T04:00:00.000Z'),
    })
    expect(req.endpoint).toBe('/repair/send_to_repair_jobs')
    expect(req.recipientPhone).toBe('0812345678')
    expect(Object.keys(req.payload)).toEqual([
      'customer_name',
      'repair_no',
      'repair_date',
      'button',
      'store_name',
      'customer_phone',
      'product_name',
      'repair_reason',
      'status',
    ])
    expect(req.payload).toEqual({
      customer_name: 'คุณพฤหัส ศุกร์',
      repair_no: 'TWBN2601070001',
      repair_date: '2026-01-07',
      button: 'https://svc.thaiwatsadu.com/t/trk_123',
      store_name: 'ไทวัสดุ สาขาบางนา',
      customer_phone: '0812345678',
      product_name: 'สว่านกระแทกไร้สาย 18V',
      repair_reason: 'เครื่องไม่เปิดติด',
      status: 'การส่งซ่อมสินค้า',
    })
  })

  it('LMP-03: buildLonNotificationRequest maps SEND_PRICE to exact 10 Swagger fields and order', () => {
    const req = buildLonNotificationRequest(SAMPLE_JOB, 'SEND_PRICE', {
      baseUrl: 'https://svc.thaiwatsadu.com',
    })
    expect(req.endpoint).toBe('/repair/send_price_repair_jobs')
    expect(Object.keys(req.payload)).toEqual([
      'customer_name',
      'repair_no',
      'repair_date',
      'button',
      'store_name',
      'customer_phone',
      'product_name',
      'repair_reason',
      'repair_price',
      'status',
    ])
    expect(req.payload).toEqual({
      customer_name: 'คุณพฤหัส ศุกร์',
      repair_no: 'TWBN2601070001',
      repair_date: '2026-01-07',
      button: 'https://svc.thaiwatsadu.com/q/qt_456',
      store_name: 'ไทวัสดุ สาขาบางนา',
      customer_phone: '0812345678',
      product_name: 'สว่านกระแทกไร้สาย 18V',
      repair_reason: 'เครื่องไม่เปิดติด',
      repair_price: 1650,
      status: 'แจ้งค่าบริการซ่อมสินค้า',
    })
  })

  it('LMP-04: buildLonNotificationRequest maps REJECT_REPAIR and RECEIVE_JOB to exact Swagger fields and order', () => {
    const rejectReq = buildLonNotificationRequest(SAMPLE_JOB, 'REJECT_REPAIR', {
      baseUrl: 'https://svc.thaiwatsadu.com',
      now: new Date('2026-01-09T04:00:00.000Z'),
    })
    expect(rejectReq.endpoint).toBe('/repair/reject_repair_jobs')
    expect(Object.keys(rejectReq.payload)).toEqual([
      'customer_name',
      'repair_no',
      'status',
      'product_name',
      'repair_reason',
      'repair_date',
      'return_date',
      'button',
      'store_name',
      'recived_store_name',
      'customer_phone',
    ])
    expect(rejectReq.payload).toEqual({
      customer_name: 'คุณพฤหัส ศุกร์',
      repair_no: 'TWBN2601070001',
      status: 'ปฎิเสธงานซ่อม',
      product_name: 'สว่านกระแทกไร้สาย 18V',
      repair_reason: 'เครื่องไม่เปิดติด',
      repair_date: '2026-01-07',
      return_date: '2026-01-09',
      button: 'https://svc.thaiwatsadu.com/t/trk_123',
      store_name: 'ไทวัสดุ สาขาบางนา',
      recived_store_name: 'ไทวัสดุ สาขาบางนา',
      customer_phone: '0812345678',
    })

    const receiveReq = buildLonNotificationRequest(SAMPLE_JOB, 'RECEIVE_JOB', {
      baseUrl: 'https://svc.thaiwatsadu.com',
      now: new Date('2026-01-09T04:00:00.000Z'),
    })
    expect(receiveReq.endpoint).toBe('/repair/recive_jobs')
    expect(Object.keys(receiveReq.payload)).toEqual([
      'customer_name',
      'repair_no',
      'repair_date',
      'product_name',
      'repair_reason',
      'received_date',
      'status',
      'button',
      'recived_store_name',
      'customer_phone',
    ])
    expect(receiveReq.payload).toEqual({
      customer_name: 'คุณพฤหัส ศุกร์',
      repair_no: 'TWBN2601070001',
      repair_date: '2026-01-07',
      product_name: 'สว่านกระแทกไร้สาย 18V',
      repair_reason: 'เครื่องไม่เปิดติด',
      received_date: '2026-01-09',
      status: 'แจ้งสถานะการรับสินค้า',
      button: 'https://svc.thaiwatsadu.com/t/trk_123',
      recived_store_name: 'ไทวัสดุ สาขาบางนา',
      customer_phone: '0812345678',
    })
  })

  it('LMP-05: buildLonNotificationRequest maps SATISFACTION to exact 4 Swagger fields and orderLonPayloadBySwagger reorders DB jsonb', () => {
    const req = buildLonNotificationRequest(SAMPLE_JOB, 'SATISFACTION', {
      baseUrl: 'https://svc.thaiwatsadu.com',
    })
    expect(req.endpoint).toBe('/repair/satisfaction_jobs')
    expect(Object.keys(req.payload)).toEqual([
      'customer_name',
      'repair_no',
      'status',
      'customer_phone',
    ])
    expect(req.payload).toEqual({
      customer_name: 'คุณพฤหัส ศุกร์',
      repair_no: 'TWBN2601070001',
      status: 'ประเมินความพึงพอใจซ่อมสินค้า',
      customer_phone: '0812345678',
    })

    // Simulate PostgreSQL jsonb scrambled key order + legacy extra keys
    const scrambledFromDb = {
      sku: '60395492',
      items: [{ sku: '60395492' }],
      button: 'https://vhomesvc.online/t/abc',
      status: 'การส่งซ่อมสินค้า',
      repair_no: 'BNA-02112026-0001',
      store_name: 'สาขาบางนา',
      repair_date: '2026-11-02',
      product_name: 'ตู้เย็น SBS',
      customer_name: 'อิศระ ชูทิพย์',
      repair_reason: 'ไฟไม่เข้า',
      customer_phone: '0636395619',
    }
    const ordered = orderLonPayloadBySwagger(scrambledFromDb, 'SEND_TO_REPAIR')
    expect(Object.keys(ordered)).toEqual([
      'customer_name',
      'repair_no',
      'repair_date',
      'button',
      'store_name',
      'customer_phone',
      'product_name',
      'repair_reason',
      'status',
    ])
  })
})
