import Link from 'next/link';
import { GraduationCap, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { RECORD_STATUS_LABEL, SHIFT_LABEL } from '@/lib/structure';
import type { ClassGroup } from '@/types/structure.types';

const columns: Column<ClassGroup>[] = [
  {
    key: 'name',
    label: 'Turma',
    render: (item) => (
      <div>
        <p className="font-medium text-slate-900">{item.name}</p>
        <p className="text-xs text-slate-500">{item.code}</p>
      </div>
    ),
  },
  {
    key: 'course',
    label: 'Curso',
    render: (item) => item.course?.program_name ?? '-',
  },
  {
    key: 'chain',
    label: 'Cadeia',
    render: (item) =>
      `${item.course?.unit?.school?.institution?.name ?? '-'} > ${item.course?.unit?.school?.name ?? '-'} > ${item.course?.unit?.name ?? '-'}`,
  },
  {
    key: 'periods',
    label: 'Períodos',
    render: (item) => String(item._count?.periods ?? item.periods?.length ?? 0),
  },
  {
    key: 'shift',
    label: 'Turno',
    render: (item) => SHIFT_LABEL[item.shift],
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
];

export default async function ClassGroupsPage() {
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');

  const classes = await apiFetch<ClassGroup[]>('/class-group').catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Turmas"
        description="Gerencie turmas vinculadas a cursos"
        actions={canWrite ? <Link href="/class-groups/new"><Button size="sm"><Plus size={14} />Nova turma</Button></Link> : undefined}
      />

      <DataTable<ClassGroup>
        columns={columns}
        data={classes}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/class-groups/${item.id}`}
        emptyTitle="Nenhuma turma cadastrada"
        emptyDescription="Crie turmas para organizar cursos e seus períodos."
        emptyAction={canWrite ? <Link href="/class-groups/new"><Button size="sm"><GraduationCap size={14} />Criar turma</Button></Link> : undefined}
      />
    </div>
  );
}
