import { describe, it, expect } from 'vitest';
import { prisma, PrismaClient, Role, JobStage } from './index';

describe('Database Package', () => {
  it('should export PrismaClient and prisma singleton instance', () => {
    expect(PrismaClient).toBeDefined();
    expect(prisma).toBeDefined();
  });

  it('should export generated Prisma Enums', () => {
    expect(Role.ADMIN).toBe('ADMIN');
    expect(Role.CS).toBe('CS');
    expect(JobStage.CS_OPENED).toBe('CS_OPENED');
  });
});
