import Link from 'next/link';
import { DataTable, type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { formatDatePtBr, toDateInputValue, normalizeToDate } from '@/lib/date';
import type { EnrollmentAdmin } from '@/types/catalog.types';

function money(amount?: number, currency?: string) {
  return `${Number(amount ?? 0).toFixed(2)} ${currency ?? 'CAD'}`;
}

export default async function CourseOperationsPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<{
    error?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    accommodation?: string;
  }>;
}>) {
  await requirePermission('users.read');

  const params = (await searchParams) ?? {};
  const selectedStatus = params.status ?? '';
  const fromDate = params.fromDate ?? '';
  const toDate = params.toDate ?? '';
  const accommodationFilter = params.accommodation ?? 'all';

  const enrollments = await apiFetch<EnrollmentAdmin[]>('/enrollments').catch(() => []);

  const filtered = enrollments.filter((enrollment) => {
    const isStatusMatch = !selectedStatus || enrollment.status === selectedStatus;
    const academicStart = normalizeToDate(enrollment.academicPeriod?.startDate);
    const academicEnd = normalizeToDate(enrollment.academicPeriod?.endDate);
    const from = normalizeToDate(toDateInputValue(fromDate));
    const to = normalizeToDate(toDateInputValue(toDate));
    const isFromDateMatch = !from || (academicStart && academicStart >= from);
    const isToDateMatch = !to || (academicEnd && academicEnd <= to);
    const isAccommodationMatch =
      accommodationFilter === 'all' ||
      (accommodationFilter === 'with' ? Boolean(enrollment.accommodation) : !enrollment.accommodation);
    return isStatusMatch && isFromDateMatch && isToDateMatch && isAccommodationMatch;
  });

  const columns: Column<EnrollmentAdmin>[] = [
    {
      key: 'student',
      label: 'Aluno',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">
            {row.student?.firstName} {row.student?.lastName}
          </p>
          <p className="text-xs text-slate-500">{row.student?.email}</p>
        </div>
      ),
    },
    {
      key: 'course',
      label: 'Curso',
      render: (row) => (
        <p className="text-sm text-slate-700">{row.course?.program_name ?? 'Sem curso vinculado'}</p>
      ),
    },
    {
      key: 'window',
      label: 'Janela do curso',
      render: (row) => (
        <p className="text-xs text-slate-600">
          {formatDatePtBr(row.academicPeriod?.startDate)} - {formatDatePtBr(row.academicPeriod?.endDate)}
        </p>
      ),
    },
    {
      key: 'courseValue',
      label: 'Valor do curso',
      render: (row) => (
        <div>
          <p className="text-sm text-slate-700">
            {money(
              Number(row.pricing?.enrollmentAmount ?? row.pricing?.totalAmount ?? 0),
              row.pricing?.currency,
            )}
          </p>
          <p className="text-xs text-slate-500">Total do pacote: {money(row.pricing?.packageTotalAmount, row.pricing?.currency)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <p className="text-sm text-slate-700">{row.status}</p>,
    },
    {
      key: 'accommodation',
      label: 'Acomodação',
      render: (row) => row.accommodation?.title ?? 'Sem acomodação',
    },
    {
      key: 'order',
      label: 'Matrícula',
      render: (row) => (
        <Link href={`/enrollments/${row.id}`} className="text-xs text-blue-600 hover:underline">
          Abrir matrícula
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Curso"
        description="Visão dos itens de curso já criados como matrículas. Use esta aba para consultar curso e vínculo com matrícula."
      />
      {params.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {decodeURIComponent(params.error)}
        </div>
      ) : null}

      <form method="get" className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span className="text-slate-600">Status</span>
          <input
            name="status"
            defaultValue={selectedStatus}
            placeholder="submitted"
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-600">De</span>
          <input
            name="fromDate"
            type="date"
            defaultValue={fromDate}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-600">Até</span>
          <input
            name="toDate"
            type="date"
            defaultValue={toDate}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-600">Tipo</span>
          <select name="accommodation" defaultValue={accommodationFilter} className="h-10 w-full rounded border border-slate-200 px-3 text-sm">
            <option value="all">Todos (com/s sem acomodação)</option>
            <option value="with">Somente curso + acomodação</option>
            <option value="without">Somente curso</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white sm:col-span-4 sm:w-40"
        >
          Filtrar
        </button>
      </form>

      <DataTable<EnrollmentAdmin>
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/enrollments/${item.id}`}
        emptyTitle="Nenhuma operação de curso encontrada"
        emptyDescription="A lista mostra matrículas em andamento/encerramento como itens de curso."
      />
    </div>
  );
}
