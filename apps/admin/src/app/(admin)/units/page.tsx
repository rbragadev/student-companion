import Link from 'next/link';
import { Building, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { Unit } from '@/types/structure.types';

const columns: Column<Unit>[] = [
  {
    key: 'name',
    label: 'Unidade',
    render: (item) => (
      <div>
        <p className="font-medium text-slate-900">{item.name}</p>
        <p className="text-xs text-slate-500">{item.code}</p>
      </div>
    ),
  },
  {
    key: 'institution',
    label: 'Instituição',
    render: (item) => item.institution?.name ?? '-',
  },
  {
    key: 'classes',
    label: 'Turmas',
    render: (item) => String(item._count?.classes ?? 0),
  },
  {
    key: 'location',
    label: 'Localização',
    render: (item) => [item.city, item.state, item.country].filter(Boolean).join(' • ') || '-',
  },
];

export default async function UnitsPage() {
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');

  const units = await apiFetch<Unit[]>('/unit').catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Unidades"
        description="Gerencie unidades vinculadas às instituições"
        actions={canWrite ? (
          <Link href="/units/new"><Button size="sm"><Plus size={14} />Nova unidade</Button></Link>
        ) : undefined}
      />

      <DataTable<Unit>
        columns={columns}
        data={units}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/units/${item.id}`}
        emptyTitle="Nenhuma unidade cadastrada"
        emptyDescription="Crie unidades para organizar turmas por instituição."
        emptyAction={canWrite ? (
          <Link href="/units/new"><Button size="sm"><Building size={14} />Criar unidade</Button></Link>
        ) : undefined}
      />
    </div>
  );
}
