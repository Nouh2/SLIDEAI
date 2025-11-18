// apps/api/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/healthz')
  health() {
    return { status: 'ok' };
  }
  @Get('/readyz')
  ready() {
    return { ready: true };
  }
}
