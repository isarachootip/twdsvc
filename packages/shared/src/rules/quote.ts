import { roundHalfUp } from './money';

/**
 * Quote calculation rules for Vendor Quotations.
 * Reference: docs/05_business_rules.md §2
 */

export interface VendorInspectionFeeInput {
  inspectionFeeCoveredSatang: number;
  inspectionFeeNotCoveredSatang: number;
}

export interface BuildInspectionLineInput {
  hasWarranty: boolean;
  vendor: VendorInspectionFeeInput;
}

export interface QuoteLineResult {
  type: 'INSPECTION_FEE' | 'PART' | 'LABOR' | 'OTHER';
  description: string;
  priceSatang: number;
  sortOrder: number;
}

/**
 * Builds the initial inspection fee quote line according to warranty status.
 */
export function buildInspectionLine(input: BuildInspectionLineInput): QuoteLineResult {
  const priceSatang = input.hasWarranty
    ? input.vendor.inspectionFeeCoveredSatang
    : input.vendor.inspectionFeeNotCoveredSatang;

  return {
    type: 'INSPECTION_FEE',
    description: 'ค่าเปิดเครื่องตรวจเช็ค',
    priceSatang,
    sortOrder: 0,
  };
}

export interface QuoteLinePriceInput {
  priceSatang: number;
}

export interface CalcQuoteTotalsInput {
  lines: QuoteLinePriceInput[];
  vatRate?: number;
}

export interface QuoteTotalsResult {
  subtotalSatang: number;
  vatSatang: number;
  totalSatang: number;
}

/**
 * Calculates subtotal, VAT (7% default with roundHalfUp), and total.
 */
export function calcQuoteTotals(input: CalcQuoteTotalsInput): QuoteTotalsResult {
  const { lines, vatRate = 0.07 } = input;
  const subtotalSatang = lines.reduce((sum, line) => sum + line.priceSatang, 0);
  const vatSatang = roundHalfUp(subtotalSatang * vatRate);
  const totalSatang = subtotalSatang + vatSatang;

  return {
    subtotalSatang,
    vatSatang,
    totalSatang,
  };
}

export interface QuoteLineWaitInput {
  partWaitDays?: number | null;
}

export interface CalcEstimatedDaysInput {
  repairDays: number;
  lines?: QuoteLineWaitInput[];
}

/**
 * Calculates estimated turnaround days: repairDays + max(partWaitDays).
 */
export function calcEstimatedDays(input: CalcEstimatedDaysInput): number {
  const { repairDays, lines = [] } = input;
  let maxPartWait = 0;
  for (const line of lines) {
    if (line.partWaitDays && line.partWaitDays > maxPartWait) {
      maxPartWait = line.partWaitDays;
    }
  }
  return repairDays + maxPartWait;
}
