import { CanActivate, ExecutionContext } from '@nestjs/common';
/**
 * Guard qui vérifie le JWT Supabase (auth côté Supabase).
 * - Attend un header Authorization: Bearer <token>
 * - Ajoute req.user = { sub, email, role } si valide
 * - En dev, si SUPABASE_JWT_DISABLED="true", autorise toutes requêtes (à éviter en staging/prod)
 */
export declare class SupabaseGuard implements CanActivate {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
