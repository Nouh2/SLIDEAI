// apps/api/src/app.module.ts
import { Module, MiddlewareConsumer } from '@nestjs/common';
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

@Module({
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
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditMiddleware).forRoutes('*');
  }
}
