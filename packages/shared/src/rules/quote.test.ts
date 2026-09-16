import { describe, it, expect } from 'vitest';
import { buildInspectionLine, calcQuoteTotals, calcEstimatedDays } from './quote';

describe('Quote Rules (docs/05_business_rules.md §2)', () => {
  const vendorInspection = {
    inspectionFeeCoveredSatang: 0,
    inspectionFeeNotCoveredSatang: 30000, // 300 บาท
  };

  describe('buildInspectionLine (§2.1)', () => {
    it('should generate 0 Baht inspection fee when product has warranty', () => {
      const line = buildInspectionLine({
        hasWarranty: true,
        vendor: vendorInspection,
      });

      expect(line.type).toBe('INSPECTION_FEE');
      expect(line.description).toBe('ค่าเปิดเครื่องตรวจเช็ค');
      expect(line.priceSatang).toBe(0);
      expect(line.sortOrder).toBe(0);
    });

    it('should generate vendor fee when product does not have warranty', () => {
      const line = buildInspectionLine({
        hasWarranty: false,
        vendor: vendorInspection,
      });

      expect(line.type).toBe('INSPECTION_FEE');
      expect(line.description).toBe('ค่าเปิดเครื่องตรวจเช็ค');
      expect(line.priceSatang).toBe(30000);
      expect(line.sortOrder).toBe(0);
    });
  });

  describe('calcQuoteTotals - ฿963 Example (§2.2)', () => {
    it('should match the documented ฿963 total calculation', () => {
      // ค่าเปิดเครื่อง 300 + แผงควบคุมความร้อน 450 + สายไฟ 150
      const lines = [
        { priceSatang: 30000 }, // 300 บาท
        { priceSatang: 45000 }, // 450 บาท
        { priceSatang: 15000 }, // 150 บาท
      ];

      const totals = calcQuoteTotals({ lines, vatRate: 0.07 });

      expect(totals.subtotalSatang).toBe(90000); // 900 บาท
      expect(totals.vatSatang).toBe(6300); // 63 บาท
      expect(totals.totalSatang).toBe(96300); // 963 บาท
    });

    it('should handle zero lines / zero price for auto-approved jobs', () => {
      const lines = [{ priceSatang: 0 }];
      const totals = calcQuoteTotals({ lines, vatRate: 0.07 });

      expect(totals.subtotalSatang).toBe(0);
      expect(totals.vatSatang).toBe(0);
      expect(totals.totalSatang).toBe(0);
    });
  });

  describe('calcEstimatedDays (§2.2)', () => {
    it('should calculate repairDays + max(partWaitDays)', () => {
      const days = calcEstimatedDays({
        repairDays: 3,
        lines: [
          { partWaitDays: 2 },
          { partWaitDays: 1 },
          { partWaitDays: null },
        ],
      });

      // 3 + max(2, 1) = 5 days
      expect(days).toBe(5);
    });

    it('should return repairDays directly when no parts have wait time', () => {
      const days = calcEstimatedDays({
        repairDays: 4,
        lines: [{ partWaitDays: 0 }, { partWaitDays: undefined }],
      });

      expect(days).toBe(4);
    });
  });
});
