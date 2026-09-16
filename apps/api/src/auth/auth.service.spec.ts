import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService & Lockout Logic (08_rbac.md §7)', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockJwt: any;
  let mockConfig: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
      },
      roleMenuPermission: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      roleDataPermission: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };

    mockJwt = {
      sign: vi.fn().mockReturnValue('mock_token'),
      verify: vi.fn(),
    };

    mockConfig = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test_secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
        return null;
      }),
    };

    authService = new AuthService(mockPrisma, mockJwt, mockConfig);
  });

  it('should successfully authenticate valid user and reset failed attempts', async () => {
    const passwordHash = await bcrypt.hash('Passw0rd!', 10);
    const mockUser = {
      id: 'usr_1',
      username: 'admin',
      passwordHash,
      displayName: 'ผู้ดูแลระบบ',
      role: 'ADMIN',
      active: true,
      failedLoginAttempts: 2,
      lockedUntil: null,
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({
      ...mockUser,
      failedLoginAttempts: 0,
    });

    const result = await authService.login({
      username: 'admin',
      password: 'Passw0rd!',
    });

    expect(result.user.username).toBe('admin');
    expect(result.accessToken).toBe('mock_token');
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'usr_1' },
        data: expect.objectContaining({ failedLoginAttempts: 0 }),
      })
    );
  });

  it('should reject invalid password and increment failed attempts', async () => {
    const passwordHash = await bcrypt.hash('CorrectPass1!', 10);
    const mockUser = {
      id: 'usr_2',
      username: 'gr.bangna',
      passwordHash,
      displayName: 'GR Bangna',
      role: 'GR',
      active: true,
      failedLoginAttempts: 1,
      lockedUntil: null,
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      authService.login({ username: 'gr.bangna', password: 'WrongPassword' })
    ).rejects.toThrow(UnauthorizedException);

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'usr_2' },
        data: expect.objectContaining({ failedLoginAttempts: 2 }),
      })
    );
  });

  it('should lock user account when reaching 5 failed attempts', async () => {
    const passwordHash = await bcrypt.hash('CorrectPass1!', 10);
    const mockUser = {
      id: 'usr_3',
      username: 'cs.bangna',
      passwordHash,
      displayName: 'CS Bangna',
      role: 'CS',
      active: true,
      failedLoginAttempts: 4,
      lockedUntil: null,
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      authService.login({ username: 'cs.bangna', password: 'WrongPassword' })
    ).rejects.toThrow(UnauthorizedException);

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'usr_3' },
        data: expect.objectContaining({
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date),
        }),
      })
    );
  });

  it('should block login if account is locked until future date', async () => {
    const lockUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes in future
    const mockUser = {
      id: 'usr_4',
      username: 'dc.wangnoi',
      passwordHash: 'somehash',
      displayName: 'DC Wangnoi',
      role: 'DC',
      active: true,
      failedLoginAttempts: 5,
      lockedUntil: lockUntil,
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      authService.login({ username: 'dc.wangnoi', password: 'Passw0rd!' })
    ).rejects.toThrow(UnauthorizedException);
  });
});
