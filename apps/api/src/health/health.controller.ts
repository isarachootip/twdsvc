import { Controller, Get } from '@nestjs/common';
import { HealthCheckResponse } from '@svcm/shared';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthCheckResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };
  }
}
