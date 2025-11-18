// apps/api/src/common/audit.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { ulid } from 'ulid';

@Injectable()
export class AuditMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // Génère / propage un traceId
    const traceId = req.headers['x-trace-id'] ?? ulid();
    req.traceId = traceId;

    // Fastify (middleware) → res est un ServerResponse Node.js brut
    // => utiliser setHeader(), et écouter 'finish' via once()
    try {
      res.setHeader('x-trace-id', traceId);
    } catch {
      // ignore si non supporté
    }

    res.once('finish', () => {
      // Log minimal PII-redacted
      const safe = {
        t: new Date().toISOString(),
        traceId,
        ip: req.headers['x-forwarded-for'] ?? req.ip,
        ua: req.headers['user-agent'],
        method: req.method,
        path: req.url,
        status: res.statusCode,
        user: req.user ? { sub: req.user.sub, org: req.user.org_id } : undefined,
      };
      try {
        console.log(JSON.stringify(safe));
      } catch {
        // noop
      }
    });

    next();
  }
}
