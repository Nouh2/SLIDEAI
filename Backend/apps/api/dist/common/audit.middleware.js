var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// apps/api/src/common/audit.middleware.ts
import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
let AuditMiddleware = class AuditMiddleware {
    use(req, res, next) {
        // Génère / propage un traceId
        const traceId = req.headers['x-trace-id'] ?? ulid();
        req.traceId = traceId;
        // Fastify (middleware) → res est un ServerResponse Node.js brut
        // => utiliser setHeader(), et écouter 'finish' via once()
        try {
            res.setHeader('x-trace-id', traceId);
        }
        catch {
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
            }
            catch {
                // noop
            }
        });
        next();
    }
};
AuditMiddleware = __decorate([
    Injectable()
], AuditMiddleware);
export { AuditMiddleware };
