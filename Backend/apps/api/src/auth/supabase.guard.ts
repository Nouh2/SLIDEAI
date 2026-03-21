// apps/api/src/auth/supabase.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma.service.js';

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

  constructor(private readonly prisma: PrismaService) {
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
      req.user = { sub: 'dev-user', email: 'dev@example.com', role: 'user', org_id: null };
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

      const userId = decoded.sub;
      let orgId = null;

      // Check for x-org-id header for context switching
      const orgIdHeader = req.headers['x-org-id'];
      if (orgIdHeader) {
        const canUseTeamWorkspace = await this.canUseTeamWorkspace(userId);

        if (canUseTeamWorkspace) {
          // Validate that the user is a member of this organization
          const membership = await this.prisma.membership.findFirst({
            where: {
              userId: userId,
              orgId: orgIdHeader as string,
            },
          });

          if (!membership) {
            throw new UnauthorizedException('User is not a member of the specified organization');
          }
          orgId = orgIdHeader;
        }
      }

      req.user = {
        sub: userId,
        email: decoded.email,
        role: decoded.role ?? 'user',
        org_id: orgId, // Use the header org_id if validated, otherwise null (personal)
      };

      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      // Log l'erreur pour debug (sans exposer de détails au client)
      console.error('[SupabaseGuard] Token verification failed:', err.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async canUseTeamWorkspace(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      select: {
        plan: true,
        status: true,
        requiresPayment: true,
      },
    });

    if (!subscription) {
      return false;
    }

    if (subscription.requiresPayment) {
      return false;
    }

    return subscription.plan === 'business' && subscription.status !== 'trial_expired';
  }
}
