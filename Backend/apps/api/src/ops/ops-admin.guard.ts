import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

function getOpsAdminEmails() {
  return (process.env.OPS_ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

@Injectable()
export class OpsAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<any>();
    const email = req.user?.email?.toLowerCase?.();
    const allowedEmails = getOpsAdminEmails();

    if (!email || !allowedEmails.includes(email)) {
      throw new ForbiddenException('Acces reserve a l’equipe interne.');
    }

    req.opsAdmin = true;
    return true;
  }
}

export function isOpsAdminEmail(email?: string | null) {
  if (!email) return false;
  return getOpsAdminEmails().includes(email.toLowerCase());
}
