/**
 * Fee calculation rules for intake and repair completion balance.
 * Reference: docs/05_business_rules.md §1
 */

export interface FeeRateInput {
  operationFeeSatang: number;
  shippingFee3plSatang: number;
}

export interface CalcIntakeFeesInput {
  jobType: 'CUSTOMER' | 'STOCK';
  hasWarranty?: boolean | null;
  shippingMethod?: 'STANDARD' | 'EXPRESS' | null;
  feeRate: FeeRateInput;
}

export interface IntakeFeesResult {
  operationFeeSatang: number;
  shippingFeeSatang: number;
  totalSatang: number;
}

/**
 * Calculates intake fees charged to the customer at the time of opening a job.
 * - STOCK jobs are always 0.
 * - EXPRESS shipping charges operation fee + 3PL shipping fee regardless of warranty.
 * - STANDARD shipping charges operation fee only if no warranty; free if with warranty.
 */
export function calcIntakeFees(input: CalcIntakeFeesInput): IntakeFeesResult {
  if (input.jobType === 'STOCK') {
    return {
      operationFeeSatang: 0,
      shippingFeeSatang: 0,
      totalSatang: 0,
    };
  }

  const { feeRate, hasWarranty = false, shippingMethod = 'STANDARD' } = input;

  if (shippingMethod === 'EXPRESS') {
    const operationFeeSatang = feeRate.operationFeeSatang;
    const shippingFeeSatang = feeRate.shippingFee3plSatang;
    return {
      operationFeeSatang,
      shippingFeeSatang,
      totalSatang: operationFeeSatang + shippingFeeSatang,
    };
  }

  // STANDARD shipping
  const operationFeeSatang = hasWarranty ? 0 : feeRate.operationFeeSatang;
  const shippingFeeSatang = 0;

  return {
    operationFeeSatang,
    shippingFeeSatang,
    totalSatang: operationFeeSatang + shippingFeeSatang,
  };
}

export interface CalcBalanceInput {
  operationFeeSatang: number;
  shippingFeeSatang: number;
  quoteTotalSatang: number;
  paidSatang: number;
  charge3plReturnFee?: boolean;
  shippingReturnFeeSatang?: number;
}

export interface BalanceResult {
  chargesSatang: number;
  creditSatang: number;
  paidSatang: number;
  balanceSatang: number;
}

/**
 * Calculates the net balance upon repair approval and completion.
 * charges = OPERATION_FEE + SHIPPING_FEE + (optional return shipping) + REPAIR(quote.total)
 * credit = OPERATION_FEE_CREDIT = -min(operationFeePaid, quote.total)
 * balance = charges + credit - paid
 */
export function calcBalance(input: CalcBalanceInput): BalanceResult {
  const {
    operationFeeSatang,
    shippingFeeSatang,
    quoteTotalSatang,
    paidSatang,
    charge3plReturnFee = false,
    shippingReturnFeeSatang = 0,
  } = input;

  const returnShipping = charge3plReturnFee ? shippingReturnFeeSatang : 0;
  const chargesSatang = operationFeeSatang + shippingFeeSatang + returnShipping + quoteTotalSatang;
  const creditSatang = -Math.min(operationFeeSatang, quoteTotalSatang);
  const balanceSatang = chargesSatang + creditSatang - paidSatang;

  return {
    chargesSatang,
    creditSatang,
    paidSatang,
    balanceSatang,
  };
}
