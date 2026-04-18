// Permissões de navegação da UI (controle de menu e rotas)
export type NavPermission =
  | 'users.read'
  | 'users.write'
  | 'roles.read'
  | 'roles.write'
  | 'permissions.read'
  | 'admin.full';
