import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { formatDatePtBr, formatDateTimePtBr } from '@/lib/date';
import { updateFinanceTransactionStatusAction, createFinanceTransactionAction } from '../../../enrollments/actions';
import FinanceItemTransactionForm from '../../../enrollments/finance-item-transaction-form';
import type { FinanceItemDetailAdmin } from '@/types/catalog.types';

function money(value: number, currency: string) {
  return `${Number(value ?? 0).toFixed(2)} ${currency}`;
}

function toneByStatus(status?: string | null) {
  const value = String(status ?? '').toLowerCase();
  if (value.includes('paid') || value.includes('confirmed') || value === 'closed') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (value.includes('wait') || value.includes('pending') || value.includes('started') || value.includes('approved')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (value.includes('cancel') || value.includes('rejected') || value.includes('expired')) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export default async function FinanceSalesItemPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  await requirePermission('users.read');
  const { id } = await params;
  const item = await apiFetch<FinanceItemDetailAdmin>(`/finance-items/${id}`).catch(() => null);

  if (!item) notFound();

  const itemCurrency = item.currency || 'CAD';
  const paymentCoverage = item.amount > 0 ? Number(((item.paidAmount / item.amount) * 100).toFixed(2)) : 0;
  const remainingBefore = item.remainingAmount;
  const returnTo = `/finance/sales-items/${item.id}`;
  const transactionStatuses: Array<'pending' | 'paid' | 'failed' | 'cancelled'> = [
    'pending',
    'paid',
    'failed',
    'cancelled',
  ];

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: 'Financeiro', href: '/finance' },
          { label: 'Vendas / Itens', href: '/finance/sales' },
          { label: item.enrollment.course.program_name },
        ]}
      />
      <PageHeader
        title="Item financeiro"
        description="Gerenciamento financeiro por item (curso ou acomodação), separado da operação da matrícula."
        actions={
          <Link href={`/finance/sales`}>
            <Button size="sm" variant="outline">
              <ArrowLeft size={14} />
              Voltar
            </Button>
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Contexto do item
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-700">
            Tipo: {item.itemType} • status cadastro: {item.sourceType}
          </p>
          <p className="mt-2 text-xs text-slate-600">Referência: {item.referenceId}</p>
          <p className="mt-1 text-xs text-slate-500">
            Período:{' '}
            {item.startDate && item.endDate ? `${formatDatePtBr(item.startDate)} - ${formatDatePtBr(item.endDate)}` : 'Sem período'}
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Financeiro do item</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">
            Total {money(item.amount, itemCurrency)}
          </p>
          <p className="mt-1 text-xs text-slate-700">Pago: {money(item.paidAmount, itemCurrency)}</p>
          <p className="text-xs text-slate-700">Pendente: {money(item.pendingAmount, itemCurrency)}</p>
          <p className="text-xs text-slate-700">Restante: {money(item.remainingAmount, itemCurrency)}</p>
          <p className="mt-2 text-xs text-slate-500">Emitido: {money(item.paidAmount + item.pendingAmount, itemCurrency)}</p>
          <p className="text-xs text-slate-500">Coberto: {paymentCoverage.toFixed(2)}%</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Vínculo da matrícula</p>
          <p className="mt-2 text-sm text-slate-900">
            {item.enrollment.student.firstName} {item.enrollment.student.lastName}
          </p>
          <p className="text-xs text-slate-500">{item.enrollment.student.email}</p>
          <p className="mt-1 text-xs text-slate-500">{item.enrollment.institution.name}</p>
          <p className="text-xs text-slate-500">
            {item.enrollment.school.name} • {item.enrollment.course.program_name}
          </p>
          <p
            className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${toneByStatus(item.enrollment.status)}`}
          >
            {item.enrollment.status}
          </p>
          <Link
            href={`/enrollments/${item.enrollment.id}`}
            className="mt-3 inline-block text-xs text-blue-600 hover:underline"
          >
            Abrir matrícula
          </Link>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Transações</h2>
          <p className="mt-1 text-xs text-slate-500">
            Emita e confirme parcelas por item. Elas serão tratadas como pagamento desse item apenas.
          </p>
          <div className="mt-3 space-y-2">
            {(item.transactions ?? []).length === 0 && (
              <p className="text-xs text-slate-500">Sem transações para este item.</p>
            )}
            {(item.transactions ?? []).map((transaction) => (
              <div
                key={transaction.id}
                className="rounded border border-slate-200 bg-white p-2 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-slate-700">
                    {transaction.type} • {transaction.status} • {money(transaction.amount, itemCurrency)}
                    {transaction.dueDate ? ` • venc ${formatDatePtBr(transaction.dueDate)}` : ''}
                    {transaction.paidAt ? ` • pago ${formatDateTimePtBr(transaction.paidAt)}` : ''}
                  </p>
                  <form action={updateFinanceTransactionStatusAction} className="flex items-center gap-1">
                    <input type="hidden" name="enrollmentId" value={item.enrollment.id} />
                    <input type="hidden" name="transactionId" value={transaction.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <select
                      name="status"
                      defaultValue={transaction.status}
                      className="h-8 rounded border border-slate-300 px-2 text-xs"
                    >
                      {transactionStatuses
                        .filter((status) => status !== transaction.status)
                        .map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                    </select>
                    <Button size="sm" type="submit">
                      Atualizar
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Nova emissão (item)</h2>
          {remainingBefore <= 0 ? (
            <p className="mt-1 text-xs text-emerald-700">Item concluído: sem valor pendente de emissão.</p>
          ) : (
            <FinanceItemTransactionForm
              enrollmentId={item.enrollment.id}
              financeItemId={item.id}
              totalAmount={Number(item.amount)}
              emittedAmount={Number(item.paidAmount) + Number(item.pendingAmount)}
              remainingAmount={remainingBefore}
              currency={itemCurrency}
              returnTo={returnTo}
              action={createFinanceTransactionAction}
            />
          )}
        </article>
      </section>
    </div>
  );
}
