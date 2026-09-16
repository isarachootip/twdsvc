import { z } from 'zod';

export const CalcIntakeFeesSchema = z.object({
  jobType: z.enum(['CUSTOMER', 'STOCK']),
  hasWarranty: z.boolean().nullable().optional(),
  shippingMethod: z.enum(['STANDARD', 'EXPRESS']).nullable().optional(),
  feeRate: z.object({
    operationFeeSatang: z.number().int().nonnegative(),
    shippingFee3plSatang: z.number().int().nonnegative(),
  }),
});

export const IntakeFeesResultSchema = z.object({
  operationFeeSatang: z.number().int().nonnegative(),
  shippingFeeSatang: z.number().int().nonnegative(),
  totalSatang: z.number().int().nonnegative(),
});

export const CalcBalanceSchema = z.object({
  operationFeeSatang: z.number().int().nonnegative(),
  shippingFeeSatang: z.number().int().nonnegative(),
  quoteTotalSatang: z.number().int().nonnegative(),
  paidSatang: z.number().int().nonnegative(),
  charge3plReturnFee: z.boolean().optional(),
  shippingReturnFeeSatang: z.number().int().nonnegative().optional(),
});

export const BalanceResultSchema = z.object({
  chargesSatang: z.number().int(),
  creditSatang: z.number().int(),
  paidSatang: z.number().int(),
  balanceSatang: z.number().int(),
});
