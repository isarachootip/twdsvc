import { z } from 'zod';

export const OwnerDeptSchema = z.enum([
  'CS',
  'GR',
  'DC',
  'VD',
  'TPL',
  'CUSTOMER',
  'CARRIER',
]);

export const SlaClockStatusSchema = z.enum(['RUNNING', 'PAUSED', 'STOPPED']);

export const JobSlaViewSchema = z.object({
  hoursInStep: z.number().int().nonnegative(),
  slaHours: z.number().int().nonnegative(),
  isOverdue: z.boolean(),
  overdueOwner: z.string().nullable(),
  overageHours: z.number().int().nonnegative(),
});
