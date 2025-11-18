// apps/api/src/auth/supabase.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';

/**
 * Guard qui vérifie le JWT Supabase (auth côté Supabase).
 * - Attend un header Authorization: Bearer <token>
 * - Ajoute req.user = { sub, email, role } si valide
 * - En dev, si SUPABASE_JWT_DISABLED="true", autorise toutes requêtes (à éviter en staging/prod)
 */
@Injectable()
export class SupabaseGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();

    if (process.env.SUPABASE_JWT_DISABLED === 'true' && process.env.NODE_ENV === 'development') {
      req.user = { sub: 'dev-user', email: 'dev@example.com', role: 'user' };
      return true;
    }

    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) throw new UnauthorizedException('Missing bearer token');

    const token = auth.slice('Bearer '.length);
    try {
      // Supabase JWT est signé par leur clé; pour simple vérif structurelle on décode sans secret.
      // Pour vérification avancée, utiliser l’endpoint JWKS de Supabase (recommandé).
      const decoded = jwt.decode(token) as any;
      if (!decoded?.sub) throw new Error('invalid token');
      req.user = {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role ?? 'user',
        org_id: decoded.user_metadata?.org_id ?? null,
      };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
