// apps/api/src/auth/supabase.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';

/**
 * Guard qui vérifie le JWT Supabase (auth côté Supabase).
 * - Attend un header Authorization: Bearer <token>
 * - Vérifie la signature du JWT avec SUPABASE_JWT_SECRET
 * - Ajoute req.user = { sub, email, role } si valide
 * - En dev, si SUPABASE_JWT_DISABLED="true", autorise toutes requêtes (à éviter en staging/prod)
 */
@Injectable()
export class SupabaseGuard implements CanActivate {
  private readonly jwtSecret: string;

  constructor() {
    // Le JWT secret de Supabase se trouve dans : Project Settings > API > JWT Settings > JWT Secret
    this.jwtSecret = process.env.SUPABASE_JWT_SECRET || '';
    if (!this.jwtSecret && process.env.NODE_ENV !== 'development') {
      console.warn('[SupabaseGuard] WARNING: SUPABASE_JWT_SECRET is not set! Authentication will fail.');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<any>();

    // Mode développement uniquement : bypass l'auth si explicitement désactivé
    if (process.env.SUPABASE_JWT_DISABLED === 'true' && process.env.NODE_ENV === 'development') {
      req.user = { sub: 'dev-user', email: 'dev@example.com', role: 'user' };
      return true;
    }

    const auth = req.headers['authorization'];
    if (!auth || !auth.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = auth.slice('Bearer '.length);

    try {
      // ✅ SÉCURISÉ : Vérifie la signature du JWT avec le secret Supabase
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'], // Supabase utilise HS256 par défaut
      }) as any;

      if (!decoded?.sub) {
        throw new Error('Token missing sub claim');
      }

      req.user = {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role ?? 'user',
        org_id: decoded.user_metadata?.org_id ?? null,
      };

      return true;
    } catch (err: any) {
      // Log l'erreur pour debug (sans exposer de détails au client)
      console.error('[SupabaseGuard] Token verification failed:', err.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
