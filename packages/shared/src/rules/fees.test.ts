import { describe, it, expect } from 'vitest';
import { calcIntakeFees, calcBalance, FeeRateInput } from './fees';

describe('Fees Rules (docs/05_business_rules.md §1)', () => {
  const feeRateSmall: FeeRateInput = {
    operationFeeSatang: 15000, // 150 บาท
    shippingFee3plSatang: 8000, // 80 บาท
  };

  const feeRateLarge: FeeRateInput = {
    operationFeeSatang: 30000, // 300 บาท
    shippingFee3plSatang: 25000, // 250 บาท
  };

  describe('calcIntakeFees - 4 Cases x 2 Sizes (§1.1)', () => {
    // Case 1: มีประกัน + มาตรฐาน (With Warranty + STANDARD)
    it('Case 1: With Warranty + STANDARD -> 0 Baht for both sizes', () => {
      const small = calcIntakeFees({
        jobType: 'CUSTOMER',
        hasWarranty: true,
        shippingMethod: 'STANDARD',
        feeRate: feeRateSmall,
      });
      expect(small.operationFeeSatang).toBe(0);
      expect(small.shippingFeeSatang).toBe(0);
      expect(small.totalSatang).toBe(0);

      const large = calcIntakeFees({
        jobType: 'CUSTOMER',
        hasWarranty: true,
        shippingMethod: 'STANDARD',
        feeRate: feeRateLarge,
      });
      expect(large.operationFeeSatang).toBe(0);
      expect(large.shippingFeeSatang).toBe(0);
      expect(large.totalSatang).toBe(0);
    });

    // Case 2: ไม่มีประกัน + มาตรฐาน (No Warranty + STANDARD)
    it('Case 2: No Warranty + STANDARD -> Operation Fee Only (Small: 150, Large: 300)', () => {
      const small = calcIntakeFees({
        jobType: 'CUSTOMER',
        hasWarranty: false,
        shippingMethod: 'STANDARD',
        feeRate: feeRateSmall,
      });
      expect(small.operationFeeSatang).toBe(15000);
      expect(small.shippingFeeSatang).toBe(0);
      expect(small.totalSatang).toBe(15000);

      const large = calcIntakeFees({
        jobType: 'CUSTOMER',
        hasWarranty: false,
        shippingMethod: 'STANDARD',
        feeRate: feeRateLarge,
      });
      expect(large.operationFeeSatang).toBe(30000);
      expect(large.shippingFeeSatang).toBe(0);
      expect(large.totalSatang).toBe(30000);
    });

    // Case 3: มีประกัน + ส่งด่วน (With Warranty + EXPRESS)
    it('Case 3: With Warranty + EXPRESS -> Operation + 3PL (Small: 230, Large: 550)', () => {
      const small = calcIntakeFees({
        jobType: 'CUSTOMER',
        hasWarranty: true,
        shippingMethod: 'EXPRESS',
        feeRate: feeRateSmall,
      });
      expect(small.operationFeeSatang).toBe(15000);
      expect(small.shippingFeeSatang).toBe(8000);
      expect(small.totalSatang).toBe(23000);

      const large = calcIntakeFees({
        jobType: 'CUSTOMER',
        hasWarranty: true,
        shippingMethod: 'EXPRESS',
        feeRate: feeRateLarge,
      });
      expect(large.operationFeeSatang).toBe(30000);
      expect(large.shippingFeeSatang).toBe(25000);
      expect(large.totalSatang).toBe(55000);
    });

    // Case 4: ไม่มีประกัน + ส่งด่วน (No Warranty + EXPRESS)
    it('Case 4: No Warranty + EXPRESS -> Operation + 3PL (Small: 230, Large: 550)', () => {
      const small = calcIntakeFees({
        jobType: 'CUSTOMER',
        hasWarranty: false,
        shippingMethod: 'EXPRESS',
        feeRate: feeRateSmall,
      });
      expect(small.operationFeeSatang).toBe(15000);
      expect(small.shippingFeeSatang).toBe(8000);
      expect(small.totalSatang).toBe(23000);

      const large = calcIntakeFees({
        jobType: 'CUSTOMER',
        hasWarranty: false,
        shippingMethod: 'EXPRESS',
        feeRate: feeRateLarge,
      });
      expect(large.operationFeeSatang).toBe(30000);
      expect(large.shippingFeeSatang).toBe(25000);
      expect(large.totalSatang).toBe(55000);
    });

    it('STOCK jobs always have 0 intake fees', () => {
      const stock = calcIntakeFees({
        jobType: 'STOCK',
        hasWarranty: false,
        shippingMethod: 'EXPRESS',
        feeRate: feeRateLarge,
      });
      expect(stock.operationFeeSatang).toBe(0);
      expect(stock.shippingFeeSatang).toBe(0);
      expect(stock.totalSatang).toBe(0);
    });
  });

  describe('calcBalance - Net Balance on Repair (§1.3)', () => {
    it('should match the documented ฿900 balance example (Large, No Warranty, Express, Quote 1,200)', () => {
      // Charges: operation=300 (30000), shipping=250 (25000), quote=1200 (120000) -> total charges 1750 (175000)
      // Credit: -min(300, 1200) = -300 (-30000)
      // Paid (at intake): 550 (55000)
      // Balance: 1750 - 300 - 550 = 900 (90000)
      const res = calcBalance({
        operationFeeSatang: 30000,
        shippingFeeSatang: 25000,
        quoteTotalSatang: 120000,
        paidSatang: 55000,
      });

      expect(res.chargesSatang).toBe(175000);
      expect(res.creditSatang).toBe(-30000);
      expect(res.paidSatang).toBe(55000);
      expect(res.balanceSatang).toBe(90000); // ฿900
    });

    it('should support charge3plReturnFee adding return 3PL shipment fee (1,150 balance)', () => {
      const res = calcBalance({
        operationFeeSatang: 30000,
        shippingFeeSatang: 25000,
        quoteTotalSatang: 120000,
        paidSatang: 55000,
        charge3plReturnFee: true,
        shippingReturnFeeSatang: 25000,
      });

      expect(res.chargesSatang).toBe(200000);
      expect(res.creditSatang).toBe(-30000);
      expect(res.balanceSatang).toBe(115000); // ฿1,150
    });

    it('should cap operation fee credit to quote total if quote is lower than operation fee', () => {
      // If operation fee was 300 (30000), but quote is only 200 (20000)
      const res = calcBalance({
        operationFeeSatang: 30000,
        shippingFeeSatang: 0,
        quoteTotalSatang: 20000,
        paidSatang: 30000,
      });

      expect(res.creditSatang).toBe(-20000);
      expect(res.chargesSatang).toBe(50000);
      expect(res.balanceSatang).toBe(0);
    });

    it('should verify E2E-01 sample numbers (Quote total 1,284, intake paid 300, balance 984)', () => {
      // Standard shipping, no warranty, large product:
      // Intake: operation=300 (30000), shipping=0, paid=300 (30000)
      // Quote: 1,284 (128400 satang)
      // Charges: 300 + 0 + 1,284 = 1,584 (158400 satang)
      // Credit: -300 (-30000)
      // Paid: 300 (30000)
      // Balance: 1,584 - 300 - 300 = 984 (98400 satang)
      const res = calcBalance({
        operationFeeSatang: 30000,
        shippingFeeSatang: 0,
        quoteTotalSatang: 128400,
        paidSatang: 30000,
      });

      expect(res.chargesSatang).toBe(158400);
      expect(res.creditSatang).toBe(-30000);
      expect(res.paidSatang).toBe(30000);
      expect(res.balanceSatang).toBe(98400); // ฿984
    });
  });
});
