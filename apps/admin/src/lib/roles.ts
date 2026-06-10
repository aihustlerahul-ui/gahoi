/** Normalise admin role: super_admin, SuperAdmin → superadmin */
export function normaliseRole(role: string): string {
  return role.toLowerCase().replace(/_/g, '');
}

export function isSuperAdmin(role: string | undefined | null): boolean {
  return normaliseRole(role ?? '') === 'superadmin';
}
