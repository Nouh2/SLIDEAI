// apps/api/src/generate/generate.module.ts
import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller.js';

@Module({
  controllers: [GenerateController],
})
export class GenerateModule {}
