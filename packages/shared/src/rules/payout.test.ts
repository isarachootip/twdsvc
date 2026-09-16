import { describe, it, expect } from 'vitest';
import { calcPayoutLine, groupPayout, PayoutLineItem } from './payout';

describe('Vendor Payout Rules (docs/05_business_rules.md §7)', () => {
  describe('calcPayoutLine', () => {
    it('should calculate GP 18% on ฿1,200 repairAmount correctly (gp 216, net 984)', () => {
      // 1,200 Baht = 120000 satang, GP 18% = 21600 satang (216 Baht), Net = 98400 satang (984 Baht)
      const res = calcPayoutLine({
        repairAmountSatang: 120000,
        gpPct: 18.0,
      });

      expect(res.repairAmountSatang).toBe(120000);
      expect(res.gpPct).toBe(18.0);
      expect(res.gpAmountSatang).toBe(21600); // ฿216
      expect(res.deductionSatang).toBe(0);
      expect(res.netAmountSatang).toBe(98400); // ฿984
    });

    it('should subtract extra vendor deductions from net payout amount', () => {
      const res = calcPayoutLine({
        repairAmountSatang: 100000, // 1,000 Baht
        gpPct: 20.0, // GP 200 Baht
        deductionsSatang: 5000, // Deduction 50 Baht
      });

      expect(res.gpAmountSatang).toBe(20000); // ฿200
      expect(res.deductionSatang).toBe(5000); // ฿50
      expect(res.netAmountSatang).toBe(75000); // ฿750
    });
  });

  describe('groupPayout', () => {
    const sampleLines: PayoutLineItem[] = [
      {
        id: 'line_1',
        jobId: 'job_1',
        jobNo: 'JB-2609-00001',
        vendorId: 'v_0088',
        vendorName: 'บ.ช่างเจริญ',
        vendorCenterId: 'vc_0088_1',
        vendorCenterCode: 'VD-0088-1',
        branchId: 'site_bangna',
        branchName: 'สาขาบางนา',
        repairAmountSatang: 100000, // 1000
        gpPct: 18.0,
        gpAmountSatang: 18000, // 180
        deductionSatang: 0,
        netAmountSatang: 82000, // 820
      },
      {
        id: 'line_2',
        jobId: 'job_2',
        jobNo: 'JB-2609-00002',
        vendorId: 'v_0088',
        vendorName: 'บ.ช่างเจริญ',
        vendorCenterId: 'vc_0088_1',
        vendorCenterCode: 'VD-0088-1',
        branchId: 'site_rangsit',
        branchName: 'สาขารังสิต',
        repairAmountSatang: 200000, // 2000
        gpPct: 18.0,
        gpAmountSatang: 36000, // 360
        deductionSatang: 0,
        netAmountSatang: 164000, // 1640
      },
      {
        id: 'line_3',
        jobId: 'job_3',
        jobNo: 'JB-2609-00003',
        vendorId: 'v_0091',
        vendorName: 'ศูนย์ซ่อมไฟฟ้ารุ่งเรือง',
        vendorCenterId: 'vc_0091_1',
        vendorCenterCode: 'VD-0091-1',
        branchId: 'site_bangna',
        branchName: 'สาขาบางนา',
        repairAmountSatang: 50000, // 500
        gpPct: 15.0,
        gpAmountSatang: 7500, // 75
        deductionSatang: 0,
        netAmountSatang: 42500, // 425
      },
    ];

    it('should group lines by Vendor correctly and calculate aggregate GP%', () => {
      const groups = groupPayout(sampleLines, 'vendor');
      expect(groups).toHaveLength(2);

      const v0088Group = groups.find((g) => g.groupId === 'v_0088');
      expect(v0088Group).toBeDefined();
      expect(v0088Group?.jobCount).toBe(2);
      expect(v0088Group?.totalRepairSatang).toBe(300000);
      expect(v0088Group?.totalGpSatang).toBe(54000);
      expect(v0088Group?.avgGpPct).toBe(18.0);
      expect(v0088Group?.totalNetSatang).toBe(246000);
    });

    it('should group lines by Branch correctly', () => {
      const groups = groupPayout(sampleLines, 'branch');
      expect(groups).toHaveLength(2);

      const bangnaGroup = groups.find((g) => g.groupId === 'site_bangna');
      expect(bangnaGroup).toBeDefined();
      expect(bangnaGroup?.jobCount).toBe(2);
      expect(bangnaGroup?.totalRepairSatang).toBe(150000);
      expect(bangnaGroup?.totalGpSatang).toBe(25500);
      expect(bangnaGroup?.avgGpPct).toBe(17.0); // (25500 / 150000) * 100 = 17%
    });
  });
});
