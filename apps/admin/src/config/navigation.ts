import type { Permission } from '@/types/permissions.types';

export type NavIconName =
  | 'LayoutDashboard'
  | 'Building2'
  | 'BookOpen'
  | 'Home'
  | 'MapPin'
  | 'Users'
  | 'ShieldCheck';

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconName;
  permission: Permission | null;
}

export const navigation: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', permission: null },
  { label: 'Escolas', href: '/schools', icon: 'Building2', permission: 'schools:view' },
  { label: 'Cursos', href: '/courses', icon: 'BookOpen', permission: 'courses:view' },
  { label: 'Acomodações', href: '/accommodations', icon: 'Home', permission: 'accommodations:view' },
  { label: 'Lugares', href: '/places', icon: 'MapPin', permission: 'places:view' },
  { label: 'Alunos', href: '/students', icon: 'Users', permission: 'students:view' },
  { label: 'Administradores', href: '/admins', icon: 'ShieldCheck', permission: 'admins:view' },
];
