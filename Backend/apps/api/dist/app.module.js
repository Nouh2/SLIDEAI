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
import { BrandController } from './brand/brand.controller.js';
import { SubscriptionModule } from './subscription/subscription.module.js';
import { PresentationModule } from './presentation/presentation.module.js';
import { LibraryModule } from './library/library.module.js';
import { CommentsModule } from './comments/comments.module.js';
import { OrgModule } from './org/org.module.js';
import { AiModule } from './ai/ai.module.js';
import { OpsModule } from './ops/ops.module.js';
import { ProductEventsModule } from './product-events/product-events.module.js';
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
            PresentationModule,
            LibraryModule,
            CommentsModule,
            OrgModule,
            AiModule,
            OpsModule,
            ProductEventsModule,
        ],
        controllers: [
            HealthController,
            AccountController,
            UploadController, // ✅ ajouté ici
            BrandController,
        ],
        providers: [PrismaService],
    })
], AppModule);
export { AppModule };
