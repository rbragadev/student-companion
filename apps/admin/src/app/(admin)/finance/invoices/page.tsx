import { DataTable, type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { InstitutionAdmin, InvoiceAdmin } from '@/types/catalog.types';
import { createInvoiceAction, updateInvoiceStatusAction } from './actions';

function money(amount: number, currency: string) {
  return `${Number(amount ?? 0).toFixed(2)} ${currency}`;
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FinanceInvoicesPage({ searchParams }: Readonly<PageProps>) {
  await requirePermission('users.read');

  const params = (await searchParams) ?? {};
  const status = pickParam(params.status) ?? '';
  const institutionId = pickParam(params.institutionId) ?? '';

  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (institutionId) query.set('institutionId', institutionId);

  const [invoices, institutions] = await Promise.all([
    apiFetch<InvoiceAdmin[]>(`/invoices${query.toString() ? `?${query.toString()}` : ''}`).catch(() => []),
    apiFetch<InstitutionAdmin[]>('/institution').catch(() => []),
  ]);

  const columns: Column<InvoiceAdmin>[] = [
    {
      key: 'number',
      label: 'Invoice',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.number}</p>
          <p className="text-xs text-slate-500">Vencimento: {new Date(row.dueDate).toLocaleDateString('pt-BR')}</p>
        </div>
      ),
    },
    {
      key: 'student',
      label: 'Aluno',
      render: (row) =>
        row.enrollment?.student ? (
          <div>
            <p className="font-medium text-slate-900">
              {row.enrollment.student.firstName} {row.enrollment.student.lastName}
            </p>
            <p className="text-xs text-slate-500">{row.enrollment.student.email}</p>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Sem aluno vinculado</span>
        ),
    },
    {
      key: 'context',
      label: 'Contexto',
      render: (row) => (
        <div>
          {row.enrollment ? (
            <>
              <p className="text-sm text-slate-700">{row.enrollment.institution.name}</p>
              <p className="text-xs text-slate-500">
                {row.enrollment.school.name} {'>'} {row.enrollment.course.program_name}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-700">
                {row.enrollmentQuote?.type === 'accommodation_only'
                  ? 'Standalone accommodation'
                  : 'Quote sem matrícula'}
              </p>
              <p className="text-xs text-slate-500">
                {row.enrollmentQuote?.accommodationPricing?.accommodation?.title ??
                  row.enrollmentQuote?.coursePricing?.course?.program_name ??
                  '-'}
              </p>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Total',
      render: (row) => money(row.totalAmount, row.currency),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <form action={updateInvoiceStatusAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={row.id} />
          <select
            name="status"
            defaultValue={row.status}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            <option value="draft">draft</option>
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="overdue">overdue</option>
            <option value="cancelled">cancelled</option>
          </select>
          <button className="rounded border border-slate-300 px-2 py-1 text-xs">Salvar</button>
        </form>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Invoices"
        description="Gestão de faturamento por pacote (curso e/ou acomodação)."
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Gerar invoice</h2>
        <p className="mt-1 text-xs text-slate-500">Você pode gerar por matrícula (`enrollmentId`) ou por quote (`enrollmentQuoteId`).</p>
        <form action={createInvoiceAction} className="mt-4 grid gap-3 md:grid-cols-5">
          <input
            name="enrollmentId"
            placeholder="enrollmentId"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="enrollmentQuoteId"
            placeholder="enrollmentQuoteId"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="dueDate"
            type="date"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <select name="status" defaultValue="pending" className="rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="pending">pending</option>
            <option value="draft">draft</option>
          </select>
          <button className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Gerar invoice</button>
        </form>
      </section>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <select name="institutionId" defaultValue={institutionId} className="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="">Instituição</option>
          {institutions.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={status} className="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="">Status</option>
          <option value="draft">draft</option>
          <option value="pending">pending</option>
          <option value="paid">paid</option>
          <option value="overdue">overdue</option>
          <option value="cancelled">cancelled</option>
        </select>
        <button className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Filtrar</button>
      </form>

      <DataTable<InvoiceAdmin>
        columns={columns}
        data={invoices}
        keyExtractor={(row) => row.id}
        emptyTitle="Nenhuma invoice encontrada"
        emptyDescription="Gere invoices para acompanhar recebíveis e vencimentos."
      />
    </div>
  );
}
