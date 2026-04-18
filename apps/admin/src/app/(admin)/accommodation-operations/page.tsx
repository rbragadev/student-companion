import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { EnrollmentAdmin } from '@/types/catalog.types';

function money(value?: number, currency = 'CAD') {
  return `${Number(value ?? 0).toFixed(2)} ${currency}`;
}

export default async function AccommodationOperationsPage() {
  await requirePermission('users.read');

  const enrollments = await apiFetch<EnrollmentAdmin[]>(
    '/enrollments?accommodationStatus=selected',
  ).catch(() => []);
  const approved = await apiFetch<EnrollmentAdmin[]>(
    '/enrollments?accommodationStatus=approved',
  ).catch(() => []);
  const closed = await apiFetch<EnrollmentAdmin[]>(
    '/enrollments?accommodationStatus=closed',
  ).catch(() => []);

  const rows = [...enrollments, ...approved, ...closed].filter((item) => item.accommodation);

  const columns: Column<EnrollmentAdmin>[] = [
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
      key: 'accommodation',
      label: 'Acomodação',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.accommodation?.title ?? 'Sem acomodação'}</p>
          <p className="text-xs text-slate-500">{item.school.name} • {item.accommodation?.location}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status Acomodação',
      render: (item) => item.accommodationStatus,
    },
    {
      key: 'financial',
      label: 'Pacote / Comissão',
      render: (item) => (
        <div>
          <p className="text-sm text-slate-700">
            {money(Number(item.pricing?.packageTotalAmount ?? item.pricing?.totalAmount), item.pricing?.currency)}
          </p>
          <p className="text-xs text-slate-500">
            Comissão {money(Number(item.pricing?.totalCommissionAmount ?? item.pricing?.commissionAmount), item.pricing?.currency)}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fechamento de Acomodação"
        description="Operação e faturamento da acomodação no contexto da matrícula. Ao fechar no detalhe, a troca fica bloqueada."
      />

      <DataTable<EnrollmentAdmin>
        columns={columns}
        data={rows}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/enrollments/${item.id}`}
        emptyTitle="Nenhuma operação de acomodação encontrada"
        emptyDescription="Quando houver acomodação selecionada em matrícula, ela aparecerá aqui."
      />
    </div>
  );
}
