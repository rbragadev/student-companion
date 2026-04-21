import Link from 'next/link';
import { DataTable, type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type {
  CourseAdmin,
  InstitutionAdmin,
  SchoolAdmin,
  SalesRowAdmin,
  } from '@/types/catalog.types';

function money(amount: number, currency: string) {
  return `${Number(amount ?? 0).toFixed(2)} ${currency}`;
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FinanceSalesPage({ searchParams }: Readonly<PageProps>) {
  await requirePermission('users.read');

  const params = (await searchParams) ?? {};
  const institutionId = pickParam(params.institutionId) ?? '';
  const schoolId = pickParam(params.schoolId) ?? '';
  const courseId = pickParam(params.courseId) ?? '';
  const status = pickParam(params.status) ?? '';
  const hasAccommodation = pickParam(params.hasAccommodation) ?? '';

  const query = new URLSearchParams();
  if (institutionId) query.set('institutionId', institutionId);
  if (schoolId) query.set('schoolId', schoolId);
  if (courseId) query.set('courseId', courseId);
  if (status) query.set('status', status);
  if (hasAccommodation) query.set('hasAccommodation', hasAccommodation);

  const [sales, institutions, schools, courses] = await Promise.all([
    apiFetch<SalesRowAdmin[]>(`/sales${query.toString() ? `?${query.toString()}` : ''}`).catch(() => []),
    apiFetch<InstitutionAdmin[]>('/institution').catch(() => []),
    apiFetch<SchoolAdmin[]>('/school').catch(() => []),
    apiFetch<CourseAdmin[]>('/course').catch(() => []),
  ]);

  const columns: Column<SalesRowAdmin>[] = [
    {
      key: 'student',
      label: 'Aluno',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">
            {row.student ? `${row.student.firstName} ${row.student.lastName}` : 'Sem aluno vinculado'}
          </p>
          <p className="text-xs text-slate-500">{row.student?.email ?? '-'}</p>
        </div>
      ),
    },
    {
      key: 'context',
      label: 'Contexto',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.course?.program_name ?? 'Item financeiro'}</p>
          <p className="text-xs font-medium text-slate-500">
            Item: {row.itemType ?? 'item'}{row.itemTitle ? ` • ${row.itemTitle}` : ''}
          </p>
          <p className="text-xs text-slate-500">
            {row.institution?.name ?? 'Sem instituição'} {'>'} {row.school?.name ?? 'Sem escola'}
          </p>
          <p className="text-xs text-slate-500">{row.accommodation?.title ?? 'Sem acomodação'}</p>
        </div>
      ),
    },
    {
      key: 'totals',
      label: 'Composição',
      render: (row) => (
        <div>
          <p className="text-sm text-slate-700">Total: {money(row.totalAmount, row.currency)}</p>
          <p className="text-xs text-slate-500">Item curso: {money(row.courseAmount ?? 0, row.currency)}</p>
          <p className="text-xs text-slate-500">Item acomodação: {money(row.accommodationAmount ?? 0, row.currency)}</p>
          <p className="text-xs text-slate-500">Emissão: {money(row.downPaymentAmount, row.currency)}</p>
          <p className="text-xs text-slate-500">Transações: {row.transactionsCount ?? 0}</p>
          <p className="text-xs text-slate-500">Saldo: {money(row.remainingAmount, row.currency)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <div>
          <p className="text-sm text-slate-700">Comercial: {row.commercialStatus}</p>
          <p className="text-xs text-slate-500">Financeiro: {row.financialStatus}</p>
        </div>
      ),
    },
    {
      key: 'invoice',
      label: 'Vínculo',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {row.enrollmentId
            ? `Matrícula: ${row.enrollmentId.slice(0, 8)}`
            : 'Sem vínculo de matrícula'}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vendas / Itens"
        description="Acompanhe cada item financeiro (curso ou acomodação), com emissão, pagamento e saldo."
        actions={
          <Link href="/accommodation-operations">
            <Button size="sm" variant="outline">
              + Operação de venda de acomodação
            </Button>
          </Link>
        }
      />

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-5">
        <select name="institutionId" defaultValue={institutionId} className="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="">Instituição</option>
          {institutions.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <select name="schoolId" defaultValue={schoolId} className="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="">Escola</option>
          {schools.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <select name="courseId" defaultValue={courseId} className="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="">Curso</option>
          {courses.map((item) => (
            <option key={item.id} value={item.id}>{item.program_name}</option>
          ))}
        </select>
        <select name="status" defaultValue={status} className="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="">Status comercial</option>
          <option value="draft">draft</option>
          <option value="started">started</option>
          <option value="awaiting_school_approval">awaiting_school_approval</option>
          <option value="approved">approved</option>
          <option value="checkout_available">checkout_available</option>
          <option value="payment_pending">payment_pending</option>
          <option value="partially_paid">partially_paid</option>
          <option value="paid">paid</option>
          <option value="confirmed">confirmed</option>
          <option value="enrolled">enrolled</option>
          <option value="expired">expired</option>
          <option value="cancelled">cancelled</option>
          <option value="rejected">rejected</option>
        </select>
        <select name="hasAccommodation" defaultValue={hasAccommodation} className="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="">Com/sem acomodação</option>
          <option value="with">Com acomodação</option>
          <option value="without">Sem acomodação</option>
        </select>
        <button className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Filtrar</button>
      </form>

      <DataTable<SalesRowAdmin>
        columns={columns}
        data={sales}
        keyExtractor={(row) => row.id}
        getRowHref={(row) => `/finance/sales-items/${row.id}`}
        emptyTitle="Nenhuma venda encontrada"
        emptyDescription="Ajuste os filtros ou inicie uma venda pela operação de acomodação/curso."
      />
    </div>
  );
}
