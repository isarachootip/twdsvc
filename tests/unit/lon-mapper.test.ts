import { describe, it, expect, setTier } from '../framework/core'
import { normalizeThaiMobilePhone } from '../../src/lib/validations/lon.schema'
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

  it('LMP-02: buildLonNotificationRequest maps SEND_TO_REPAIR to /repair/send_to_repair_jobs', () => {
    const req = buildLonNotificationRequest(SAMPLE_JOB, 'SEND_TO_REPAIR', {
      baseUrl: 'https://svc.thaiwatsadu.com/',
      now: new Date('2026-01-07T04:00:00.000Z'),
    })
    expect(req.endpoint).toBe('/repair/send_to_repair_jobs')
    expect(req.recipientPhone).toBe('0812345678')
    expect(req.payload.repair_no).toBe('TWBN2601070001')
    expect(req.payload.repair_date).toBe('07/01/2026')
    if ('tracking_url' in req.payload) {
      expect(req.payload.tracking_url).toBe('https://svc.thaiwatsadu.com/t/trk_123')
      expect(req.payload.sku).toBe('60000205')
      expect(req.payload.serial_no).toBe('SR440')
      expect(req.payload.quantity).toBe(1)
    } else {
      throw new Error('Expected tracking_url in SEND_TO_REPAIR payload')
    }
  })

  it('LMP-03: buildLonNotificationRequest maps SEND_PRICE with quote & payment links', () => {
    const req = buildLonNotificationRequest(SAMPLE_JOB, 'SEND_PRICE', {
      baseUrl: 'https://svc.thaiwatsadu.com',
    })
    expect(req.endpoint).toBe('/repair/send_price_jobs')
    if ('quote_url' in req.payload) {
      expect(req.payload.total_price).toBe(1650)
      expect(req.payload.total_price_formatted).toBe('1,650.00')
      expect(req.payload.repair_days).toBe(5)
      expect(req.payload.warranty_days).toBe(30)
      expect(req.payload.findings.length).toBe(2)
      expect(req.payload.quote_url).toBe('https://svc.thaiwatsadu.com/q/qt_456')
      expect(req.payload.payment_url).toBe('https://svc.thaiwatsadu.com/pay/pay_789')
    } else {
      throw new Error('Expected quote_url in SEND_PRICE payload')
    }
  })

  it('LMP-04: buildLonNotificationRequest maps REJECT_REPAIR and RECEIVE_JOB with 7-day condition & operation fee', () => {
    const rejectReq = buildLonNotificationRequest(SAMPLE_JOB, 'REJECT_REPAIR', {
      baseUrl: 'https://svc.thaiwatsadu.com',
      now: new Date('2026-01-09T04:00:00.000Z'),
    })
    expect(rejectReq.endpoint).toBe('/repair/reject_repair_jobs')
    if ('return_date' in rejectReq.payload) {
      expect(rejectReq.payload.return_date).toBe('09/01/2026')
      expect(rejectReq.payload.pickup_within_days).toBe(7)
      expect(rejectReq.payload.pickup_branch_name).toBe('ไทวัสดุ สาขาบางนา')
    } else {
      throw new Error('Expected return_date in REJECT_REPAIR payload')
    }

    const receiveReq = buildLonNotificationRequest(SAMPLE_JOB, 'RECEIVE_JOB', {
      baseUrl: 'https://svc.thaiwatsadu.com',
      now: new Date('2026-01-09T04:00:00.000Z'),
    })
    expect(receiveReq.endpoint).toBe('/repair/recive_jobs')
    if ('operation_fee' in receiveReq.payload) {
      expect(receiveReq.payload.receive_date).toBe('09/01/2026')
      expect(receiveReq.payload.operation_fee).toBe(300)
      expect(receiveReq.payload.pickup_within_days).toBe(7)
    } else {
      throw new Error('Expected operation_fee in RECEIVE_JOB payload')
    }
  })

  it('LMP-05: buildLonNotificationRequest maps SATISFACTION with 3 quick-rate URLs', () => {
    const req = buildLonNotificationRequest(SAMPLE_JOB, 'SATISFACTION', {
      baseUrl: 'https://svc.thaiwatsadu.com',
    })
    expect(req.endpoint).toBe('/repair/satisfaction_jobs')
    if ('satisfaction_url' in req.payload) {
      expect(req.payload.satisfaction_url).toBe('https://svc.thaiwatsadu.com/s/csat_999')
      expect(req.payload.rate_satisfied_url).toBe('https://svc.thaiwatsadu.com/s/csat_999?rate=satisfied')
      expect(req.payload.rate_neutral_url).toBe('https://svc.thaiwatsadu.com/s/csat_999?rate=neutral')
      expect(req.payload.rate_unsatisfied_url).toBe('https://svc.thaiwatsadu.com/s/csat_999?rate=unsatisfied')
    } else {
      throw new Error('Expected satisfaction_url in SATISFACTION payload')
    }
  })
})
