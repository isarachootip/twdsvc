import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    controller = new HealthController(mockPrisma as PrismaService);
  });

  it('should return status ok and db ok when db is reachable', async () => {
    const result = await controller.getHealth();
    expect(result.status).toBe('ok');
    expect(result.db).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });

  it('should return db disconnected when db query fails', async () => {
    mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('DB unreachable'));
    const result = await controller.getHealth();
    expect(result.status).toBe('ok');
    expect(result.db).toBe('disconnected');
  });
});
