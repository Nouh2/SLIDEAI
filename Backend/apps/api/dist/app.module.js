var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller.js';
import { AccountController } from './account/account.controller.js';
import { AuthModule } from './auth/auth.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { GenerateModule } from './generate/generate.module.js';
import { ExportModule } from './export/export.module.js';
import { QueueModule } from './queues/queue.module.js';
import { PrismaService } from './prisma.service.js';
import { AuditMiddleware } from './common/audit.middleware.js';
import { UploadController } from './upload/upload.controller.js'; // ✅ ajoute bien .js à la fin
import { SubscriptionModule } from './subscription/subscription.module.js';
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(AuditMiddleware).forRoutes('*');
    }
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            AuthModule,
            ProjectsModule,
            QueueModule,
            GenerateModule,
            ExportModule,
            SubscriptionModule,
        ],
        controllers: [
            HealthController,
            AccountController,
            UploadController, // ✅ ajouté ici
        ],
        providers: [PrismaService],
    })
], AppModule);
export { AppModule };
