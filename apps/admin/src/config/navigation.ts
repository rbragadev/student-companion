export type NavIconName =
  | 'LayoutDashboard'
  | 'University'
  | 'Building'
  | 'CalendarDays'
  | 'GraduationCap'
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
  { label: 'Dashboard',         href: '/dashboard',      icon: 'LayoutDashboard', permission: null },
  { label: 'Instituições',      href: '/institutions',   icon: 'University',      permission: 'structure.read' },
  { label: 'Unidades',          href: '/units',          icon: 'Building',        permission: 'structure.read' },
  { label: 'Períodos Letivos',  href: '/academic-periods', icon: 'CalendarDays',  permission: 'structure.read' },
  { label: 'Turmas',            href: '/class-groups',   icon: 'GraduationCap',   permission: 'structure.read' },
  { label: 'Escolas',           href: '/schools',        icon: 'Building2',       permission: null },
  { label: 'Cursos',            href: '/courses',        icon: 'BookOpen',        permission: null },
  { label: 'Acomodações',       href: '/accommodations', icon: 'Home',            permission: null },
  { label: 'Lugares',           href: '/places',         icon: 'MapPin',          permission: null },
  { label: 'Alunos',            href: '/students',       icon: 'Users',           permission: null },
  { label: 'Usuários Admin',    href: '/admin-users',    icon: 'UserCog',         permission: 'users.read' },
  { label: 'Perfis',            href: '/profiles',       icon: 'Shield',          permission: 'roles.read' },
  { label: 'Permissões',        href: '/permissions',    icon: 'KeyRound',        permission: 'permissions.read' },
];
