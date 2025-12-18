import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { fastifyHelmet } from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
    { snapshot: true },
  );

  const config = app.get(ConfigService);

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'img-src': ["'self'", 'data:'],
      },
    },
  });

  await app.register(cors, {
    origin: (origin, cb) => {
      const allowed = (config.get<string>('FRONTEND_ORIGIN') || '').split(',').map(s => s.trim()).filter(Boolean);
      if (!origin || allowed.includes(origin)) cb(null, true);
      else cb(new Error('CORS blocked'), false);
    },
    credentials: true,
  });

  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => `${req.headers['x-forwarded-for'] ?? req.ip}`,
  });

  // Register multipart for file uploads
  const multipart = (await import('@fastify/multipart')).default;
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  });

  // Serve static files from exports folder (dev mode)
  const fastifyStatic = (await import('@fastify/static')).default;
  const path = await import('path');

  console.log('[DEBUG API] process.cwd():', process.cwd());
  const exportsPath = path.join(process.cwd(), '../../exports'); // From apps/api to Backend/exports
  console.log('[DEBUG API] exportsPath:', exportsPath);

  await app.register(fastifyStatic, {
    root: exportsPath,
    prefix: '/exports/',
    decorateReply: false,
  });

  const port = parseInt(config.get('PORT') ?? '3000', 10);
  await app.listen({ port, host: '0.0.0.0' });
}

bootstrap();
