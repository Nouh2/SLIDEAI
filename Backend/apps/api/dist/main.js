import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { fastifyHelmet } from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { ConfigService } from '@nestjs/config';
async function bootstrap() {
    const app = await NestFactory.create(AppModule, new FastifyAdapter({
        logger: false,
        bodyLimit: 50 * 1024 * 1024 // 50MB limit
    }), { snapshot: true, rawBody: true });
    const config = app.get(ConfigService);
    await app.register(fastifyHelmet, {
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                'default-src': ["'self'"],
                'img-src': ["'self'", 'data:', '*.cloudflarestorage.com'], // Allow R2 images
                'frame-ancestors': ["'none'"], // Prevent clickjacking
            },
        },
    });
    await app.register(cors, {
        origin: (origin, cb) => {
            const isDev = config.get('NODE_ENV') === 'development';
            const envOrigins = (config.get('FRONTEND_ORIGIN') || '').split(',').map(s => s.trim()).filter(Boolean);
            const allowed = [
                ...envOrigins,
                'https://slideai.fr',
                'https://www.slideai.fr',
                'https://slideai.tech',
                'https://www.slideai.tech',
                'http://localhost:5173', // Ensure dev default is present if needed
                'http://localhost:8080',
                'http://127.0.0.1:8080',
                'http://localhost:4173',
                'http://127.0.0.1:4173',
                'http://localhost:3000',
                'http://127.0.0.1:3000',
            ];
            if (!origin || allowed.includes(origin))
                cb(null, true);
            else {
                // console.log('CORS blocked:', origin);
                cb(new Error('CORS blocked'), false);
            }
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
            fileSize: 50 * 1024 * 1024, // 50MB max
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
