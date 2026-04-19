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
  | 'Wallet'
  | 'ShoppingCart';

export type NavDependency = 'institutions' | 'schools' | 'units' | 'courses';

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
    title: 'Configuração',
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
        label: 'Estrutura Acadêmica',
        href: '/academic-structure',
        icon: 'Network',
        permission: 'structure.read',
      },
      { label: 'Acomodações', href: '/accommodations', icon: 'Home', permission: 'structure.read' },
      { label: 'Lugares', href: '/places', icon: 'MapPin', permission: 'structure.read' },
    ],
  },
  {
    title: 'Operação',
    items: [
      { label: 'Alunos', href: '/students', icon: 'Users', permission: 'users.read' },
      { label: 'Matrículas', href: '/enrollments', icon: 'BadgeCheck', permission: 'users.read' },
      { label: 'Vendas / Orders', href: '/orders', icon: 'ShoppingCart', permission: 'users.read' },
      { label: 'Fechamento Acomodação', href: '/accommodation-operations', icon: 'Home', permission: 'users.read' },
    ],
  },
  {
    title: 'Acesso e Segurança',
    items: [
      { label: 'Usuários Admin', href: '/admin-users', icon: 'UserCog', permission: 'users.read' },
      { label: 'Perfis', href: '/profiles', icon: 'Shield', permission: 'roles.read' },
      { label: 'Permissões', href: '/permissions', icon: 'KeyRound', permission: 'permissions.read' },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { label: 'Financeiro', href: '/finance', icon: 'Wallet', permission: 'users.read' },
      { label: 'Vendas / Pacotes', href: '/finance/sales', icon: 'BadgeCheck', permission: 'users.read' },
      { label: 'Invoices', href: '/finance/invoices', icon: 'FileBadge2', permission: 'users.read' },
      { label: 'Pagamentos', href: '/finance/payments', icon: 'Wallet', permission: 'users.read' },
      { label: 'Comissões', href: '/finance/commissions', icon: 'CircleDollarSign', permission: 'users.read' },
      { label: 'Relatórios', href: '/finance/reports', icon: 'LayoutDashboard', permission: 'users.read' },
    ],
  },
];
