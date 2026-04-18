import Link from 'next/link';
import { CalendarDays, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { RECORD_STATUS_LABEL } from '@/lib/structure';
import type { AcademicPeriod } from '@/types/structure.types';

const columns: Column<AcademicPeriod>[] = [
  {
    key: 'name',
    label: 'Período',
    render: (item) => (
      <div>
        <p className="font-medium text-slate-900">{item.name}</p>
        <p className="text-xs text-slate-500">
          {new Date(item.startDate).toLocaleDateString('pt-BR')} - {new Date(item.endDate).toLocaleDateString('pt-BR')}
        </p>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: (item) => (
      <Badge variant={item.status === 'ACTIVE' ? 'success' : item.status === 'INACTIVE' ? 'warning' : 'default'}>
        {RECORD_STATUS_LABEL[item.status]}
      </Badge>
    ),
  },
  {
    key: 'classes',
    label: 'Turmas',
    render: (item) => String(item._count?.classes ?? 0),
  },
];

export default async function AcademicPeriodsPage() {
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');

  const periods = await apiFetch<AcademicPeriod[]>('/academic-period').catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Períodos Letivos"
        description="Gerencie os períodos usados pelas turmas"
        actions={canWrite ? <Link href="/academic-periods/new"><Button size="sm"><Plus size={14} />Novo período</Button></Link> : undefined}
      />

      <DataTable<AcademicPeriod>
        columns={columns}
        data={periods}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/academic-periods/${item.id}`}
        emptyTitle="Nenhum período letivo cadastrado"
        emptyDescription="Cadastre períodos para organizar a oferta de turmas."
        emptyAction={canWrite ? <Link href="/academic-periods/new"><Button size="sm"><CalendarDays size={14} />Criar período</Button></Link> : undefined}
      />
    </div>
  );
}
