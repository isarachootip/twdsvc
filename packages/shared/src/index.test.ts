import { describe, it, expect } from 'vitest';
import { APP_NAME, getSystemInfo, HealthCheckResponseSchema } from './index';

describe('Shared Package Basic Test', () => {
  it('should have correct APP_NAME', () => {
    expect(APP_NAME).toBe('SVCM');
  });

  it('should return system info with ok status', () => {
    const info = getSystemInfo();
    expect(info.name).toBe('SVCM');
    expect(info.status).toBe('ok');
  });

  it('should validate HealthCheckResponseSchema properly', () => {
    const validData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };

    const parsed = HealthCheckResponseSchema.safeParse(validData);
    expect(parsed.success).toBe(true);

    const invalidData = { status: 'error', timestamp: 123 };
    const invalidParsed = HealthCheckResponseSchema.safeParse(invalidData);
    expect(invalidParsed.success).toBe(false);
  });
});
