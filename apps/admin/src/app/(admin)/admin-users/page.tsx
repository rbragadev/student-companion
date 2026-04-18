import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { AdminUser } from '@/types/auth.types';
import type { Column } from '@/components/ui/data-table';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
};

const columns: Column<AdminUser>[] = [
  {
    key: 'name',
    label: 'Nome',
    render: (u) => (
      <div>
        <p className="font-medium text-slate-900">{u.firstName} {u.lastName}</p>
        <p className="text-xs text-slate-500">{u.email}</p>
      </div>
    ),
  },
  {
    key: 'role',
    label: 'Role',
    render: (u) => (
      <Badge variant={u.role === 'SUPER_ADMIN' ? 'primary' : 'default'}>
        {ROLE_LABEL[u.role] ?? u.role}
      </Badge>
    ),
  },
  {
    key: 'profiles',
    label: 'Perfis',
    render: (u) => (
      <div className="flex flex-wrap gap-1">
        {u.adminProfiles.length === 0
          ? <span className="text-xs text-slate-400">Sem perfil</span>
          : u.adminProfiles.map(({ profile }) => (
            <Badge key={profile.id} variant="success">{profile.label}</Badge>
          ))
        }
      </div>
    ),
  },
];

export default async function AdminUsersPage() {
  const session = await requirePermission('users.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('users.write');

  let users: AdminUser[] = [];
  try {
    users = await apiFetch<AdminUser[]>('/users/admin');
  } catch {
    // exibido via EmptyState abaixo
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuários Administrativos"
        description="Gerencie administradores e seus perfis de acesso"
        actions={canWrite ? (
          <Link href="/admin-users/new">
            <Button size="sm">
              <Plus size={14} />
              Novo usuário
            </Button>
          </Link>
        ) : undefined}
      />
      <DataTable<AdminUser>
        columns={columns}
        data={users}
        keyExtractor={(u) => u.id}
        getRowHref={(u) => `/admin-users/${u.id}`}
        emptyTitle="Nenhum usuário administrativo encontrado"
        emptyDescription="Assim que houver usuários com role ADMIN/SUPER_ADMIN, eles aparecerão aqui."
      />
    </div>
  );
}
