import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { formatDatePtBr, formatDateTimePtBr } from '@/lib/date';
import type {
  EnrollmentAdmin,
  FinanceItemAdmin,
  EnrollmentTimelineEventAdmin,
} from '@/types/catalog.types';
import {
  createEnrollmentDocumentAction,
  createFinanceTransactionAction,
  updateFinanceTransactionStatusAction,
  updateEnrollmentAccommodationAction,
  createEnrollmentMessageAction,
  updateEnrollmentDocumentAction,
  updateEnrollmentPricingAction,
  updateEnrollmentWorkflowAction,
} from '../actions';
import FinanceItemTransactionForm from '../finance-item-transaction-form';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  started: 'Started',
  awaiting_school_approval: 'Awaiting School Approval',
  approved: 'Approved',
  checkout_available: 'Checkout Available',
  payment_pending: 'Payment Pending',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  confirmed: 'Confirmed',
  enrolled: 'Enrolled',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

function getNextEnrollmentStatuses(currentStatus: string, autoApproveIntent: boolean): string[] {
  const map: Record<string, string[]> = {
    draft: ['started', 'cancelled', 'expired'],
    started: autoApproveIntent
      ? ['checkout_available', 'cancelled', 'expired']
      : ['awaiting_school_approval', 'cancelled', 'expired'],
    awaiting_school_approval: ['approved', 'rejected', 'cancelled', 'expired'],
    approved: ['checkout_available', 'cancelled', 'expired'],
    checkout_available: ['payment_pending', 'cancelled', 'expired'],
    payment_pending: ['partially_paid', 'paid', 'cancelled', 'expired'],
    partially_paid: ['paid', 'cancelled', 'expired'],
    paid: ['confirmed', 'cancelled', 'expired'],
    confirmed: ['enrolled', 'cancelled', 'expired'],
    enrolled: ['cancelled', 'expired'],
    rejected: [],
    cancelled: [],
    expired: [],
  };
  return [currentStatus, ...(map[currentStatus] ?? [])];
}

const ACCOMMODATION_EDITABLE_ENROLLMENT_STATUSES = new Set([
  'draft',
  'started',
  'awaiting_school_approval',
  'approved',
  'checkout_available',
]);

function formatDateTime(value?: string | null) {
  return formatDateTimePtBr(value);
}

function toneByStatus(status?: string | null) {
  const value = String(status ?? '').toLowerCase();
  if (value.includes('paid') || value === 'confirmed' || value === 'closed' || value === 'enrolled') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (value.includes('await') || value.includes('pending') || value === 'started' || value === 'approved') {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (value.includes('reject') || value.includes('cancel') || value.includes('denied') || value.includes('expired')) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

function statusTooltip(status?: string | null) {
  const value = String(status ?? '').toLowerCase();
  if (value === 'draft') return 'Rascunho inicial da matrícula.';
  if (value === 'started') return 'Cadastro iniciado, aguardando direcionamento comercial.';
  if (value === 'awaiting_school_approval') return 'Aguardando aprovação operacional da escola.';
  if (value === 'approved') return 'Comercial aprovado e pronto para operação.';
  if (value === 'checkout_available') return 'Pré-checkout disponível.';
  if (value === 'payment_pending' || value === 'partially_paid') return 'Há pagamento em andamento.';
  if (value === 'paid' || value === 'confirmed') return 'Fase de confirmação/operação.';
  if (value === 'enrolled') return 'Matrícula concluída.';
  if (value === 'cancelled' || value === 'rejected' || value === 'expired') return 'Fluxo encerrado.';
  return 'Status operacional atual.';
}

function formatMoney(value: number | undefined | null, currency: string) {
  return `${Number(value ?? 0).toFixed(2)} ${currency}`;
}

function currencyFromItems(items: FinanceItemAdmin[]) {
  return items[0]?.currency || 'CAD';
}

function mapStatusLabel(status?: string | null) {
  const value = String(status ?? '').toLowerCase();
  if (value === 'not_selected') return 'Sem status';
  if (value === 'closed') return 'Fechada';
  return value || 'Sem status';
}

function statusClass(status?: string | null) {
  return toneByStatus(status);
}

function getFinancialSummary(items: FinanceItemAdmin[]) {
  return items.reduce(
    (acc, item) => {
      acc.totalAmount += Number(item.amount ?? 0);
      acc.paidAmount += Number(item.paidAmount ?? 0);
      acc.pendingAmount += Number(item.pendingAmount ?? 0);
      acc.remainingAmount += Number(item.remainingAmount ?? 0);
      return acc;
    },
    {
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      remainingAmount: 0,
    },
  );
}

export default async function EnrollmentDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  await requirePermission('users.read');
  const { id } = await params;

  const [enrollment, timeline, financeItems] = await Promise.all([
    apiFetch<EnrollmentAdmin>(`/enrollments/${id}`).catch(() => null),
    apiFetch<EnrollmentTimelineEventAdmin[]>(`/enrollments/${id}/timeline`).catch(() => []),
    apiFetch<FinanceItemAdmin[]>(`/enrollments/${id}/finance-items`).catch(() => []),
  ]);

  if (!enrollment) notFound();

  const recommendedAccommodations = await apiFetch<
    Array<{
      id: string;
      title: string;
      accommodationType: string;
      location: string;
      priceInCents: number;
      priceUnit: string;
      score?: number | null;
      recommendationBadge?: string | null;
    }>
  >(`/accommodation/recommended/school/${enrollment.school.id}`).catch(() => []);

  const accommodationOptions = [
    ...(enrollment.accommodation
      ? [
          {
            id: enrollment.accommodation.id,
            title: enrollment.accommodation.title,
            accommodationType: enrollment.accommodation.accommodationType,
            location: enrollment.accommodation.location,
            priceInCents: enrollment.accommodation.priceInCents,
            priceUnit: enrollment.accommodation.priceUnit,
            score: enrollment.accommodation.score ?? null,
            recommendationBadge: null,
          },
        ]
      : []),
    ...recommendedAccommodations,
  ].filter((item, index, arr) => arr.findIndex((candidate) => candidate.id === item.id) === index);

  const pricing = enrollment.pricing;
  const displayPricing = {
    basePrice: Number(pricing?.basePrice ?? 0),
    fees: Number(pricing?.fees ?? 0),
    discounts: Number(pricing?.discounts ?? 0),
    totalAmount: Number(pricing?.packageTotalAmount ?? pricing?.totalAmount ?? 0),
    currency: pricing?.currency ?? 'CAD',
    enrollmentCommissionAmount: Number(pricing?.enrollmentCommissionAmount ?? 0),
    accommodationCommissionAmount: Number(pricing?.accommodationCommissionAmount ?? 0),
    totalCommissionAmount: Number(pricing?.totalCommissionAmount ?? pricing?.commissionAmount ?? 0),
    commissionPercentage: Number(pricing?.commissionPercentage ?? 0),
  };

  const financialSummary = getFinancialSummary(financeItems);
  const paymentCoveragePercent =
    financialSummary.totalAmount > 0
      ? Number(((financialSummary.paidAmount / financialSummary.totalAmount) * 100).toFixed(2))
      : 0;

  const isAccommodationClosed = enrollment.accommodationStatus === 'closed';
  const isEnrollmentStatusEditableForAccommodation =
    ACCOMMODATION_EDITABLE_ENROLLMENT_STATUSES.has(enrollment.status);
  const canEditAccommodation =
    !isAccommodationClosed && isEnrollmentStatusEditableForAccommodation;
  const accommodationLockReason = isAccommodationClosed
    ? 'Acomodação fechada. Troca/remoção bloqueada para preservar faturamento.'
    : !isEnrollmentStatusEditableForAccommodation
      ? `Acomodação bloqueada para o status atual da matrícula (${enrollment.status}).`
      : null;

  const statusOptions = getNextEnrollmentStatuses(
    enrollment.status,
    Boolean(enrollment.course.auto_approve_intent),
  );
  const quickActionTargets = [
    { status: 'approved', label: 'Aprovar' },
    { status: 'rejected', label: 'Rejeitar' },
    { status: 'checkout_available', label: 'Liberar checkout' },
    { status: 'paid', label: 'Confirmar pagamento' },
    { status: 'cancelled', label: 'Cancelar' },
  ].filter((item) => statusOptions.includes(item.status) && item.status !== enrollment.status);

  const enrollmentMessages = (enrollment.messages ?? []).filter(
    (message) => (message.channel ?? 'enrollment') === 'enrollment',
  );

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
          { label: 'Matrículas', href: '/enrollments' },
          { label: `${enrollment.student.firstName} ${enrollment.student.lastName}` },
          { label: enrollment.course.program_name },
        ]}
      />
      <PageHeader
        title="Detalhe da Matrícula"
        description="Fluxo operacional e financeiro por itens (curso e acomodação)."
        actions={
          <Link href="/enrollments">
            <Button size="sm" variant="outline">
              <ArrowLeft size={14} />Voltar
            </Button>
          </Link>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status da matrícula</p>
          <p
            title={statusTooltip(enrollment.status)}
            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneByStatus(
              enrollment.status,
            )}`}
          >
            {enrollment.status}
          </p>
          <p className="mt-3 text-xs text-slate-500">Próximo status disponível:</p>
          <p className="text-xs text-slate-700">{STATUS_LABELS[statusOptions[1]] ?? statusOptions[1] ?? 'Sem transição aberta'}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Financeiro consolidado</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            {formatMoney(financialSummary.totalAmount, currencyFromItems(financeItems))}
          </p>
          <p className="mt-1 text-xs text-slate-700">
            Pago: {formatMoney(financialSummary.paidAmount, currencyFromItems(financeItems))}
          </p>
          <p className="text-xs text-slate-700">
            Pendente: {formatMoney(financialSummary.pendingAmount, currencyFromItems(financeItems))}
          </p>
          <p className="text-xs text-slate-700">
            Restante: {formatMoney(financialSummary.remainingAmount, currencyFromItems(financeItems))} ({paymentCoveragePercent.toFixed(2)}%)
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status da acomodação</p>
          <p
            title={`Status operacional de acomodação: ${mapStatusLabel(enrollment.accommodationStatus)}`}
            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
              enrollment.accommodationStatus,
            )}`}
          >
            {mapStatusLabel(enrollment.accommodationStatus)}
          </p>
          <p className="mt-2 text-xs text-slate-700">
            {enrollment.accommodation ? enrollment.accommodation.title : 'Sem acomodação vinculada'}
          </p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Aluno</h2>
          <p className="mt-2 text-sm text-slate-700">
            {enrollment.student.firstName} {enrollment.student.lastName}
          </p>
          <p className="text-xs text-slate-500">{enrollment.student.email}</p>
          <p className="mt-1 text-xs text-slate-500">Status aluno: {enrollment.student.studentStatus}</p>
          <Link
            href={`/students/${enrollment.student.id}`}
            className="mt-2 inline-block text-xs text-blue-600 hover:underline"
          >
            Abrir aluno
          </Link>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Contexto</h2>
          <p className="mt-2 text-sm text-slate-700">{enrollment.institution.name}</p>
          <p className="text-xs text-slate-500">
            {enrollment.school.name} • {enrollment.unit.name} ({enrollment.unit.code})
          </p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Produto</h2>
          <p className="mt-2 text-sm text-slate-700">{enrollment.course.program_name}</p>
          <p className="text-xs text-slate-500">{enrollment.classGroup.name} ({enrollment.classGroup.code})</p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDatePtBr(enrollment.academicPeriod.startDate)} - {formatDatePtBr(enrollment.academicPeriod.endDate)}
          </p>
          <Link
            href={`/courses/${enrollment.course.id}`}
            className="mt-2 inline-block text-xs text-blue-600 hover:underline"
          >
            Abrir curso
          </Link>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Acomodação da matrícula</h2>
          <p className="mt-1 text-xs text-slate-500">
            A acomodação é gerenciada aqui como vínculo, mas cada item financeiro é tratado separado.
          </p>
          <form action={updateEnrollmentAccommodationAction} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <label className="min-w-[260px] flex-1 text-xs font-medium text-slate-600">
              Acomodação
              <select
                name="accommodationId"
                defaultValue={enrollment.accommodation?.id ?? ''}
                disabled={!canEditAccommodation}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              >
                <option value="">Sem acomodação</option>
                {accommodationOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.accommodationType}) - {(item.priceInCents / 100).toFixed(2)} {item.priceUnit}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" size="sm" variant="outline" disabled={!canEditAccommodation}>
              Salvar acomodação
            </Button>
          </form>
          {enrollment.accommodation && (
            <Link
              href={`/accommodations/${enrollment.accommodation.id}`}
              className="mt-2 inline-block text-xs text-blue-600 hover:underline"
            >
              Abrir cadastro da acomodação
            </Link>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Status operacional: <strong>{mapStatusLabel(enrollment.accommodationStatus)}</strong>
            {enrollment.accommodationClosedAt ? ` • Fechada em ${formatDateTime(enrollment.accommodationClosedAt)}` : ''}
          </p>
          {accommodationLockReason ? <p className="mt-1 text-xs text-amber-700">{accommodationLockReason}</p> : null}
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Workflow da matrícula</h2>
          <p className="mt-1 text-xs text-slate-500">Atualize o progresso operacional da matrícula.</p>
          {quickActionTargets.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {quickActionTargets.map((action) => (
                <form key={action.status} action={updateEnrollmentWorkflowAction}>
                  <input type="hidden" name="enrollmentId" value={enrollment.id} />
                  <input type="hidden" name="status" value={action.status} />
                  <Button type="submit" size="sm" variant="outline">
                    {action.label}
                  </Button>
                </form>
              ))}
            </div>
          ) : null}
          <form action={updateEnrollmentWorkflowAction} className="mt-4 grid gap-3">
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <label className="text-xs font-medium text-slate-600">
              Status
              <select
                name="status"
                defaultValue={enrollment.status}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status] ?? status}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Motivo (opcional)
              <textarea
                name="reason"
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Ex.: aguardando documentação complementar"
              />
            </label>
            <div>
              <Button type="submit" size="sm">Atualizar Status</Button>
            </div>
          </form>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Pricing e comissão</h2>
          <p className="mt-1 text-xs text-slate-500">
            Ajuste os valores comerciais de referência da matrícula. Financeiro usa os itens vinculados.
          </p>
          <form action={updateEnrollmentPricingAction} className="mt-4 grid grid-cols-2 gap-3">
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <label className="text-xs font-medium text-slate-600">
              Base Price
              <input
                name="basePrice"
                type="number"
                min={0}
                step="0.01"
                defaultValue={displayPricing.basePrice ?? ''}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Fees
              <input
                name="fees"
                type="number"
                min={0}
                step="0.01"
                defaultValue={displayPricing.fees}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Discounts
              <input
                name="discounts"
                type="number"
                min={0}
                step="0.01"
                defaultValue={displayPricing.discounts}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Currency
              <input
                name="currency"
                defaultValue={displayPricing.currency}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </label>
            <div className="col-span-2 flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <span>Total consolidado: {formatMoney(displayPricing.totalAmount, displayPricing.currency)}</span>
              <span>Comissão curso: {formatMoney(displayPricing.enrollmentCommissionAmount, displayPricing.currency)}</span>
              <span>
                Comissão acomodação: {formatMoney(displayPricing.accommodationCommissionAmount, displayPricing.currency)}
              </span>
              <span>
                Comissão total: {formatMoney(displayPricing.totalCommissionAmount, displayPricing.currency)} (
                {displayPricing.commissionPercentage}%)
              </span>
            </div>
            <div className="col-span-2">
              <Button type="submit" size="sm">Salvar pricing</Button>
            </div>
          </form>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Financeiro por item</h2>
          <p className="mt-1 text-xs text-slate-500">
            Gere parcelas por item da matrícula até atingir o total. Esse é o fluxo financeiro simplificado.
          </p>

          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p>
              Consolidado: {formatMoney(financialSummary.totalAmount, currencyFromItems(financeItems))} • Pago:{' '}
              {formatMoney(financialSummary.paidAmount, currencyFromItems(financeItems))} • Restante:{' '}
              {formatMoney(financialSummary.remainingAmount, currencyFromItems(financeItems))}
            </p>
          </div>

          {financeItems.length === 0 && (
            <p className="mt-3 text-xs text-amber-700">
              Nenhum item financeiro encontrado. Gere uma matrícula com curso e/ou acomodação para criar itens.
            </p>
          )}

          <div className="mt-4 space-y-4">
            {financeItems.map((item) => {
              const itemCurrency = item.currency || currencyFromItems(financeItems);
              const hasRemaining = item.remainingAmount > 0;

              return (
                <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.title} {item.itemType ? `(${item.itemType})` : ''}
                      </p>
                      <p className="text-xs text-slate-600">
                        Período:{' '}
                        {item.startDate ? `${formatDatePtBr(item.startDate)} - ${formatDatePtBr(item.endDate)}` : 'Sem período'}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Total {formatMoney(item.amount, itemCurrency)} • Pago {formatMoney(item.paidAmount, itemCurrency)} • Restante{' '}
                        {formatMoney(item.remainingAmount, itemCurrency)}
                      </p>
                    </div>
                    <p
                      title="Progresso pago do item"
                      className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${toneByStatus(item.paidRate >= 100 ? 'paid' : '')}`}
                    >
                      {item.paidRate.toFixed(2)}%
                    </p>
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Transações</p>
                    {item.transactions.length === 0 ? (
                      <p className="text-xs text-slate-500">Sem transações para este item.</p>
                    ) : (
                      item.transactions.map((transaction) => (
                        <div key={transaction.id} className="rounded border border-slate-200 bg-white p-2 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-slate-700">
                              {transaction.type} • {transaction.status} • {formatMoney(transaction.amount, itemCurrency)}
                              {transaction.dueDate ? ` • venc ${formatDatePtBr(transaction.dueDate)}` : ''}
                              {transaction.paidAt ? ` • pago ${formatDateTime(transaction.paidAt)}` : ''}
                            </p>
                            <form action={updateFinanceTransactionStatusAction} className="flex items-center gap-1">
                              <input type="hidden" name="enrollmentId" value={enrollment.id} />
                              <input type="hidden" name="transactionId" value={transaction.id} />
                              <select name="status" defaultValue={transaction.status} className="h-8 rounded border border-slate-300 px-2 text-xs">
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
                      ))
                    )}
                  </div>

                  {hasRemaining && (
                    <FinanceItemTransactionForm
                      enrollmentId={enrollment.id}
                      financeItemId={item.id}
                      totalAmount={Number(item.amount)}
                      emittedAmount={Number(item.paidAmount) + Number(item.pendingAmount)}
                      remainingAmount={Number(item.remainingAmount)}
                      currency={itemCurrency}
                      action={createFinanceTransactionAction}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Documentos</h2>
          <p className="mt-1 text-xs text-slate-500">Upload, análise e validação dos documentos da matrícula.</p>
          <form action={createEnrollmentDocumentAction} className="mt-4 grid gap-2 rounded-lg border border-slate-200 p-3">
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <input name="type" placeholder="Tipo (passport, transcript, etc.)" className="h-9 rounded-lg border border-slate-300 px-3 text-sm" />
            <input name="fileUrl" placeholder="URL do arquivo" className="h-9 rounded-lg border border-slate-300 px-3 text-sm" />
            <div>
              <Button size="sm" type="submit">Adicionar Documento</Button>
            </div>
          </form>
          <div className="mt-4 space-y-3">
            {(enrollment.documents ?? []).length === 0 && (
              <p className="text-xs text-slate-500">Nenhum documento vinculado.</p>
            )}
            {(enrollment.documents ?? []).map((doc) => (
              <div key={doc.id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-800">{doc.type}</p>
                <p className="truncate text-xs text-slate-500">{doc.fileUrl}</p>
                <p className="mt-1 text-xs text-slate-500">Status: {doc.status}</p>
                <form action={updateEnrollmentDocumentAction} className="mt-2 grid gap-2">
                  <input type="hidden" name="enrollmentId" value={enrollment.id} />
                  <input type="hidden" name="documentId" value={doc.id} />
                  <select name="status" defaultValue={doc.status} className="h-8 rounded border border-slate-300 px-2 text-xs">
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <input
                    name="adminNote"
                    defaultValue={doc.adminNote ?? ''}
                    placeholder="Nota admin (opcional)"
                    className="h-8 rounded border border-slate-300 px-2 text-xs"
                  />
                  <div>
                    <Button type="submit" size="sm" variant="outline">Atualizar</Button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Mensagens</h2>
          <p className="mt-1 text-xs text-slate-500">Comunicação com aluno no contexto da matrícula.</p>
          <form action={createEnrollmentMessageAction} className="mt-4 grid gap-2 rounded-lg border border-slate-200 p-3">
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <input type="hidden" name="channel" value="enrollment" />
            <textarea
              name="message"
              required
              rows={3}
              placeholder="Digite uma mensagem para o aluno..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div>
              <Button type="submit" size="sm">Enviar Mensagem</Button>
            </div>
          </form>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
            {enrollmentMessages.length === 0 && <p className="text-xs text-slate-500">Nenhuma mensagem registrada.</p>}
            {enrollmentMessages.map((message) => (
              <div key={message.id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-700">
                  {message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'Usuário'}
                </p>
                <p className="mt-1 text-sm text-slate-700">{message.message}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(message.createdAt)}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Timeline da Matrícula</h2>
          <p className="mt-1 text-xs text-slate-500">Histórico consolidado de eventos operacionais.</p>
          <div className="mt-4 space-y-2">
            {timeline.length === 0 && <p className="text-xs text-slate-500">Sem eventos registrados.</p>}
            {timeline.map((event) => (
              <div key={event.id} className="rounded border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-800">{event.title}</p>
                {event.description && <p className="mt-1 text-xs text-slate-600">{event.description}</p>}
                <p className="mt-1 text-xs text-slate-500">{formatDateTime(event.occurredAt)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
