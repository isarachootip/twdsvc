import { Controller, Get } from '@nestjs/common';
import { HealthCheckResponse } from '@svcm/shared';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getHealth(): Promise<HealthCheckResponse> {
    let dbStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'disconnected';
    }

    return {
      status: 'ok',
      db: dbStatus,
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };
  }
}
