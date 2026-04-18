import Link from 'next/link';
import { Shield, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { AdminProfile } from '@/types/auth.types';

const columns: Column<AdminProfile>[] = [
  {
    key: 'label',
    label: 'Perfil',
    render: (profile) => (
      <div>
        <p className="font-medium text-slate-900">{profile.label}</p>
        <p className="text-xs text-slate-500">{profile.name}</p>
      </div>
    ),
  },
  {
    key: 'type',
    label: 'Tipo',
    render: (profile) => (
      <Badge variant={profile.isSystem ? 'warning' : 'default'}>
        {profile.isSystem ? 'Sistema' : 'Custom'}
      </Badge>
    ),
  },
  {
    key: 'permissions',
    label: 'Permissões',
    render: (profile) => String(profile._count?.permissions ?? 0),
  },
  {
    key: 'users',
    label: 'Usuários',
    render: (profile) => String(profile._count?.users ?? 0),
  },
];

export default async function ProfilesPage() {
  const session = await requirePermission('roles.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('roles.write');
  const profiles = await apiFetch<AdminProfile[]>('/admin-profile').catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Perfis de Acesso"
        description="Gerencie os perfis administrativos e suas permissões"
        actions={canWrite ? (
          <Link href="/profiles/new">
            <Button size="sm">
              <Plus size={14} />
              Novo perfil
            </Button>
          </Link>
        ) : undefined}
      />

      <DataTable<AdminProfile>
        columns={columns}
        data={profiles}
        keyExtractor={(profile) => profile.id}
        getRowHref={(profile) => `/profiles/${profile.id}`}
        emptyTitle="Nenhum perfil encontrado"
        emptyDescription="Crie um perfil para iniciar a gestão de permissões."
        emptyAction={canWrite ? (
          <Link href="/profiles/new">
            <Button size="sm">
              <Shield size={14} />
              Criar primeiro perfil
            </Button>
          </Link>
        ) : undefined}
      />
    </div>
  );
}
