import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';

export interface AuthRequest extends Request {
  userId?: string;
  userTier?: string;
  adminId?: string;
  adminRole?: string;
}

export function authGuard(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    res.status(401).json({ success: false, data: null, error: 'Unauthorized', meta: {} });
    return;
  }
  try {
    const payload = verifyToken(token);
    req.userId = payload.sub as string;
    req.userTier = payload.tier as string;
    next();
  } catch {
    res.status(401).json({ success: false, data: null, error: 'Token expired or invalid', meta: {} });
  }
}

/**
 * Guard for admin panel routes.
 * Validates that the token was issued as an admin token (type: 'admin' claim)
 * and attaches adminId + role to the request.
 */
export function adminAuthGuard(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) {
    res.status(401).json({ success: false, data: null, error: 'Unauthorized', meta: {} });
    return;
  }
  try {
    const payload = verifyToken(token);
    if (payload.type !== 'admin') {
      res.status(403).json({ success: false, data: null, error: 'Forbidden: Admin token required', meta: {} });
      return;
    }
    req.adminId = payload.sub as string;
    req.adminRole = payload.role as string;
    // Also set userId so existing service calls that check req.userId still work
    req.userId = payload.sub as string;
    next();
  } catch {
    res.status(401).json({ success: false, data: null, error: 'Token expired or invalid', meta: {} });
  }
}

/** Normalise role strings: super_admin, SuperAdmin → superadmin */
function normaliseAdminRole(role: string): string {
  return role.toLowerCase().replace(/_/g, '');
}

/**
 * Restrict route to specific admin roles (e.g. super_admin only).
 * Must be used after adminAuthGuard.
 */
export function requireAdminRole(allowedRoles: string[]) {
  const allowed = allowedRoles.map(normaliseAdminRole);

  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const role = normaliseAdminRole(req.adminRole ?? '');
    if (!allowed.includes(role)) {
      res.status(403).json({
        success: false,
        data: null,
        error: 'Forbidden: insufficient admin role',
        meta: {},
      });
      return;
    }
    next();
  };
}
