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
  EnrollmentCheckoutAdmin,
  PaymentAdmin,
  EnrollmentQuoteAdmin,
  EnrollmentTimelineEventAdmin,
} from '@/types/catalog.types';
import {
  confirmEnrollmentFakePaymentAction,
  createEnrollmentDocumentAction,
  syncEnrollmentOrderAction,
  createEnrollmentInvoiceFromQuoteAction,
  updateEnrollmentAccommodationAction,
  updateEnrollmentAccommodationWorkflowAction,
  createEnrollmentMessageAction,
  updateEnrollmentDocumentAction,
  updateEnrollmentPricingAction,
  updateEnrollmentWorkflowAction,
} from '../actions';

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

function getNextEnrollmentStatuses(
  currentStatus: string,
  autoApproveIntent: boolean,
): string[] {
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

const ACCOMMODATION_STATUS_OPTIONS = [
  { value: 'not_selected', label: 'Não selecionada' },
  { value: 'selected', label: 'Selecionada' },
  { value: 'approved', label: 'Aprovada' },
  { value: 'denied', label: 'Negada' },
  { value: 'closed', label: 'Fechada (sem troca)' },
];
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
  if (value === 'approved') return 'Comercial aprovado e pronto para checkout.';
  if (value === 'checkout_available') return 'Checkout pode ser iniciado.';
  if (value === 'payment_pending' || value === 'partially_paid') return 'Há pagamento em andamento.';
  if (value === 'paid' || value === 'confirmed') return 'Fase de confirmação/operação.';
  if (value === 'enrolled') return 'Matrícula concluída.';
  if (value === 'cancelled' || value === 'rejected' || value === 'expired') return 'Fluxo encerrado sem venda concluída.';
  return 'Status operacional atual.';
}

function formatMoney(value: number | undefined | null, currency: string) {
  return `${Number(value ?? 0).toFixed(2)} ${currency}`;
}

export default async function EnrollmentDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  await requirePermission('users.read');
  const { id } = await params;

  const [enrollment, timeline] = await Promise.all([
    apiFetch<EnrollmentAdmin>(`/enrollments/${id}`).catch(() => null),
    apiFetch<EnrollmentTimelineEventAdmin[]>(`/enrollments/${id}/timeline`).catch(() => []),
  ]);
  if (!enrollment) notFound();
  const [quotes, checkout, payments] = await Promise.all([
    apiFetch<EnrollmentQuoteAdmin[]>(`/quotes?enrollmentId=${enrollment.id}`).catch(() => []),
    apiFetch<EnrollmentCheckoutAdmin>(`/enrollments/${id}/checkout`).catch(() => null),
    apiFetch<PaymentAdmin[]>(`/payments?enrollmentId=${id}`).catch(() => []),
  ]);

  const sortedQuotes = [...quotes].sort((a, b) => {
    const left = Number(new Date(a.createdAt ?? 0).getTime());
    const right = Number(new Date(b.createdAt ?? 0).getTime());
    return right - left;
  });
  const latestQuote = sortedQuotes[0] ?? null;
  const hasBundleQuote = sortedQuotes.some((item) => item.type === 'course_with_accommodation');

  const quoteItemsSummary = sortedQuotes.reduce(
    (acc, item) => ({
      courseAmount: acc.courseAmount + Number(item.courseAmount ?? 0),
      accommodationAmount: acc.accommodationAmount + Number(item.accommodationAmount ?? 0),
      fees: acc.fees + Number(item.fees ?? 0),
      discounts: acc.discounts + Number(item.discounts ?? 0),
      totalAmount: acc.totalAmount + Number(item.totalAmount ?? 0),
      downPaymentAmount: acc.downPaymentAmount + Number(item.downPaymentAmount ?? 0),
      remainingAmount: acc.remainingAmount + Number(item.remainingAmount ?? 0),
      commissionAmount: acc.commissionAmount + Number(item.commissionAmount ?? 0),
      commissionCourseAmount: acc.commissionCourseAmount + Number(item.commissionCourseAmount ?? 0),
      commissionAccommodationAmount:
        acc.commissionAccommodationAmount + Number(item.commissionAccommodationAmount ?? 0),
    }),
    {
      courseAmount: 0,
      accommodationAmount: 0,
      fees: 0,
      discounts: 0,
      totalAmount: 0,
      downPaymentAmount: 0,
      remainingAmount: 0,
      commissionAmount: 0,
      commissionCourseAmount: 0,
      commissionAccommodationAmount: 0,
    },
  );
  const quoteCurrency = sortedQuotes[0]?.currency ?? 'CAD';

  const recommendedAccommodations = await apiFetch<Array<{
    id: string;
    title: string;
    accommodationType: string;
    location: string;
    priceInCents: number;
    priceUnit: string;
    score?: number | null;
    recommendationBadge?: string | null;
  }>>(`/accommodation/recommended/school/${enrollment.school.id}`).catch(() => []);
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
  ].filter(
    (item, index, arr) => arr.findIndex((candidate) => candidate.id === item.id) === index,
  );
  const pricing = enrollment.pricing;
  const enrollmentMessages = (enrollment.messages ?? []).filter(
    (message) => (message.channel ?? 'enrollment') === 'enrollment',
  );
  const accommodationMessages = (enrollment.messages ?? []).filter(
    (message) => message.channel === 'accommodation',
  );
  const isAccommodationClosed = enrollment.accommodationStatus === 'closed';
  const hasLinkedAccommodationOrder = Boolean(enrollment.accommodationOrder?.id);
  const isEnrollmentStatusEditableForAccommodation =
    ACCOMMODATION_EDITABLE_ENROLLMENT_STATUSES.has(enrollment.status);
  const canEditAccommodation =
    !isAccommodationClosed &&
    !hasLinkedAccommodationOrder &&
    isEnrollmentStatusEditableForAccommodation;
  const accommodationLockReason = isAccommodationClosed
    ? 'Acomodação fechada. Troca/remoção bloqueada para preservar fechamento e faturamento.'
    : hasLinkedAccommodationOrder
      ? 'Acomodação bloqueada nesta matrícula: já existe order vinculada para este aluno.'
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

  const pricingFromQuote = sortedQuotes.length
    ? {
        basePrice: quoteItemsSummary.courseAmount,
        fees: quoteItemsSummary.fees,
        discounts: quoteItemsSummary.discounts,
        currency: quoteCurrency,
        totalAmount: quoteItemsSummary.totalAmount,
        enrollmentAmount: quoteItemsSummary.courseAmount,
        accommodationAmount: quoteItemsSummary.accommodationAmount,
        packageTotalAmount: quoteItemsSummary.totalAmount,
        commissionAmount: quoteItemsSummary.commissionAmount,
        commissionPercentage: latestQuote?.commissionPercentage ?? 0,
        enrollmentCommissionAmount: quoteItemsSummary.commissionCourseAmount,
        enrollmentCommissionPercentage: latestQuote?.commissionPercentage ?? 0,
        accommodationCommissionAmount: quoteItemsSummary.commissionAccommodationAmount,
        accommodationCommissionPercentage: 0,
        totalCommissionAmount: quoteItemsSummary.commissionAmount,
      }
    : null;

  const displayPricing = (() => {
    const hasPersistedValues =
      !!pricing &&
      (Number(pricing.packageTotalAmount ?? pricing.totalAmount ?? 0) > 0 ||
        Number(pricing.totalCommissionAmount ?? pricing.commissionAmount ?? 0) > 0 ||
        Number(pricing.enrollmentCommissionAmount ?? 0) > 0 ||
        Number(pricing.basePrice ?? 0) > 0);
    return hasPersistedValues ? pricing : pricingFromQuote ?? pricing;
  })();

  const checkoutAmountCurrency =
    checkout?.financial.currency || quoteCurrency || displayPricing?.currency || 'CAD';
  const checkoutExpectedTotal = checkout?.financial.totalAmount ?? quoteItemsSummary.totalAmount;
  const checkoutDownPaymentAmount =
    checkout?.financial.downPaymentAmount ?? quoteItemsSummary.downPaymentAmount;
  const checkoutRemainingAmountFromCheckout =
    checkout?.financial.remainingAmount ?? quoteItemsSummary.remainingAmount;

  const paidAmount = payments
    .filter((payment) => payment.status === 'paid')
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const pendingAmount = payments
    .filter((payment) => payment.status === 'pending')
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const failedAmount = payments
    .filter((payment) => payment.status === 'failed')
    .reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  const outstandingAmount = Math.max(0, Number(checkoutExpectedTotal) - paidAmount);
  const paymentCoveragePercent = checkoutExpectedTotal > 0 ? (paidAmount / checkoutExpectedTotal) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: 'Matrículas', href: '/enrollments' },
          { label: enrollment.student.firstName + ' ' + enrollment.student.lastName },
          { label: enrollment.course.program_name },
        ]}
      />
      <PageHeader
        title="Detalhe da Matrícula"
        description="Fluxo operacional, documentos, mensagens, timeline, pricing e financeiro."
        actions={(
          <Link href="/enrollments">
            <Button size="sm" variant="outline"><ArrowLeft size={14} />Voltar</Button>
          </Link>
        )}
      />

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status da matrícula</p>
          <p
            title={statusTooltip(enrollment.status)}
            className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneByStatus(enrollment.status)}`}
          >
            {enrollment.status}
          </p>
          <p className="mt-2 text-xs text-slate-500">Próximo passo comercial:</p>
          <p className="text-xs text-slate-700">
            {latestQuote?.nextStep ?? 'Sem próximo passo definido.'}
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Composição comercial</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            {hasBundleQuote ? 'Item agregado (curso + acomodação)' : 'Itens separados'}
          </p>
          <p className="mt-2 text-xs text-slate-500">Status financeiro do vínculo:</p>
          <p
            title={statusTooltip(latestQuote?.packageStatus)}
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneByStatus(latestQuote?.packageStatus)}`}
          >
            {latestQuote?.packageStatus ?? 'draft'}
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Acomodação</p>
          <p className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneByStatus(enrollment.accommodationStatus)}`}>
            {enrollment.accommodationStatus}
          </p>
          <p className="mt-2 text-xs text-slate-700">
            {enrollment.accommodation ? enrollment.accommodation.title : 'Sem acomodação vinculada.'}
          </p>
          <p className="text-xs text-slate-500">
            {enrollment.accommodationOrder?.id
              ? `Order vinculada para esta acomodação: ${enrollment.accommodationOrder.id}`
              : 'Sem order financeira vinculada'}
          </p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Aluno</h2>
          <p className="mt-2 text-sm text-slate-700">{enrollment.student.firstName} {enrollment.student.lastName}</p>
          <p className="text-xs text-slate-500">{enrollment.student.email}</p>
          <p className="mt-1 text-xs text-slate-500">Status aluno (global): {enrollment.student.studentStatus}</p>
          <Link href={`/students/${enrollment.student.id}`} className="mt-2 inline-block text-xs text-blue-600 hover:underline">
            Abrir aluno
          </Link>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Contexto</h2>
          <p className="mt-2 text-sm text-slate-700">{enrollment.institution.name}</p>
          <p className="text-xs text-slate-500">{enrollment.school.name} • {enrollment.unit.name} ({enrollment.unit.code})</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Produto Curso</h2>
          <p className="mt-2 text-sm text-slate-700">{enrollment.course.program_name}</p>
          <p className="text-xs text-slate-500">{enrollment.classGroup.name} ({enrollment.classGroup.code})</p>
          <Link href={`/courses/${enrollment.course.id}`} className="mt-2 inline-block text-xs text-blue-600 hover:underline">
            Abrir curso
          </Link>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Período e Estado Comercial</h2>
          <p className="mt-2 text-sm text-slate-700">{enrollment.academicPeriod.name}</p>
          <p className="text-xs text-slate-500">
            {formatDatePtBr(enrollment.academicPeriod.startDate)} - {formatDatePtBr(enrollment.academicPeriod.endDate)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Status matrícula: {enrollment.status}</p>
          <p className="mt-1 text-xs text-slate-500">
            Contexto de venda: <strong>{hasBundleQuote ? 'vínculo único' : 'itens separados'}</strong>
          </p>
          {latestQuote?.nextStep ? <p className="mt-1 text-xs text-slate-500">Próximo passo: {latestQuote.nextStep}</p> : null}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Acomodação da matrícula</h2>
          <p className="mt-1 text-xs text-slate-500">
            Selecione a acomodação da matrícula. A venda de cada item é gerada manualmente no fluxo financeiro.
          </p>
          <form action={updateEnrollmentAccommodationAction} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <label className="min-w-[280px] flex-1 text-xs font-medium text-slate-600">
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
                    {item.title} ({item.accommodationType}) - ${(item.priceInCents / 100).toFixed(0)}/{item.priceUnit}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" size="sm" variant="outline" disabled={!canEditAccommodation}>
              Salvar acomodação
            </Button>
          </form>
          {enrollment.accommodation && (
            <p className="mt-2 text-xs text-slate-500">
              Atual: {enrollment.accommodation.title} • {(enrollment.accommodation.priceInCents / 100).toFixed(2)} {enrollment.accommodation.priceUnit}
            </p>
          )}
          {enrollment.accommodationOrder?.id ? (
            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">Dados comerciais da acomodação</p>
              <p className="mt-1">
                Order: <strong>{enrollment.accommodationOrder.id}</strong>
              </p>
              <p>
                Status: <strong>{enrollment.accommodationOrder.status}</strong> • Pagamento:{' '}
                <strong>{enrollment.accommodationOrder.paymentStatus}</strong>
              </p>
              <p>
                Total: <strong>{Number(enrollment.accommodationOrder.totalAmount).toFixed(2)} {enrollment.accommodationOrder.currency}</strong>
              </p>
              {enrollment.accommodationOrder.items
                .filter((item) => item.itemType === 'accommodation')
                .map((item) => (
                  <p key={item.id}>
                    Período: {formatDatePtBr(item.startDate)} - {formatDatePtBr(item.endDate)} • Valor item:{' '}
                    {Number(item.amount).toFixed(2)} {enrollment.accommodationOrder?.currency}
                  </p>
                ))}
              <div className="mt-1 flex gap-3">
                <Link href={`/accommodation-operations/${enrollment.accommodationOrder.id}`} className="text-blue-600 hover:underline">
                  Abrir operação da acomodação
                </Link>
                <Link href={`/orders/${enrollment.accommodationOrder.id}`} className="text-blue-600 hover:underline">
                  Abrir order
                </Link>
                {enrollment.accommodation ? (
                  <Link href={`/accommodations/${enrollment.accommodation.id}`} className="text-blue-600 hover:underline">
                    Abrir cadastro da acomodação
                  </Link>
                ) : null}
              </div>
            </div>
          ) : enrollment.accommodation ? (
            <Link href={`/accommodations/${enrollment.accommodation.id}`} className="mt-1 inline-block text-xs text-blue-600 hover:underline">
              Abrir cadastro da acomodação
            </Link>
          ) : null}
          <p className="mt-1 text-xs text-slate-500">
            Status operacional da acomodação: <strong>{enrollment.accommodationStatus}</strong>
            {enrollment.accommodationClosedAt ? ` • Fechada em ${formatDateTime(enrollment.accommodationClosedAt)}` : ''}
          </p>
          {accommodationLockReason ? (
            <p className="mt-1 text-xs text-amber-700">{accommodationLockReason}</p>
          ) : null}
        </article>

      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Workflow da Matrícula</h2>
          <p className="mt-1 text-xs text-slate-500">Atualize o progresso operacional da matrícula.</p>
          {quickActionTargets.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {quickActionTargets.map((action) => (
                <form key={action.status} action={updateEnrollmentWorkflowAction}>
                  <input type="hidden" name="enrollmentId" value={enrollment.id} />
                  <input type="hidden" name="status" value={action.status} />
                  <Button type="submit" size="sm" variant="outline">{action.label}</Button>
                </form>
              ))}
            </div>
          ) : null}
          <form action={updateEnrollmentWorkflowAction} className="mt-4 grid gap-3">
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <label className="text-xs font-medium text-slate-600">
              Status
              <select name="status" defaultValue={enrollment.status} className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{STATUS_LABELS[status] ?? status}</option>
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
          <h2 className="text-sm font-semibold text-slate-900">Pricing e Comissão</h2>
          <p className="mt-1 text-xs text-slate-500">
            Valores consolidados por item da matrícula (curso e acomodação). Não confundem com a operação do fluxo.
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
                defaultValue={displayPricing?.basePrice ?? ''}
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
                defaultValue={displayPricing?.fees ?? 0}
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
                defaultValue={displayPricing?.discounts ?? 0}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Currency
              <input
                name="currency"
                defaultValue={displayPricing?.currency ?? 'CAD'}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              />
            </label>
            <div className="col-span-2 flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <span>
                Item curso: {formatMoney(displayPricing?.enrollmentAmount ?? displayPricing?.basePrice, displayPricing?.currency ?? 'CAD')}
              </span>
              <span>
                Item acomodação: {formatMoney(displayPricing?.accommodationAmount ?? 0, displayPricing?.currency ?? 'CAD')}
              </span>
              <span>
                Total consolidado: {formatMoney(displayPricing?.packageTotalAmount ?? displayPricing?.totalAmount, displayPricing?.currency ?? 'CAD')}
              </span>
              <span>
                Comissão do item curso: {formatMoney(displayPricing?.enrollmentCommissionAmount, displayPricing?.currency ?? 'CAD')}
              </span>
              <span>
                Comissão do item acomodação: {formatMoney(displayPricing?.accommodationCommissionAmount, displayPricing?.currency ?? 'CAD')}
              </span>
              <span>
                Comissão total: {formatMoney(displayPricing?.totalCommissionAmount ?? displayPricing?.commissionAmount, displayPricing?.currency ?? 'CAD')}
                ({displayPricing?.commissionPercentage ?? 0}%)
              </span>
            </div>
            <div className="col-span-2">
              <Button type="submit" size="sm">Salvar Pricing</Button>
            </div>
          </form>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Workflow da Acomodação</h2>
          <p className="mt-1 text-xs text-slate-500">
            Aprovado/negado/fechado no contexto da matrícula. Ao fechar, não permite trocar.
          </p>
          <form action={updateEnrollmentAccommodationWorkflowAction} className="mt-4 grid gap-3">
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <label className="text-xs font-medium text-slate-600">
              Status da acomodação
              <select
                name="status"
                defaultValue={enrollment.accommodationStatus}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              >
                {ACCOMMODATION_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Motivo (opcional)
              <textarea
                name="reason"
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Ex.: acomodação aprovada e fechada para faturamento"
              />
            </label>
            <div>
              <Button type="submit" size="sm" disabled={!enrollment.accommodation && enrollment.accommodationStatus === 'not_selected'}>
                Atualizar workflow da acomodação
              </Button>
            </div>
          </form>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Itens de venda da matrícula</h2>
          {!latestQuote ? (
            <p className="mt-2 text-xs text-slate-500">Nenhum item comercial associado à matrícula.</p>
          ) : (
            <div className="mt-3 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">Resumo consolidado</p>
                <p>Curso: {formatMoney(quoteItemsSummary.courseAmount, quoteCurrency)}</p>
                <p>Acomodação: {formatMoney(quoteItemsSummary.accommodationAmount, quoteCurrency)}</p>
                <p>
                  Total: {formatMoney(quoteItemsSummary.totalAmount, quoteCurrency)} • Entrada:{' '}
                  {formatMoney(quoteItemsSummary.downPaymentAmount, quoteCurrency)} • Saldo:{' '}
                  {formatMoney(quoteItemsSummary.remainingAmount, quoteCurrency)}
                </p>
                <p>Comissão total: {formatMoney(quoteItemsSummary.commissionAmount, quoteCurrency)}</p>
              </div>
              <div className="space-y-2">
                {sortedQuotes.map((quoteItem) => (
                  <div key={quoteItem.id} className="rounded-lg border border-slate-200 p-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">
                      {quoteItem.type} • {quoteItem.createdAt ? formatDateTimePtBr(quoteItem.createdAt) : 'Sem data'}
                    </p>
                    <p>Status: {quoteItem.packageStatus ?? 'draft'} • {quoteItem.nextStep ?? ''}</p>
                    <p>
                      Total: {formatMoney(quoteItem.totalAmount, quoteItem.currency)} • Curso:{' '}
                      {formatMoney(quoteItem.courseAmount, quoteItem.currency)} • Acomodação:{' '}
                      {formatMoney(quoteItem.accommodationAmount, quoteItem.currency)}
                    </p>
                    <p>
                      Entrada {Number(quoteItem.downPaymentPercentage).toFixed(2)}%:{' '}
                      {formatMoney(quoteItem.downPaymentAmount, quoteItem.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Fluxo financeiro manual</h2>
          <p className="mt-1 text-xs text-slate-500">
            Financeiro desacoplado: gere order e invoice por item da matrícula para controlar exatamente
            o que foi orçado e cobrado.
          </p>
          <div className="mt-3 grid gap-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <span>Valor consolidado a gerar: {formatMoney(checkoutExpectedTotal, checkoutAmountCurrency)}</span>
            <span>Entrada esperada: {formatMoney(checkoutDownPaymentAmount, checkoutAmountCurrency)}</span>
            <span>Saldo esperado: {formatMoney(checkoutRemainingAmountFromCheckout, checkoutAmountCurrency)}</span>
            <span>Já pago (somente status paid): {formatMoney(paidAmount, checkoutAmountCurrency)}</span>
            <span>Pendente (status pending): {formatMoney(pendingAmount, checkoutAmountCurrency)}</span>
            {failedAmount > 0 ? <span>Falhas: {formatMoney(failedAmount, checkoutAmountCurrency)}</span> : null}
            <span>Falta receber: {formatMoney(outstandingAmount, checkoutAmountCurrency)} ({paymentCoveragePercent.toFixed(2)}%)</span>
            <span>Checkout: {checkout?.state ?? 'indisponível'}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <form action={syncEnrollmentOrderAction}>
              <input type="hidden" name="enrollmentId" value={enrollment.id} />
              <Button type="submit" size="sm" variant="outline" disabled={!latestQuote}>
                Gerar/Atualizar ordem(s) da matrícula
              </Button>
            </form>
            {sortedQuotes.length > 0 &&
              sortedQuotes.map((quoteItem) => (
                <form key={`${quoteItem.id}-invoice`} action={createEnrollmentInvoiceFromQuoteAction}>
                  <input type="hidden" name="enrollmentId" value={enrollment.id} />
                  <input type="hidden" name="quoteId" value={quoteItem.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Gerar invoice ({quoteItem.type})
                  </Button>
                </form>
              ))}
          </div>
          {!latestQuote ? (
            <p className="mt-2 text-xs text-amber-700">Gere o item comercial antes para habilitar geração financeira.</p>
          ) : null}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Checkout e Pagamento</h2>
          {!checkout ? (
            <p className="mt-2 text-xs text-slate-500">Checkout ainda indisponível.</p>
          ) : (
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <p>
                Estado do checkout:{' '}
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${toneByStatus(checkout.state)}`}>
                  {checkout.state}
                </span>
              </p>
              {checkout.reason && <p>{checkout.reason}</p>}
              <p>Total: {Number(checkout.financial.totalAmount).toFixed(2)} {checkout.financial.currency}</p>
              <p>Entrada: {Number(checkout.financial.downPaymentAmount).toFixed(2)} {checkout.financial.currency}</p>
              <p>Saldo: {Number(checkout.financial.remainingAmount).toFixed(2)} {checkout.financial.currency}</p>
              {checkout.state === 'available' && (
                <form action={confirmEnrollmentFakePaymentAction} className="pt-2">
                  <input type="hidden" name="enrollmentId" value={enrollment.id} />
                  <Button type="submit" size="sm">Confirmar pagamento fake</Button>
                </form>
              )}
            </div>
          )}

          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-700">Pagamentos registrados</p>
            {payments.length === 0 && (
              <p className="text-xs text-slate-500">Nenhum pagamento registrado.</p>
            )}
            {payments.map((payment) => (
              <div key={payment.id} className="rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-600">
                <p>
                  {payment.type} • {payment.status} • {Number(payment.amount).toFixed(2)} {payment.currency}
                </p>
                <p>Criado em: {formatDateTime(payment.createdAt)}</p>
                {payment.paidAt && <p>Pago em: {formatDateTime(payment.paidAt)}</p>}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
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
                  <input name="adminNote" defaultValue={doc.adminNote ?? ''} placeholder="Nota admin (opcional)" className="h-8 rounded border border-slate-300 px-2 text-xs" />
                  <div>
                    <Button type="submit" size="sm" variant="outline">Atualizar</Button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Mensagens</h2>
          <p className="mt-1 text-xs text-slate-500">Comunicação aluno e operação dentro da matrícula.</p>
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
            {enrollmentMessages.length === 0 && (
              <p className="text-xs text-slate-500">Nenhuma mensagem registrada.</p>
            )}
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
          <h2 className="text-sm font-semibold text-slate-900">Chat da Acomodação</h2>
          <p className="mt-1 text-xs text-slate-500">Canal específico da acomodação vinculada à matrícula.</p>
          <form action={createEnrollmentMessageAction} className="mt-4 grid gap-2 rounded-lg border border-slate-200 p-3">
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <input type="hidden" name="channel" value="accommodation" />
            <textarea
              name="message"
              required
              rows={3}
              placeholder="Digite uma mensagem sobre a acomodação..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <div>
              <Button type="submit" size="sm">Enviar Mensagem de Acomodação</Button>
            </div>
          </form>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
            {accommodationMessages.length === 0 && (
              <p className="text-xs text-slate-500">Nenhuma mensagem de acomodação registrada.</p>
            )}
            {accommodationMessages.map((message) => (
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
      </section>

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
    </div>
  );
}
