import { KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { formatDatePtBr } from '@/lib/date';
import type { Permission } from '@/types/auth.types';

const columns: Column<Permission>[] = [
  {
    key: 'key',
    label: 'Permissão',
    render: (permission) => <code className="text-xs text-slate-800">{permission.key}</code>,
  },
  {
    key: 'description',
    label: 'Descrição',
  },
  {
    key: 'createdAt',
    label: 'Criada em',
    render: (permission) => formatDatePtBr(permission.createdAt),
  },
];

export default async function PermissionsPage() {
  await requirePermission('permissions.read');
  const permissions = await apiFetch<Permission[]>('/permission').catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Permissões"
        description="Catálogo de permissões disponíveis para composição de perfis"
        actions={<KeyRound size={18} className="text-slate-400" />}
      />

      <DataTable<Permission>
        columns={columns}
        data={permissions}
        keyExtractor={(permission) => permission.id}
        emptyTitle="Nenhuma permissão cadastrada"
        emptyDescription="Execute o seed para carregar permissões iniciais."
      />
    </div>
  );
}
