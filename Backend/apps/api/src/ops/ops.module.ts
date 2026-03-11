import { Module } from '@nestjs/common';
import { OpsController } from './ops.controller.js';
import { OpsService } from './ops.service.js';
import { PrismaService } from '../prisma.service.js';
import { OpsAdminGuard } from './ops-admin.guard.js';

@Module({
  controllers: [OpsController],
  providers: [OpsService, PrismaService, OpsAdminGuard],
  exports: [OpsService, OpsAdminGuard],
})
export class OpsModule {}
