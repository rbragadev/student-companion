export type NavIconName =
  | 'LayoutDashboard'
  | 'University'
  | 'Building'
  | 'CalendarDays'
  | 'Network'
  | 'GraduationCap'
  | 'Building2'
  | 'BookOpen'
  | 'Home'
  | 'MapPin'
  | 'Users'
  | 'UserCog'
  | 'Shield'
  | 'KeyRound'
  | 'FileBadge2'
  | 'BadgeCheck'
  | 'CircleDollarSign'
  | 'Wallet';

export type NavDependency = 'institutions' | 'schools' | 'units' | 'courses' | 'classes' | 'periods';

export interface NavItem {
  label: string;
  href: string;
  icon: NavIconName;
  permission: string | null;
  dependsOn?: NavDependency[];
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navigationGroups: NavGroup[] = [
  {
    title: 'Geral',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', permission: null },
    ],
  },
  {
    title: 'Configuração Acadêmica',
    items: [
      { label: 'Instituições', href: '/institutions', icon: 'University', permission: 'structure.read' },
      {
        label: 'Escolas (Catálogo App)',
        href: '/schools',
        icon: 'Building2',
        permission: 'structure.read',
        dependsOn: ['institutions'],
      },
      {
        label: 'Unidades',
        href: '/units',
        icon: 'Building',
        permission: 'structure.read',
        dependsOn: ['schools'],
      },
      {
        label: 'Cursos',
        href: '/courses',
        icon: 'BookOpen',
        permission: 'structure.read',
        dependsOn: ['units'],
      },
      {
        label: 'Turmas',
        href: '/class-groups',
        icon: 'GraduationCap',
        permission: 'structure.read',
        dependsOn: ['courses'],
      },
      {
        label: 'Períodos da Turma',
        href: '/academic-periods',
        icon: 'CalendarDays',
        permission: 'structure.read',
        dependsOn: ['classes'],
      },
      {
        label: 'Estrutura Acadêmica',
        href: '/academic-structure',
        icon: 'Network',
        permission: 'structure.read',
      },
    ],
  },
  {
    title: 'Estrutura Física',
    items: [
      { label: 'Acomodações', href: '/accommodations', icon: 'Home', permission: 'structure.read' },
      { label: 'Lugares', href: '/places', icon: 'MapPin', permission: 'structure.read' },
    ],
  },
  {
    title: 'Pessoas e Acesso',
    items: [
      { label: 'Alunos', href: '/students', icon: 'Users', permission: 'users.read' },
      { label: 'Intenções de Matrícula', href: '/enrollment-intents', icon: 'FileBadge2', permission: 'users.read' },
      { label: 'Matrículas', href: '/enrollments', icon: 'BadgeCheck', permission: 'users.read' },
      { label: 'Fechamento Acomodação', href: '/accommodation-operations', icon: 'Home', permission: 'users.read' },
      { label: 'Comissões', href: '/commission-config', icon: 'CircleDollarSign', permission: 'users.read' },
      { label: 'Financeiro', href: '/financial-overview', icon: 'Wallet', permission: 'users.read' },
      { label: 'Usuários Admin', href: '/admin-users', icon: 'UserCog', permission: 'users.read' },
      { label: 'Perfis', href: '/profiles', icon: 'Shield', permission: 'roles.read' },
      { label: 'Permissões', href: '/permissions', icon: 'KeyRound', permission: 'permissions.read' },
    ],
  },
];
