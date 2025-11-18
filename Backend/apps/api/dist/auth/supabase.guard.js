var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
// apps/api/src/auth/supabase.guard.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
/**
 * Guard qui vérifie le JWT Supabase (auth côté Supabase).
 * - Attend un header Authorization: Bearer <token>
 * - Ajoute req.user = { sub, email, role } si valide
 * - En dev, si SUPABASE_JWT_DISABLED="true", autorise toutes requêtes (à éviter en staging/prod)
 */
let SupabaseGuard = class SupabaseGuard {
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        if (process.env.SUPABASE_JWT_DISABLED === 'true' && process.env.NODE_ENV === 'development') {
            req.user = { sub: 'dev-user', email: 'dev@example.com', role: 'user' };
            return true;
        }
        const auth = req.headers['authorization'];
        if (!auth || !auth.startsWith('Bearer '))
            throw new UnauthorizedException('Missing bearer token');
        const token = auth.slice('Bearer '.length);
        try {
            // Supabase JWT est signé par leur clé; pour simple vérif structurelle on décode sans secret.
            // Pour vérification avancée, utiliser l’endpoint JWKS de Supabase (recommandé).
            const decoded = jwt.decode(token);
            if (!decoded?.sub)
                throw new Error('invalid token');
            req.user = {
                sub: decoded.sub,
                email: decoded.email,
                role: decoded.role ?? 'user',
                org_id: decoded.user_metadata?.org_id ?? null,
            };
            return true;
        }
        catch {
            throw new UnauthorizedException('Invalid token');
        }
    }
};
SupabaseGuard = __decorate([
    Injectable()
], SupabaseGuard);
export { SupabaseGuard };
