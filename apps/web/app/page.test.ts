import { describe, it, expect } from 'vitest';
import { APP_NAME } from '@svcm/shared';

describe('Web App basic test', () => {
  it('should use shared package APP_NAME', () => {
    expect(APP_NAME).toBe('SVCM');
  });
});
