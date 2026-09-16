import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException, ExecutionContext } from '@nestjs/common';

describe('RolesGuard (08_rbac.md §1)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(userRole?: string): ExecutionContext {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          user: userRole ? { role: userRole } : null,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if no roles are required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext('CS');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'CS']);
    const ctx = createMockContext('CS');
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access and throw ForbiddenException if user lacks required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    const ctx = createMockContext('GR');
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
