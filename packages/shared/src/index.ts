// Rules
export * from './rules/money';
export * from './rules/fees';
export * from './rules/quote';
export * from './rules/running-no';
export * from './rules/routing';
export * from './rules/sla';
export * from './rules/promo';
export * from './rules/payout';

// Schemas
export * from './schemas/money';
export * from './schemas/quote';
export * from './schemas/running-no';
export * from './schemas/routing';
export * from './schemas/sla';
export * from './schemas/promo';
export * from './schemas/payout';

import { z } from 'zod';

export const HealthCheckResponseSchema = z.object({
  status: z.literal('ok'),
  db: z.string().optional(),
  timestamp: z.string(),
  version: z.string().optional(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

export const APP_NAME = 'SVCM';
export const APP_TITLE = 'Thaiwatsadu Service Center Management System';

export function getSystemInfo() {
  return {
    name: APP_NAME,
    title: APP_TITLE,
    status: 'ok',
  };
}
