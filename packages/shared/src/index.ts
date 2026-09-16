import { z } from 'zod';

export const HealthCheckResponseSchema = z.object({
  status: z.literal('ok'),
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
