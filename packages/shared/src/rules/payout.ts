import { roundHalfUp } from './money';

/**
 * Vendor Payout calculation rules.
 * Reference: docs/05_business_rules.md §7
 */

export interface CalcPayoutLineInput {
  repairAmountSatang: number; // Subtotal of approved quote (before VAT)
  gpPct: number;
  deductionsSatang?: number;
}

export interface PayoutLineCalculationResult {
  repairAmountSatang: number;
  gpPct: number;
  gpAmountSatang: number;
  deductionSatang: number;
  netAmountSatang: number;
}

/**
 * Calculates a single payout line for a repaired job.
 * gpAmount = roundHalfUp(repairAmount * gpPct / 100)
 * net = repairAmount - gpAmount - deductions
 */
export function calcPayoutLine(input: CalcPayoutLineInput): PayoutLineCalculationResult {
  const { repairAmountSatang, gpPct, deductionsSatang = 0 } = input;
  const gpAmountSatang = roundHalfUp((repairAmountSatang * gpPct) / 100);
  const netAmountSatang = repairAmountSatang - gpAmountSatang - deductionsSatang;

  return {
    repairAmountSatang,
    gpPct,
    gpAmountSatang,
    deductionSatang: deductionsSatang,
    netAmountSatang,
  };
}

export interface PayoutLineItem {
  id: string;
  jobId: string;
  jobNo: string;
  vendorId: string;
  vendorName: string;
  vendorCenterId: string;
  vendorCenterCode: string;
  branchId: string;
  branchName: string;
  repairAmountSatang: number;
  gpPct: number;
  gpAmountSatang: number;
  deductionSatang: number;
  netAmountSatang: number;
  selected?: boolean;
}

export interface PayoutGroupSummary {
  groupId: string;
  groupName: string;
  jobCount: number;
  totalRepairSatang: number;
  totalGpSatang: number;
  avgGpPct: number;
  totalDeductionsSatang: number;
  totalNetSatang: number;
  lines: PayoutLineItem[];
}

/**
 * Groups payout lines by Vendor or Branch and computes aggregate totals and average GP%.
 */
export function groupPayout(
  lines: PayoutLineItem[],
  groupBy: 'vendor' | 'branch'
): PayoutGroupSummary[] {
  const groups = new Map<string, { name: string; items: PayoutLineItem[] }>();

  for (const line of lines) {
    const groupId = groupBy === 'vendor' ? line.vendorId : line.branchId;
    const groupName = groupBy === 'vendor' ? line.vendorName : line.branchName;

    if (!groups.has(groupId)) {
      groups.set(groupId, { name: groupName, items: [] });
    }
    groups.get(groupId)!.items.push(line);
  }

  const result: PayoutGroupSummary[] = [];

  for (const [groupId, group] of groups.entries()) {
    let totalRepairSatang = 0;
    let totalGpSatang = 0;
    let totalDeductionsSatang = 0;
    let totalNetSatang = 0;

    for (const item of group.items) {
      totalRepairSatang += item.repairAmountSatang;
      totalGpSatang += item.gpAmountSatang;
      totalDeductionsSatang += item.deductionSatang;
      totalNetSatang += item.netAmountSatang;
    }

    const avgGpPct =
      totalRepairSatang > 0 ? (totalGpSatang / totalRepairSatang) * 100 : 0;

    result.push({
      groupId,
      groupName: group.name,
      jobCount: group.items.length,
      totalRepairSatang,
      totalGpSatang,
      avgGpPct: Number(avgGpPct.toFixed(2)),
      totalDeductionsSatang,
      totalNetSatang,
      lines: group.items,
    });
  }

  return result;
}
