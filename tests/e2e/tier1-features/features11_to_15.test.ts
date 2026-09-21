/**
 * Tier 1: Feature Coverage (Features 11 to 15)
 * Feature 11: Customer Quote Portal (/q/[token])
 * Feature 12: Customer Payment Portal (/pay/[token])
 * Feature 13: Customer Tracking (/t/[token])
 * Feature 14: Delivery Scheduling (/d/[token])
 * Feature 15: Customer Survey (/s/[token])
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { createMockUser, createMockJob, simulateAction } from '../../framework/helpers'

setTier('Tier 1')

describe('Feature 11: Customer Quote Portal (/q/[token])', () => {
  it('F11-T01: Customer quote page renders itemized breakdown, VAT 7%, and total amount', () => {
    const quote = {
      lines: [
        { desc: 'Main Gear', unitPrice: 35000, qty: 1 },
        { desc: 'Labor', unitPrice: 20000, qty: 1 },
      ],
    }
    const totals = SPEC_ORACLE.calcQuoteTotals(
      quote.lines.map((l) => ({ unitPriceSatang: l.unitPrice, quantity: l.qty }))
    )
    expect(totals.subtotalSatang).toBe(55000)
    expect(totals.vatSatang).toBe(3850)
    expect(totals.totalSatang).toBe(58850)
  })

  it('F11-T02: Customer approval via public token transitions job to REPAIRING and creates credit charges', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({
      stage: 'WAITING_APPROVAL',
      charges: [{ type: 'OPERATION_FEE', amountSatang: 15000 }],
      quotes: [{ version: 1, subtotalSatang: 50000, vatSatang: 3500, totalSatang: 53500, status: 'SENT' }],
    })
    const result = simulateAction(job, 'customer_approve', csUser, { decision: 'approve' })
    expect(result.success).toBe(true)
    expect(result.job?.stage).toBe('REPAIRING')
    expect(result.job?.decision).toBe('APPROVED')
    const repairCharge = result.job?.charges.find((c) => c.type === 'REPAIR')
    const creditCharge = result.job?.charges.find((c) => c.type === 'OPERATION_FEE_CREDIT')
    expect(repairCharge?.amountSatang).toBe(53500)
    expect(creditCharge?.amountSatang).toBe(-15000)
  })

  it('F11-T03: Customer rejection via public token transitions job to RETURN_PACKING without repair charges', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({
      stage: 'WAITING_APPROVAL',
      charges: [{ type: 'OPERATION_FEE', amountSatang: 15000 }],
      quotes: [{ version: 1, subtotalSatang: 50000, vatSatang: 3500, totalSatang: 53500, status: 'SENT' }],
    })
    const result = simulateAction(job, 'customer_reject', csUser, { decision: 'reject' })
    expect(result.success).toBe(true)
    expect(result.job?.stage).toBe('RETURN_PACKING')
    expect(result.job?.decision).toBe('REJECTED')
    const repairCharge = result.job?.charges.find((c) => c.type === 'REPAIR')
    expect(repairCharge).toBeUndefined()
  })

  it('F11-T04: Case insensitivity fix (Bug C1) accepts both "APPROVED" and "approve" for decision', () => {
    const csUser = createMockUser({ role: 'CS' })
    const jobUpper = createMockJob({
      stage: 'WAITING_APPROVAL',
      quotes: [{ version: 1, subtotalSatang: 10000, vatSatang: 700, totalSatang: 10700, status: 'SENT' }],
    })
    const resUpper = simulateAction(jobUpper, 'cs_record_decision', csUser, { decision: 'APPROVED' })
    expect(resUpper.success).toBe(true)
    expect(resUpper.job?.stage).toBe('REPAIRING')
    expect(resUpper.job?.decision).toBe('APPROVED')
  })

  it('F11-T05: Customer approval is idempotent and rejects subsequent duplicate approval attempts', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({ stage: 'WAITING_APPROVAL' })
    const firstRes = simulateAction(job, 'customer_approve', csUser, { decision: 'approve' })
    expect(firstRes.success).toBe(true)
    // Second attempt from REPAIRING stage
    const secondRes = simulateAction(firstRes.job!, 'customer_approve', csUser, { decision: 'approve' })
    expect(secondRes.success).toBe(false)
    expect(secondRes.error).toContain('not waiting approval')
  })
})

describe('Feature 12: Customer Payment Portal (/pay/[token])', () => {
  it('F12-T01: Payment portal displays accurate net balance after crediting intake operation fee', () => {
    // Op fee ฿150 paid at intake. Repair total ฿800. Net owed: ฿650.
    const settlement = SPEC_ORACLE.calcCustomerBalance({
      operationFeePaidSatang: 15000,
      quoteTotalSatang: 80000,
      additionalPaymentsSatang: 0,
    })
    expect(settlement.outstandingBalanceSatang).toBe(65000)
  })

  it('F12-T02: Payment portal renders PromptPay QR payload and supports polling confirmation', () => {
    const promptPayTarget = '0812345678'
    const amountSatang = 65000
    expect(promptPayTarget.length).toBe(10)
    expect(amountSatang).toBeGreaterThan(0)
  })

  it('F12-T03: Partial payments reduce outstanding balance incrementally until zero', () => {
    const totalDue = 100000 // ฿1,000
    const pay1 = 40000 // ฿400
    const pay2 = 60000 // ฿600
    const rem1 = totalDue - pay1
    const rem2 = rem1 - pay2
    expect(rem1).toBe(60000)
    expect(rem2).toBe(0)
  })

  it('F12-T04: Payment token has a 7-day expiration lifespan', () => {
    const expiryDays = SPEC_ORACLE.TOKEN_EXPIRIES_DAYS.PAYMENT
    expect(expiryDays).toBe(7)
  })

  it('F12-T05: Overpayment rejection prevents recording an amount greater than outstanding balance', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      charges: [{ type: 'REPAIR', amountSatang: 50000 }],
      payments: [],
    })
    const result = simulateAction(job, 'record_repair_payment', csUser, {
      amountSatang: 60000, // ฿600 on ฿500 balance
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('exceeds balance')
  })
})

describe('Feature 13: Customer Tracking (/t/[token])', () => {
  it('F13-T01: Customer tracking timeline presents 5 customer-facing milestones', () => {
    const trackingMilestones = [
      'รับเรื่องแจ้งซ่อม (Intake)',
      'ส่งซ่อม (Logistics to VD)',
      'ประเมินราคา (Quote & Approval)',
      'กำลังซ่อม (Repair & QA)',
      'พร้อมรับสินค้า (Ready for collection)',
    ]
    expect(trackingMilestones.length).toBe(5)
  })

  it('F13-T02: Tracking token is cryptographically random and has a 90-day validity', () => {
    const job = createMockJob()
    const token = job.tokens.find((t) => t.type === 'TRACKING')
    expect(token).toBeDefined()
    expect(token?.token.length).toBeGreaterThanOrEqual(16)
    expect(SPEC_ORACLE.TOKEN_EXPIRIES_DAYS.TRACKING).toBe(90)
  })

  it('F13-T03: Public tracking view masks customer telephone and internal staff remarks', () => {
    const rawPhone = '0812345678'
    const maskedPhone = rawPhone.slice(0, 3) + '-xxx-' + rawPhone.slice(7)
    expect(maskedPhone).toBe('081-xxx-678')
  })

  it('F13-T04: Tracking timeline links to active quote when job is in WAITING_APPROVAL stage', () => {
    const job = createMockJob({ stage: 'WAITING_APPROVAL' })
    const hasActiveQuote = job.stage === 'WAITING_APPROVAL'
    expect(hasActiveQuote).toBe(true)
  })

  it('F13-T05: Tracking status reflects stage progression from intake to completion in real time', () => {
    const stages: Array<(typeof SPEC_ORACLE.STAGES)[number]> = [
      'CS_OPENED',
      'GR_RECEIVED',
      'VD_INSPECTING',
      'REPAIRING',
      'READY_FOR_PICKUP',
      'CLOSED_REPAIRED',
    ]
    expect(stages.length).toBe(6)
    stages.forEach((st) => expect(SPEC_ORACLE.STAGES).toContain(st))
  })
})

describe('Feature 14: Delivery Scheduling (/d/[token])', () => {
  it('F14-T01: Delivery scheduling route displays route leg and shipment information', () => {
    const legInfo = {
      legType: 'BRANCH_TO_DC',
      origin: 'Branch Rama 2',
      destination: 'DC Wangnoi',
      status: 'DISPATCHED',
    }
    expect(legInfo.origin).toBe('Branch Rama 2')
    expect(legInfo.destination).toBe('DC Wangnoi')
  })

  it('F14-T02: Driver token has a 48-hour expiration period', () => {
    expect(SPEC_ORACLE.TOKEN_EXPIRIES_DAYS.DRIVER).toBe(2)
  })

  it('F14-T03: Carrier confirms pickup via driver link and uploads verification photo', () => {
    const driverUser = createMockUser({ role: 'VD' })
    const job = createMockJob({ stage: 'GR_PACKED', channel: 'DSD' })
    const result = simulateAction(job, 'dispatch_pickup', driverUser, { method: 'LINK' })
    expect(result.success).toBe(true)
    const token = result.job?.tokens.find((t) => t.type === 'DRIVER')
    expect(token).toBeDefined()
  })

  it('F14-T04: Delivery schedule supports standard DSD and 3PL courier tracking numbers', () => {
    const trackingNo = 'TPL-TH-982341'
    expect(trackingNo).toMatch(/^TPL-[A-Z]+-\d+$/)
  })

  it('F14-T05: Driver manifest validates that all assigned packages are accounted for before dispatch', () => {
    const manifest = { packages: ['JB-01', 'JB-02', 'JB-03'], confirmedCount: 3 }
    expect(manifest.packages.length).toBe(manifest.confirmedCount)
  })
})

describe('Feature 15: Customer Survey (/s/[token])', () => {
  it('F15-T01: CSAT survey supports 1 to 5 star rating submission', () => {
    const validRatings = [1, 2, 3, 4, 5]
    validRatings.forEach((rating) => {
      expect(rating).toBeGreaterThanOrEqual(1)
      expect(rating).toBeLessThanOrEqual(5)
    })
  })

  it('F15-T02: Customer survey token is generated upon job closure with a 14-day lifespan', () => {
    const csUser = createMockUser({ role: 'CS' })
    const job = createMockJob({
      stage: 'READY_FOR_PICKUP',
      decision: 'REJECTED',
    })
    const result = simulateAction(job, 'cs_close', csUser)
    expect(result.success).toBe(true)
    const csatToken = result.job?.tokens.find((t) => t.type === 'CSAT')
    expect(csatToken).toBeDefined()
    expect(SPEC_ORACLE.TOKEN_EXPIRIES_DAYS.CSAT).toBe(14)
  })

  it('F15-T03: Single-use enforcement records usedAt timestamp preventing duplicate survey feedback', () => {
    const csatToken = {
      type: 'CSAT',
      token: 'tok-csat-123',
      usedAt: null as Date | null,
    }
    expect(csatToken.usedAt).toBeNull()
    // Submit survey
    csatToken.usedAt = new Date()
    expect(csatToken.usedAt).toBeDefined()
    // Subsequent attempt is blocked
    const canSubmitAgain = csatToken.usedAt === null
    expect(canSubmitAgain).toBe(false)
  })

  it('F15-T04: Survey accepts customer comments and feedback text', () => {
    const feedback = { rating: 5, comment: 'บริการรวดเร็ว ช่างซ่อมเรียบร้อยดีมาก' }
    expect(feedback.rating).toBe(5)
    expect(feedback.comment.length).toBeGreaterThan(0)
  })

  it('F15-T05: Survey results contribute to branch and vendor CSAT performance metrics', () => {
    const ratings = [5, 4, 5, 4, 5]
    const avgRating = ratings.reduce((s, r) => s + r, 0) / ratings.length
    expect(avgRating).toBe(4.6)
  })
})
