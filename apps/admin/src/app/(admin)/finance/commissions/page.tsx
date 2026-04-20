import Link from 'next/link';
import { DataTable, type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { CommissionEntryAdmin } from '@/types/catalog.types';

function money(amount: number, currency: string) {
  return `${Number(amount ?? 0).toFixed(2)} ${currency}`;
}

export default async function FinanceCommissionsPage() {
  await requirePermission('users.read');

  const commissions = await apiFetch<CommissionEntryAdmin[]>('/commissions').catch(() => []);

  const columns: Column<CommissionEntryAdmin>[] = [
    {
      key: 'student',
      label: 'Aluno / Matrícula',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.student.firstName} {row.student.lastName}</p>
          <p className="text-xs text-slate-500">{row.enrollmentId}</p>
        </div>
      ),
    },
    {
      key: 'context',
      label: 'Contexto',
      render: (row) => (
        <div>
          <p className="text-sm text-slate-700">{row.institution.name}</p>
          <p className="text-xs text-slate-500">{row.school.name} {'>'} {row.course.program_name}</p>
          <p className="text-xs text-slate-500">{row.accommodation?.title ?? 'Sem acomodação'}</p>
        </div>
      ),
    },
    {
      key: 'course',
      label: 'Comissão curso',
      render: (row) => money(row.commissionCourse, row.currency),
    },
    {
      key: 'accommodation',
      label: 'Comissão acomodação',
      render: (row) => money(row.commissionAccommodation, row.currency),
    },
    {
      key: 'total',
      label: 'Comissão total',
      render: (row) => (
        <div>
          <p className="text-sm text-slate-700">{money(row.commissionTotal, row.currency)}</p>
          <p className="text-xs text-slate-500">{Number(row.commissionPercentage ?? 0).toFixed(2)}%</p>
        </div>
      ),
    },
    {
      key: 'source',
      label: 'Origem',
      render: (row) => row.source,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Comissões"
        description="Comissão total e por item (curso/acomodação) para cada item vendido."
        actions={
          <Link
            href="/commission-config"
            className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white"
          >
            Configurar regras de comissão
          </Link>
        }
      />

      <DataTable<CommissionEntryAdmin>
        columns={columns}
        data={commissions}
        keyExtractor={(row) => row.enrollmentId}
        getRowHref={(row) => `/enrollments/${row.enrollmentId}`}
        emptyTitle="Sem comissões calculadas"
        emptyDescription="Gere quotes e matrículas com pricing para visualizar comissões aqui."
      />
    </div>
  );
}
