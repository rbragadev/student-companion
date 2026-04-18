import type { Role } from './auth.types';

export type Permission =
  | 'dashboard:view'
  | 'schools:view'    | 'schools:create'    | 'schools:edit'    | 'schools:delete'
  | 'courses:view'    | 'courses:create'    | 'courses:edit'    | 'courses:delete'
  | 'accommodations:view' | 'accommodations:create' | 'accommodations:edit' | 'accommodations:delete'
  | 'places:view'     | 'places:create'     | 'places:edit'     | 'places:delete'
  | 'students:view'   | 'students:create'   | 'students:edit'   | 'students:delete'
  | 'admins:view'     | 'admins:create'     | 'admins:edit'     | 'admins:delete'
  // Preparado para expansão futura
  | 'institutions:view' | 'institutions:create' | 'institutions:edit' | 'institutions:delete'
  | 'units:view'      | 'units:create'      | 'units:edit'      | 'units:delete'
  | 'classes:view'    | 'classes:create'    | 'classes:edit'    | 'classes:delete'
  | 'enrollments:view'| 'enrollments:create'| 'enrollments:edit'| 'enrollments:delete';

export const ROLE_PERMISSIONS: Record<Role, Permission[] | ['*']> = {
  STUDENT: [],
  ADMIN: [
    'dashboard:view',
    'schools:view', 'schools:create', 'schools:edit',
    'courses:view', 'courses:create', 'courses:edit',
    'accommodations:view', 'accommodations:create', 'accommodations:edit',
    'places:view', 'places:create', 'places:edit',
    'students:view',
  ],
  SUPER_ADMIN: ['*'],
};
