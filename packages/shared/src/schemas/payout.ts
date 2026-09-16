import { z } from 'zod';

export const CalcPayoutLineSchema = z.object({
  repairAmountSatang: z.number().int().nonnegative('ฐานค่าซ่อมต้องไม่ติดลบ'),
  gpPct: z.number().min(0).max(100, 'GP% ต้องอยู่ระหว่าง 0 ถึง 100'),
  deductionsSatang: z.number().int().nonnegative().optional().default(0),
});

export const PayoutLineCalculationResultSchema = z.object({
  repairAmountSatang: z.number().int().nonnegative(),
  gpPct: z.number(),
  gpAmountSatang: z.number().int().nonnegative(),
  deductionSatang: z.number().int().nonnegative(),
  netAmountSatang: z.number().int(),
});
