import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type {
  EnrollmentAdmin,
  EnrollmentCheckoutAdmin,
  PaymentAdmin,
  EnrollmentQuoteAdmin,
  EnrollmentTimelineEventAdmin,
  OrderAdmin,
} from '@/types/catalog.types';
import {
  confirmEnrollmentFakePaymentAction,
  createEnrollmentDocumentAction,
  updateEnrollmentAccommodationAction,
  updateEnrollmentAccommodationOrderAction,
  updateEnrollmentAccommodationWorkflowAction,
  createEnrollmentMessageAction,
  updateEnrollmentDocumentAction,
  updateEnrollmentPricingAction,
  updateEnrollmentWorkflowAction,
} from '../actions';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'started', label: 'Started' },
  { value: 'awaiting_school_approval', label: 'Awaiting School Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'checkout_available', label: 'Checkout Available' },
  { value: 'payment_pending', label: 'Payment Pending' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'expired', label: 'Expired' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'closed', label: 'Closed' },
  { value: 'completed', label: 'Completed' },
];

const ACCOMMODATION_STATUS_OPTIONS = [
  { value: 'not_selected', label: 'Não selecionada' },
  { value: 'selected', label: 'Selecionada' },
  { value: 'approved', label: 'Aprovada' },
  { value: 'denied', label: 'Negada' },
  { value: 'closed', label: 'Fechada (sem troca)' },
];

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-BR');
}

function toneByStatus(status?: string | null) {
  const value = String(status ?? '').toLowerCase();
  if (value.includes('paid') || value === 'confirmed' || value === 'closed' || value === 'completed') {
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
  const [quote, checkout, payments] = await Promise.all([
    apiFetch<EnrollmentQuoteAdmin>(`/quotes/by-enrollment/${enrollment.id}`).catch(() => null),
    apiFetch<EnrollmentCheckoutAdmin>(`/enrollments/${id}/checkout`).catch(() => null),
    apiFetch<PaymentAdmin[]>(`/payments?enrollmentId=${id}`).catch(() => []),
  ]);

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
  const accommodationOrders = await apiFetch<OrderAdmin[]>(
    `/orders?userId=${enrollment.student.id}&type=accommodation`,
  ).catch(() => []);

  const pricing = enrollment.pricing;
  const enrollmentMessages = (enrollment.messages ?? []).filter(
    (message) => (message.channel ?? 'enrollment') === 'enrollment',
  );
  const accommodationMessages = (enrollment.messages ?? []).filter(
    (message) => message.channel === 'accommodation',
  );
  const isAccommodationClosed = enrollment.accommodationStatus === 'closed';

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
        description="Fluxo operacional, documentos, mensagens, timeline e pricing."
        actions={(
          <Link href="/enrollments">
            <Button size="sm" variant="outline"><ArrowLeft size={14} />Voltar</Button>
          </Link>
        )}
      />

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status da matrícula</p>
          <p className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneByStatus(enrollment.status)}`}>
            {enrollment.status}
          </p>
          <p className="mt-2 text-xs text-slate-500">Próximo passo operacional:</p>
          <p className="text-xs text-slate-700">{quote?.nextStep ?? 'Sem próximo passo definido.'}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Composição do pacote</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            {quote?.type ?? (enrollment.accommodation ? 'course_with_accommodation' : 'course_only')}
          </p>
          <p className="mt-2 text-xs text-slate-500">Status do pacote:</p>
          <p className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneByStatus(quote?.packageStatus ?? 'draft')}`}>
            {quote?.packageStatus ?? 'draft'}
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Produto acomodação</p>
          <p className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneByStatus(enrollment.accommodationStatus)}`}>
            {enrollment.accommodationStatus}
          </p>
          <p className="mt-2 text-xs text-slate-700">
            {enrollment.accommodation ? enrollment.accommodation.title : 'Sem acomodação no pacote.'}
          </p>
          <p className="text-xs text-slate-500">
            {enrollment.accommodationOrder?.id ? `Order vinculada: ${enrollment.accommodationOrder.id}` : 'Sem order vinculada'}
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
            {new Date(enrollment.academicPeriod.startDate).toLocaleDateString('pt-BR')} - {new Date(enrollment.academicPeriod.endDate).toLocaleDateString('pt-BR')}
          </p>
          <p className="mt-1 text-xs text-slate-500">Status matrícula: {enrollment.status}</p>
          <p className="mt-1 text-xs text-slate-500">
            Tipo de fluxo: <strong>{quote?.type ?? (enrollment.accommodation ? 'course_with_accommodation' : 'course_only')}</strong>
          </p>
          {quote?.nextStep ? <p className="mt-1 text-xs text-slate-500">Próximo passo: {quote.nextStep}</p> : null}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Acomodação do pacote</h2>
          <p className="mt-1 text-xs text-slate-500">
            Selecione uma acomodação recomendada para a escola desta matrícula, ou mantenha sem acomodação.
          </p>
          <form action={updateEnrollmentAccommodationAction} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <label className="min-w-[280px] flex-1 text-xs font-medium text-slate-600">
              Acomodação
              <select
                name="accommodationId"
                defaultValue={enrollment.accommodation?.id ?? ''}
                disabled={isAccommodationClosed}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              >
                <option value="">Sem acomodação</option>
                {recommendedAccommodations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} ({item.accommodationType}) - ${(item.priceInCents / 100).toFixed(0)}/{item.priceUnit}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" size="sm" variant="outline" disabled={isAccommodationClosed}>
              Salvar acomodação
            </Button>
          </form>
          {enrollment.accommodation && (
            <p className="mt-2 text-xs text-slate-500">
              Atual: {enrollment.accommodation.title} • {(enrollment.accommodation.priceInCents / 100).toFixed(2)} {enrollment.accommodation.priceUnit}
            </p>
          )}
          {enrollment.accommodationOrder?.id ? (
            <Link href={`/accommodation-operations/${enrollment.accommodationOrder.id}`} className="mt-1 inline-block text-xs text-blue-600 hover:underline">
              Abrir operação da acomodação
            </Link>
          ) : enrollment.accommodation ? (
            <Link href={`/accommodations/${enrollment.accommodation.id}`} className="mt-1 inline-block text-xs text-blue-600 hover:underline">
              Abrir cadastro da acomodação
            </Link>
          ) : null}
          <p className="mt-1 text-xs text-slate-500">
            Status operacional da acomodação: <strong>{enrollment.accommodationStatus}</strong>
            {enrollment.accommodationClosedAt ? ` • Fechada em ${formatDateTime(enrollment.accommodationClosedAt)}` : ''}
          </p>
          {isAccommodationClosed && (
            <p className="mt-1 text-xs text-amber-700">
              Acomodação fechada. Troca/remoção bloqueada para preservar fechamento e faturamento.
            </p>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Order de acomodação vinculada</h2>
          <p className="mt-1 text-xs text-slate-500">
            A matrícula pode apontar para uma venda standalone de acomodação.
          </p>
          <form action={updateEnrollmentAccommodationOrderAction} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <label className="min-w-[320px] flex-1 text-xs font-medium text-slate-600">
              Order de acomodação
              <select
                name="orderId"
                defaultValue={enrollment.accommodationOrder?.id ?? ''}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              >
                <option value="">Sem order vinculada</option>
                {accommodationOrders.map((order) => {
                  const item = order.items.find((entry) => entry.itemType === 'accommodation');
                  const title = item?.accommodation?.title ?? 'Acomodação';
                  return (
                    <option key={order.id} value={order.id}>
                      {title} • {Number(order.totalAmount).toFixed(2)} {order.currency} • {order.status}
                    </option>
                  );
                })}
              </select>
            </label>
            <Button type="submit" size="sm" variant="outline">
              Vincular order
            </Button>
          </form>
          {enrollment.accommodationOrder ? (
            <Link href={`/orders/${enrollment.accommodationOrder.id}`} className="mt-2 inline-block text-xs text-blue-600 hover:underline">
              Abrir order vinculada
            </Link>
          ) : null}
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Workflow da Matrícula</h2>
          <p className="mt-1 text-xs text-slate-500">Atualize o progresso operacional da matrícula.</p>
          <form action={updateEnrollmentWorkflowAction} className="mt-4 grid gap-3">
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <label className="text-xs font-medium text-slate-600">
              Status
              <select name="status" defaultValue={enrollment.status} className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
                {STATUS_OPTIONS.map((option) => (
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
          <p className="mt-1 text-xs text-slate-500">Valores definidos pelo SaaS e cálculo de comissão no backend.</p>
          <form action={updateEnrollmentPricingAction} className="mt-4 grid grid-cols-2 gap-3">
            <input type="hidden" name="enrollmentId" value={enrollment.id} />
            <label className="text-xs font-medium text-slate-600">
              Base Price
              <input name="basePrice" type="number" min={0} step="0.01" defaultValue={pricing?.basePrice ?? ''} className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Fees
              <input name="fees" type="number" min={0} step="0.01" defaultValue={pricing?.fees ?? 0} className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Discounts
              <input name="discounts" type="number" min={0} step="0.01" defaultValue={pricing?.discounts ?? 0} className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Currency
              <input name="currency" defaultValue={pricing?.currency ?? 'CAD'} className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
            </label>
            <div className="col-span-2 flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              <span>Matrícula: {pricing?.enrollmentAmount ?? pricing?.basePrice ?? '-'}</span>
              <span>Acomodação: {pricing?.accommodationAmount ?? 0}</span>
              <span>Total pacote: {pricing?.packageTotalAmount ?? pricing?.totalAmount ?? '-'}</span>
              <span>Comissão matrícula: {pricing?.enrollmentCommissionAmount ?? '-'}</span>
              <span>Comissão acomodação: {pricing?.accommodationCommissionAmount ?? '-'}</span>
              <span>Comissão total: {pricing?.totalCommissionAmount ?? pricing?.commissionAmount ?? '-'} ({pricing?.commissionPercentage ?? 0}%)</span>
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
          <h2 className="text-sm font-semibold text-slate-900">Quote do pacote</h2>
          {!quote ? (
            <p className="mt-2 text-xs text-slate-500">Nenhuma quote associada à matrícula.</p>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
              <p>Tipo: <strong>{quote.type}</strong></p>
              <p>Status do pacote: <strong>{quote.packageStatus ?? 'draft'}</strong></p>
              {quote.nextStep ? <p className="col-span-2">{quote.nextStep}</p> : null}
              <p>Total: <strong>{Number(quote.totalAmount).toFixed(2)} {quote.currency}</strong></p>
              <p>Curso: {Number(quote.courseAmount).toFixed(2)} {quote.currency}</p>
              <p>Acomodação: {Number(quote.accommodationAmount).toFixed(2)} {quote.currency}</p>
              <p>Entrada ({Number(quote.downPaymentPercentage).toFixed(2)}%): {Number(quote.downPaymentAmount).toFixed(2)} {quote.currency}</p>
              <p>Saldo: {Number(quote.remainingAmount).toFixed(2)} {quote.currency}</p>
              <p>Comissão curso: {Number(quote.commissionCourseAmount).toFixed(2)} {quote.currency}</p>
              <p>Comissão acomodação: {Number(quote.commissionAccommodationAmount).toFixed(2)} {quote.currency}</p>
              <p>Comissão total: {Number(quote.commissionAmount).toFixed(2)} {quote.currency}</p>
              {(quote.items ?? []).length > 0 && (
                <div className="col-span-2 mt-1 rounded border border-slate-200 bg-slate-50 p-2">
                  <p className="text-[11px] font-semibold text-slate-700">Itens do pacote</p>
                  <div className="mt-1 space-y-1">
                    {quote.items?.map((item) => (
                      <p key={item.id} className="text-[11px] text-slate-600">
                        {item.itemType} • {new Date(item.startDate).toLocaleDateString('pt-BR')} - {new Date(item.endDate).toLocaleDateString('pt-BR')} • {Number(item.amount).toFixed(2)} {quote.currency} • comissão {Number(item.commissionAmount).toFixed(2)}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
