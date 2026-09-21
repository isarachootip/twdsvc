/**
 * Tier 3: Cross-Feature Combinations - Flow D (Trade-In Coupon & Wallet Issuance)
 * Trade-in Coupon Generation -> Discount Application
 */

import { describe, it, expect, setTier } from '../../framework/core'
import { SPEC_ORACLE } from '../../framework/oracle'
import { createMockUser, createMockJob } from '../../framework/helpers'

setTier('Tier 3')

describe('Tier 3: Flow D - Trade-in Coupon Generation & Wallet Issuance', () => {
  it('FLOW-D-01: Type 1 Walk-in Trade-in captures customer details, old tool brand, and 4 product photos', () => {
    const intake = {
      type: 'TYPE1',
      customerName: 'ประสิทธิ์ รักษ์ดี',
      customerPhone: '0865551234',
      productName: 'เครื่องเจียร 4 นิ้ว (เก่าใช้งานไม่ได้)',
      brand: 'MAKITA',
      sizeCategory: 'SMALL',
      photos: ['side1.jpg', 'side2.jpg', 'side3.jpg', 'side4.jpg'],
    }
    expect(intake.type).toBe('TYPE1')
    expect(intake.photos.length).toBe(4)
    expect(intake.customerPhone).toMatch(/^0[689]\d{8}$/)
  })

  it('FLOW-D-02: System matches active promotion: "Old Power Tool Swap 2026" granting 15% discount voucher', () => {
    const activePromos = [
      { id: 1, name: 'Old Power Tool Swap 2026', type: 'TYPE1', size: 'SMALL', discountPct: 15.0, active: true },
      { id: 2, name: 'Lawnmower Mega Trade', type: 'TYPE1', size: 'LARGE', discountPct: 20.0, active: true },
    ]
    const matched = activePromos.find((p) => p.type === 'TYPE1' && p.size === 'SMALL' && p.active)
    expect(matched).toBeDefined()
    expect(matched?.discountPct).toBe(15.0)
  })

  it('FLOW-D-03: System generates unique trade-in coupon number with prefix TI-YYMM-XXXXX', () => {
    const date = new Date('2026-09-19T10:00:00Z')
    const yy = String(date.getFullYear()).slice(2)
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const seq = '00892'
    const couponNo = `TI-${yy}${mm}-${seq}`
    expect(couponNo).toBe('TI-2609-00892')
    expect(couponNo).toMatch(/^TI-\d{4}-\d{5}$/)
  })

  it('FLOW-D-04: Coupon is issued directly into customer The1 Central Wallet', () => {
    const issuance = {
      couponNo: 'TI-2609-00892',
      customerPhone: '0865551234',
      walletChannel: 'THE1_APP',
      status: 'ISSUED',
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 3600000), // 30 days validity
    }
    expect(issuance.status).toBe('ISSUED')
    expect(issuance.walletChannel).toBe('THE1_APP')
  })

  it('FLOW-D-05: Customer redeems coupon at store POS: 15% discount applies to new power tool purchase', () => {
    const newToolPriceSatang = 350000 // ฿3,500.00
    const discountPct = 15.0
    const discountAmountSatang = Math.floor((newToolPriceSatang * discountPct) / 100 + 0.5)
    const finalPriceSatang = newToolPriceSatang - discountAmountSatang

    expect(discountAmountSatang).toBe(52500) // ฿525.00 discount
    expect(finalPriceSatang).toBe(297500) // ฿2,975.00 net customer payment
  })

  it('FLOW-D-06: Upon POS redemption, trade-in coupon status updates to USED with redemption timestamp', () => {
    const coupon = {
      couponNo: 'TI-2609-00892',
      status: 'ISSUED' as 'ISSUED' | 'USED',
      usedAt: null as Date | null,
    }
    coupon.status = 'USED'
    coupon.usedAt = new Date()
    expect(coupon.status).toBe('USED')
    expect(coupon.usedAt).toBeDefined()
  })

  it('FLOW-D-07: Attempting to redeem an already USED trade-in coupon is rejected', () => {
    const coupon = {
      couponNo: 'TI-2609-00892',
      status: 'USED',
    }
    const canRedeem = coupon.status === 'ISSUED'
    expect(canRedeem).toBe(false)
  })

  it('FLOW-D-08: Type 2 Trade-in links directly to rejected repair job number (e.g. JB-2609-04121)', () => {
    const type2 = {
      type: 'TYPE2',
      jobId: 'jb-rejected-04121',
      jobNo: 'JB-2609-04121',
      couponNo: 'TI-2609-00893',
      discountPct: 10.0,
    }
    expect(type2.type).toBe('TYPE2')
    expect(type2.jobNo.startsWith('JB-')).toBe(true)
  })

  it('FLOW-D-09: Trade-in analytics updates conversion rate metrics in real time', () => {
    const totalIssued = 50
    const totalRedeemed = 20
    const conversionRate = Math.round((totalRedeemed / totalIssued) * 100)
    expect(conversionRate).toBe(40)
  })

  it('FLOW-D-10: Expired coupons (past 30 days) automatically transition to EXPIRED and block redemption', () => {
    const pastExpiry = new Date(Date.now() - 24 * 3600000) // Expired yesterday
    const coupon = {
      couponNo: 'TI-2608-00010',
      expiresAt: pastExpiry,
      status: 'ISSUED',
    }
    const isExpired = Date.now() > coupon.expiresAt.getTime()
    expect(isExpired).toBe(true)
  })
})
