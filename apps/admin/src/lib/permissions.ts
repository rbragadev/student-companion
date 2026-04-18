import type { Role } from '@/types/auth.types';
import type { Permission } from '@/types/permissions.types';
import { ROLE_PERMISSIONS } from '@/types/permissions.types';

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (permissions[0] === '*') return true;
  return (permissions as Permission[]).includes(permission);
}

export function canAccess(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export const ADMIN_ROLES: Role[] = ['ADMIN', 'SUPER_ADMIN'];

export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.includes(role);
}
