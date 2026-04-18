import type { Role } from '@/types/auth.types';

export const ADMIN_ROLES: Role[] = ['ADMIN', 'SUPER_ADMIN'];

export function isAdminRole(role: string): role is Role {
  return ADMIN_ROLES.includes(role as Role);
}

/** `admin.full` concede acesso irrestrito a qualquer permissão. */
export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes('admin.full') || permissions.includes(permission);
}

export function canAccess(permissions: string[], required: string[]): boolean {
  return required.every((p) => hasPermission(permissions, p));
}
