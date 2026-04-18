import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { EnrollmentAdmin } from '@/types/catalog.types';

function num(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(amount: unknown, currency = 'CAD') {
  const value = num(amount);
  return `${value.toFixed(2)} ${currency}`;
}

export default async function FinancialOverviewPage() {
  await requirePermission('users.read');

  const enrollments = await apiFetch<EnrollmentAdmin[]>('/enrollments').catch(() => []);
  const rows = enrollments.filter((item) => item.pricing);

  const columns: Column<EnrollmentAdmin>[] = [
    {
      key: 'enrollment',
      label: 'Matrícula',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.id}</p>
          <p className="text-xs text-slate-500">{item.status}</p>
        </div>
      ),
    },
    {
      key: 'student',
      label: 'Aluno',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.student.firstName} {item.student.lastName}</p>
          <p className="text-xs text-slate-500">{item.student.email}</p>
        </div>
      ),
    },
    {
      key: 'context',
      label: 'Contexto',
      render: (item) => (
        <div>
          <p className="text-sm text-slate-700">{item.institution.name}</p>
          <p className="text-xs text-slate-500">{item.school.name} • {item.course.program_name}</p>
        </div>
      ),
    },
    {
      key: 'value',
      label: 'Valor Matrícula',
      render: (item) => formatMoney(item.pricing?.totalAmount, item.pricing?.currency),
    },
    {
      key: 'commission',
      label: 'Comissão',
      render: (item) => (
        <div>
          <p className="text-sm text-slate-700">{formatMoney(item.pricing?.commissionAmount, item.pricing?.currency)}</p>
          <p className="text-xs text-slate-500">{num(item.pricing?.commissionPercentage).toFixed(2)}%</p>
        </div>
      ),
    },
    {
      key: 'financialStatus',
      label: 'Status Financeiro',
      render: (item) => (item.status === 'enrolled' || item.status === 'active' ? 'Elegível' : 'Em processamento'),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Visão Financeira"
        description="Comissões registradas por matrícula para acompanhamento operacional."
      />

      <DataTable<EnrollmentAdmin>
        columns={columns}
        data={rows}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/enrollments/${item.id}`}
        emptyTitle="Nenhum pricing registrado"
        emptyDescription="Configure valores nas matrículas para acompanhar comissões aqui."
      />
    </div>
  );
}
