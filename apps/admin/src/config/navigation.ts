export type NavIconName =
  | 'LayoutDashboard'
  | 'Building2'
  | 'BookOpen'
  | 'Home'
  | 'MapPin'
  | 'Users'
  | 'UserCog'
  | 'Shield'
  | 'KeyRound';

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconName;
  permission: string | null;
}

export const navigation: NavItem[] = [
  { label: 'Dashboard',       href: '/dashboard',    icon: 'LayoutDashboard', permission: null },
  { label: 'Escolas',         href: '/schools',      icon: 'Building2',       permission: null },
  { label: 'Cursos',          href: '/courses',      icon: 'BookOpen',        permission: null },
  { label: 'Acomodações',     href: '/accommodations', icon: 'Home',          permission: null },
  { label: 'Lugares',         href: '/places',       icon: 'MapPin',          permission: null },
  { label: 'Alunos',          href: '/students',     icon: 'Users',           permission: null },
  { label: 'Usuários Admin',  href: '/admin-users',  icon: 'UserCog',         permission: 'users.read' },
  { label: 'Perfis',          href: '/profiles',     icon: 'Shield',          permission: 'roles.read' },
  { label: 'Permissões',      href: '/permissions',  icon: 'KeyRound',        permission: 'permissions.read' },
];
