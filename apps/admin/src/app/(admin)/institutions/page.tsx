import Link from 'next/link';
import { Plus, University } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { Institution } from '@/types/structure.types';

const columns: Column<Institution>[] = [
  {
    key: 'name',
    label: 'Instituição',
    render: (item) => (
      <div>
        <p className="font-medium text-slate-900">{item.name}</p>
        <p className="text-xs text-slate-500">{item.description ?? 'Sem descrição'}</p>
      </div>
    ),
  },
  {
    key: 'schools',
    label: 'Escolas',
    render: (item) => String(item._count?.schools ?? 0),
  },
  {
    key: 'updatedAt',
    label: 'Atualizada em',
    render: (item) => new Date(item.updatedAt).toLocaleDateString('pt-BR'),
  },
];

export default async function InstitutionsPage() {
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');

  const institutions = await apiFetch<Institution[]>('/institution').catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Instituições"
        description="Escopo administrativo do cliente no SaaS"
        actions={canWrite ? (
          <Link href="/institutions/new">
            <Button size="sm"><Plus size={14} />Nova instituição</Button>
          </Link>
        ) : undefined}
      />

      <DataTable<Institution>
        columns={columns}
        data={institutions}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/institutions/${item.id}`}
        emptyTitle="Nenhuma instituição cadastrada"
        emptyDescription="Cadastre instituições para organizar escolas, unidades e turmas."
        emptyAction={canWrite ? (
          <Link href="/institutions/new">
            <Button size="sm"><University size={14} />Criar instituição</Button>
          </Link>
        ) : undefined}
      />
    </div>
  );
}
