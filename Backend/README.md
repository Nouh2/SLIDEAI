# SlideAI Backend (NestJS + BullMQ) — Supabase / Upstash / R2

## Stack
- API: NestJS (Fastify, Helmet, CORS, rate-limit), Supabase JWT Guard
- DB: Supabase Postgres (RLS côté DB — config à faire dans Supabase)
- Queues: BullMQ (Redis Upstash ou Redis managé)
- Storage: Cloudflare R2 (S3 compatible), URLs signées
- Worker: Node (BullMQ), déployable sur Railway

## Variables d'environnement (API & Worker)
API
PORT=3000
FRONTEND_ORIGIN=https://slideai.app,https://localhost:5173

DATABASE_URL=postgresql://user:pass@host:5432/db # Supabase
REDIS_URL=rediss://:password@upstash-host:6379

Supabase
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=... # (ne PAS mettre côté API publique)
SUPABASE_JWT_DISABLED=false

R2 (principalement pour le worker / export)
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=slideai-exports

bash
Copier le code

## Démarrage local
```bash
# API
npm i
npm -w apps/api i
npm -w apps/worker i

npm run dev:api
npm run dev:worker
Endpoints clés
GET /healthz / GET /readyz

GET /account/me (JWT Supabase requis)

GET /projects / POST /projects / GET /projects/:id / PATCH /projects/:id / DELETE /projects/:id

POST /v1/generate → queue (mock LLM) → logs generate.done

POST /v1/export → queue export → R2 URL signée en retour worker (log)

Note: Pour un statut de job consultable via l’API, brancher une table job_result Prisma et persister traceId, status, payload, result. Le scaffold renvoie l’acceptation et loggue le résultat côté worker pour rester simple.

Sécurité (inclus dans scaffold)
Helmet (CSP), CORS strict, rate-limit global (1 min), logs PII-redacted, traceId

Guard JWT Supabase (dev bypass optionnel)

Scoping projets par ownerId et orgId (à synchroniser avec RLS côté Supabase)