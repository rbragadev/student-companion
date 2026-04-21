import Link from 'next/link';
import { ArrowLeft, UserCircle2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { formatDatePtBr, formatDateTimePtBr } from '@/lib/date';
import {
  createFinanceTransactionAction,
  updateFinanceTransactionStatusAction,
  createAccommodationOperationMessageAction,
  updateAccommodationWorkflowFromOperationAction,
  linkFinanceItemEnrollmentAction,
} from '../../enrollments/actions';
import FinanceItemTransactionForm from '../../enrollments/finance-item-transaction-form';
import type { EnrollmentAdmin, FinanceItemDetailAdmin } from '@/types/catalog.types';

const transactionStatuses: Array<'pending' | 'paid' | 'failed' | 'cancelled'> = [
  'pending',
  'paid',
  'failed',
  'cancelled',
];

const accommodationStatusOptions = ['not_selected', 'selected', 'approved', 'denied', 'closed'];

function money(value: number, currency: string) {
  return `${Number(value ?? 0).toFixed(2)} ${currency}`;
}

function toneByStatus(status?: string | null) {
  const value = String(status ?? '').toLowerCase();
  if (value.includes('paid') || value.includes('approved') || value.includes('closed')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (value.includes('selected') || value.includes('started') || value.includes('partially') || value.includes('pending')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (value.includes('denied') || value.includes('reject') || value.includes('cancel')) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

function toEnrollmentStatusLabel(value?: string | null) {
  if (!value) return 'Sem status de matrícula';
  if (value === 'not_selected') return 'Sem status';
  return value;
}

function labelAccommodationStatus(value?: string | null) {
  if (!value) return 'not_selected';
  return value;
}

function mapDate(value?: string | null) {
  if (!value) return '-';
  return formatDatePtBr(value);
}

export default async function AccommodationOperationItemPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  await requirePermission('users.read');
  const { id } = await params;

  const financeItem = await apiFetch<FinanceItemDetailAdmin>(`/finance-items/${id}`).catch(() => null);
  if (!financeItem) {
    notFound();
  }

  const returnTo = `/accommodation-operations/${financeItem.id}`;
  const [enrollments] = await Promise.all([
    apiFetch<EnrollmentAdmin[]>('/enrollments').catch(() => []),
  ]);

  const enrollment = financeItem.enrollment
    ? await apiFetch<EnrollmentAdmin>(`/enrollments/${financeItem.enrollment.id}`).catch(() => null)
    : null;

  const itemCurrency = financeItem.currency || 'CAD';
  const emittedAmount = financeItem.paidAmount + financeItem.pendingAmount;
  const remainingAmount = Number((Number(financeItem.amount) - Number(financeItem.paidAmount)).toFixed(2));
  const accommodationMessages =
    (enrollment?.messages ?? []).filter((message) => (message.channel ?? 'enrollment') === 'accommodation');

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: 'Operação', href: '/accommodation-operations' },
          { label: 'Acomodação', href: '/accommodation-operations' },
          { label: financeItem.itemType },
        ]}
      />
      <PageHeader
        title="Operação de venda de acomodação"
        description="Gerencie item de acomodação, emissão de parcelas e status operacional."
        actions={
          <Link href="/accommodation-operations">
            <Button size="sm" variant="outline">
              <ArrowLeft size={14} />
              Voltar
            </Button>
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Item</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{financeItem.title}</p>
          <p className="text-xs text-slate-500">Tipo: {financeItem.itemType}</p>
          <p className="text-xs text-slate-500">Origem: {financeItem.sourceType}</p>
          <p className="text-xs text-slate-500">Período: {mapDate(financeItem.startDate)} - {mapDate(financeItem.endDate)}</p>
          <p className="mt-2 text-sm text-slate-900">Total: {money(Number(financeItem.amount), itemCurrency)}</p>
          <p className="text-xs text-slate-500">Pago: {money(financeItem.paidAmount, itemCurrency)}</p>
          <p className="text-xs text-slate-500">Pendente: {money(financeItem.pendingAmount, itemCurrency)}</p>
          <p className="text-xs text-slate-500">Restante: {money(financeItem.remainingAmount, itemCurrency)}</p>
          <Link
            href={`/finance/sales-items/${financeItem.id}`}
            className="mt-3 inline-block text-xs text-blue-600 hover:underline"
          >
            Visualizar no financeiro consolidado
          </Link>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Vínculo da matrícula</p>
          {financeItem.enrollment ? (
            <>
              <p className="mt-2 text-sm text-slate-900">
                {financeItem.enrollment.student.firstName} {financeItem.enrollment.student.lastName}
              </p>
              <p className="text-xs text-slate-500">{financeItem.enrollment.student.email}</p>
              <p className="text-xs text-slate-500">
                {financeItem.enrollment.course?.program_name ?? 'Sem curso'} • {financeItem.enrollment.status}
              </p>
              <p className="text-xs text-slate-500">
                {financeItem.enrollment.accommodation?.title ?? 'Sem acomodação vinculada'}
              </p>
              <p
                className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${toneByStatus(financeItem.enrollment.status)}`}
              >
                {toEnrollmentStatusLabel(financeItem.enrollment.status)}
              </p>
              <Link
                href={`/enrollments/${financeItem.enrollment.id}`}
                className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <UserCircle2 size={14} />
                Abrir matrícula
              </Link>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Item sem vínculo de matrícula.</p>
          )}

          <form action={linkFinanceItemEnrollmentAction} className="mt-4 space-y-2">
            <input type="hidden" name="financeItemId" value={financeItem.id} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <label className="text-xs font-medium text-slate-600">
              {financeItem.enrollment ? 'Trocar vínculo' : 'Vincular matrícula'}
                <select
                  name="enrollmentId"
                  defaultValue={financeItem.enrollment?.id ?? ''}
                  className="mt-1 h-8 w-full rounded border border-slate-300 px-2 text-xs"
                >
                  <option value="">Sem vínculo</option>
                  {enrollments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.student.firstName} {item.student.lastName} • {item.course?.program_name ?? '-'} ({item.status})
                    </option>
                  ))}
                </select>
            </label>
            <Button size="sm">Salvar vínculo</Button>
          </form>
          <p className="mt-2 text-xs text-slate-500">
            Para escolher matrícula aqui, use o autocomplete no menu principal de matrículas ou vincule via fluxo de matrícula.
          </p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Financeiro do item</p>
          <p className="mt-2 text-sm text-slate-900">{money(Number(financeItem.amount), itemCurrency)} totais</p>
          <p className="text-xs text-slate-500">Emitido: {money(emittedAmount, itemCurrency)}</p>
          <p className="text-xs text-slate-500">Restante a receber: {money(remainingAmount, itemCurrency)}</p>
          <p className="text-xs text-slate-500">Taxa de pagamento: {financeItem.paidRate.toFixed(2)}%</p>
          <p className="mt-3 text-xs text-slate-500">Transações: {financeItem.transactions.length}</p>
          <p className="text-xs text-slate-500">Próxima ação: emitir parcelas até concluir.</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Fluxo operacional da acomodação</h2>
          {enrollment ? (
            <>
              <p className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${toneByStatus(enrollment.accommodationStatus)}`}>
                {labelAccommodationStatus(enrollment.accommodationStatus)}
              </p>
              <form action={updateAccommodationWorkflowFromOperationAction} className="mt-3 grid gap-2">
                <input type="hidden" name="enrollmentId" value={enrollment.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <select
                  name="status"
                  defaultValue={enrollment.accommodationStatus ?? 'not_selected'}
                  className="h-8 rounded border border-slate-300 px-2 text-xs"
                >
                  {accommodationStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <textarea
                  name="reason"
                  rows={2}
                  placeholder="Motivo da mudança (opcional)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                />
                <Button size="sm" type="submit">
                  Atualizar workflow
                </Button>
              </form>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Vínculo de matrícula necessário para operar workflow de acomodação.
            </p>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Chat de acomodação</h2>
          {enrollment ? (
            <>
              <form action={createAccommodationOperationMessageAction} className="mt-3 grid gap-2">
                <input type="hidden" name="enrollmentId" value={enrollment.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <input type="hidden" name="channel" value="accommodation" />
                <textarea
                  name="message"
                  required
                  rows={3}
                  placeholder="Mensagem para aluno/família (canal acomodação)..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <div>
                  <Button size="sm" type="submit">
                    Enviar mensagem
                  </Button>
                </div>
              </form>
              <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                {accommodationMessages.length === 0 && (
                  <p className="text-xs text-slate-500">Sem mensagens de acomodação.</p>
                )}
                {accommodationMessages.map((message) => (
                  <div key={message.id} className="rounded border border-slate-200 p-3">
                    <p className="text-xs text-slate-500">
                      {message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'Usuário'}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{message.message}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTimePtBr(message.createdAt)}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Nenhuma matrícula vinculada. Crie/edite o vínculo para habilitar mensagens.
            </p>
          )}
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Transações</h2>
          <div className="mt-3 space-y-2">
            {(financeItem.transactions ?? []).length === 0 && (
              <p className="text-xs text-slate-500">Sem transações para este item.</p>
            )}
            {(financeItem.transactions ?? []).map((transaction) => (
              <div key={transaction.id} className="rounded border border-slate-200 bg-white p-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-slate-700">
                    {transaction.type} • {transaction.status} • {money(transaction.amount, itemCurrency)}
                    {transaction.dueDate ? ` • venc ${formatDatePtBr(transaction.dueDate)}` : ''}
                    {transaction.paidAt ? ` • pago ${formatDateTimePtBr(transaction.paidAt)}` : ''}
                  </p>
                  <form action={updateFinanceTransactionStatusAction} className="flex items-center gap-1">
                    <input type="hidden" name="enrollmentId" value={financeItem.enrollment?.id ?? ''} />
                    <input type="hidden" name="transactionId" value={transaction.id} />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <select
                      name="status"
                      defaultValue={transaction.status}
                      className="h-8 rounded border border-slate-300 px-2 text-xs"
                    >
                      {transactionStatuses
                        .filter((transactionStatus) => transactionStatus !== transaction.status)
                        .map((statusOption) => (
                          <option key={statusOption} value={statusOption}>
                            {statusOption}
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
          {remainingAmount <= 0 ? (
            <p className="mt-1 text-xs text-emerald-700">Item sem saldo restante.</p>
          ) : (
            <FinanceItemTransactionForm
              enrollmentId={financeItem.enrollment?.id}
              financeItemId={financeItem.id}
              totalAmount={Number(financeItem.amount)}
              emittedAmount={emittedAmount}
              remainingAmount={remainingAmount}
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
