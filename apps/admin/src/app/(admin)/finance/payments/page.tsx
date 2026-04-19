import { DataTable, type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { PaymentAdmin } from '@/types/catalog.types';
import { createPaymentAction, updatePaymentStatusAction } from './actions';

function money(amount: number, currency: string) {
  return `${Number(amount ?? 0).toFixed(2)} ${currency}`;
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FinancePaymentsPage({ searchParams }: Readonly<PageProps>) {
  await requirePermission('users.read');

  const params = (await searchParams) ?? {};
  const status = pickParam(params.status) ?? '';
  const institutionId = pickParam(params.institutionId) ?? '';

  const query = new URLSearchParams();
  if (status) query.set('status', status);
  if (institutionId) query.set('institutionId', institutionId);

  const payments = await apiFetch<PaymentAdmin[]>(`/payments${query.toString() ? `?${query.toString()}` : ''}`).catch(() => []);

  const columns: Column<PaymentAdmin>[] = [
    {
      key: 'id',
      label: 'Pagamento',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.type}</p>
          <p className="text-xs text-slate-500">{row.id}</p>
        </div>
      ),
    },
    {
      key: 'invoice',
      label: 'Invoice',
      render: (row) =>
        row.invoice ? (
          <div>
            <p className="text-sm text-slate-700">{row.invoice.number}</p>
            <p className="text-xs text-slate-500">{row.invoice.status}</p>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Sem invoice</span>
        ),
    },
    {
      key: 'context',
      label: 'Contexto',
      render: (row) => (
        <div>
          {row.enrollment ? (
            <>
              <p className="text-sm text-slate-700">
                {row.enrollment.student.firstName} {row.enrollment.student.lastName}
              </p>
              <p className="text-xs text-slate-500">{row.enrollment.institution.name}</p>
              <p className="text-xs text-slate-500">{row.enrollment.course.program_name}</p>
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
      label: 'Valor',
      render: (row) => money(row.amount, row.currency),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <form action={updatePaymentStatusAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={row.id} />
          <select
            name="status"
            defaultValue={row.status}
            className="rounded border border-slate-300 px-2 py-1 text-xs"
          >
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="failed">failed</option>
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
        title="Pagamentos"
        description="Registro manual/fake de pagamentos e atualização de status financeiro."
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Registrar pagamento</h2>
        <form action={createPaymentAction} className="mt-4 grid gap-3 md:grid-cols-4">
          <input name="invoiceId" placeholder="invoiceId" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="enrollmentId" placeholder="enrollmentId" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="enrollmentQuoteId" placeholder="enrollmentQuoteId" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <input name="amount" type="number" step="0.01" placeholder="Valor" className="rounded border border-slate-300 px-3 py-2 text-sm" required />
          <input name="currency" defaultValue="CAD" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <select name="type" defaultValue="down_payment" className="rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="down_payment">down_payment</option>
            <option value="balance">balance</option>
          </select>
          <select name="status" defaultValue="pending" className="rounded border border-slate-300 px-3 py-2 text-sm">
            <option value="pending">pending</option>
            <option value="paid">paid</option>
            <option value="failed">failed</option>
            <option value="cancelled">cancelled</option>
          </select>
          <input name="provider" defaultValue="manual" className="rounded border border-slate-300 px-3 py-2 text-sm" />
          <button className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Registrar</button>
        </form>
      </section>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <input name="institutionId" defaultValue={institutionId} placeholder="institutionId" className="rounded border border-slate-300 px-3 py-2 text-sm" />
        <select name="status" defaultValue={status} className="rounded border border-slate-300 px-3 py-2 text-sm">
          <option value="">Status</option>
          <option value="pending">pending</option>
          <option value="paid">paid</option>
          <option value="failed">failed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <button className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white">Filtrar</button>
      </form>

      <DataTable<PaymentAdmin>
        columns={columns}
        data={payments}
        keyExtractor={(row) => row.id}
        emptyTitle="Nenhum pagamento encontrado"
        emptyDescription="Registre pagamentos para refletir recebimento no fluxo financeiro."
      />
    </div>
  );
}
