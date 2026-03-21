import { CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../prisma.service.js';
/**
 * Guard qui vérifie le JWT Supabase (auth côté Supabase).
 * - Attend un header Authorization: Bearer <token>
 * - Vérifie la signature du JWT avec SUPABASE_JWT_SECRET
 * - Ajoute req.user = { sub, email, role } si valide
 * - En dev, si SUPABASE_JWT_DISABLED="true", autorise toutes requêtes (à éviter en staging/prod)
 */
export declare class SupabaseGuard implements CanActivate {
    private readonly prisma;
    private readonly jwtSecret;
    constructor(prisma: PrismaService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private canUseTeamWorkspace;
}
