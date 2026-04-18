import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Pencil } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { EnrollmentIntentAdmin, EnrollmentQuoteAdmin } from '@/types/catalog.types';
import { updateEnrollmentIntentAccommodationAction, updateEnrollmentIntentStatusAction } from '../actions';

const STATUS_LABEL: Record<EnrollmentIntentAdmin['student']['studentStatus'], string> = {
  lead: 'Lead',
  application_started: 'Application Started',
  pending_enrollment: 'Pending Enrollment',
  enrolled: 'Enrolled',
};

const INTENT_LABEL: Record<EnrollmentIntentAdmin['status'], string> = {
  pending: 'Pendente',
  converted: 'Convertida',
  cancelled: 'Cancelada',
  denied: 'Negada',
};

export default async function EnrollmentIntentDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  await requirePermission('users.read');
  const { id } = await params;

  const [intent, recommendedAccommodations, quote] = await Promise.all([
    apiFetch<EnrollmentIntentAdmin>(`/enrollment-intents/${id}`).catch(() => null),
    apiFetch<Array<{
      id: string;
      title: string;
      accommodationType: string;
      location: string;
      priceInCents: number;
      priceUnit: string;
      score?: number | null;
      recommendationBadge?: string | null;
    }>>(`/enrollment-intents/recommended-accommodations?intentId=${id}`).catch(() => []),
    apiFetch<EnrollmentQuoteAdmin>(`/quotes/by-intent/${id}`).catch(() => null),
  ]);
  if (!intent) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: 'Intenções', href: '/enrollment-intents' },
          { label: intent.student.firstName + ' ' + intent.student.lastName },
          { label: intent.course.program_name },
        ]}
      />
      <PageHeader
        title="Detalhe da Intenção de Matrícula"
        description="Consulta de vínculo aluno > curso > turma > período"
        actions={(
          <div className="flex items-center gap-2">
            {intent.status === 'pending' && (
              <>
                <Link href={`/enrollment-intents/${intent.id}/edit`}>
                  <Button size="sm" variant="outline"><Pencil size={14} />Editar</Button>
                </Link>
                <Link href={`/enrollment-intents/${intent.id}/confirm`}>
                  <Button size="sm"><CheckCircle2 size={14} />Confirmar matrícula</Button>
                </Link>
                <form action={updateEnrollmentIntentStatusAction}>
                  <input type="hidden" name="intentId" value={intent.id} />
                  <input type="hidden" name="status" value="cancelled" />
                  <Button type="submit" size="sm" variant="outline">Cancelar</Button>
                </form>
                <form action={updateEnrollmentIntentStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="intentId" value={intent.id} />
                  <input type="hidden" name="status" value="denied" />
                  <input
                    name="reason"
                    required
                    placeholder="Motivo da negativa"
                    className="h-9 rounded-lg border border-slate-300 px-3 text-xs"
                  />
                  <Button type="submit" size="sm" variant="outline">Negar</Button>
                </form>
              </>
            )}
            <Link href="/enrollment-intents">
              <Button size="sm" variant="outline"><ArrowLeft size={14} />Voltar</Button>
            </Link>
          </div>
        )}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Aluno</h2>
          <p className="mt-2 text-sm text-slate-700">{intent.student.firstName} {intent.student.lastName}</p>
          <p className="text-xs text-slate-500">{intent.student.email}</p>
          <p className="mt-2 text-xs text-slate-500">Status: {STATUS_LABEL[intent.student.studentStatus]}</p>
          <p className="mt-1 text-xs text-slate-500">Intenção: {INTENT_LABEL[intent.status]}</p>
          {intent.deniedReason && (
            <p className="mt-1 text-xs text-rose-600">Motivo da negativa: {intent.deniedReason}</p>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Curso</h2>
          <p className="mt-2 text-sm text-slate-700">{intent.course.program_name}</p>
          <p className="text-xs text-slate-500">
            {intent.course.school?.institution?.name ?? '-'} {'>'} {intent.course.school?.name ?? '-'}
          </p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Turma</h2>
          <p className="mt-2 text-sm text-slate-700">{intent.classGroup.name}</p>
          <p className="text-xs text-slate-500">Código: {intent.classGroup.code}</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Período</h2>
          <p className="mt-2 text-sm text-slate-700">{intent.academicPeriod.name}</p>
          <p className="text-xs text-slate-500">
            {new Date(intent.academicPeriod.startDate).toLocaleDateString('pt-BR')} - {new Date(intent.academicPeriod.endDate).toLocaleDateString('pt-BR')}
          </p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Acomodação do pacote (opcional)</h2>
          <p className="mt-1 text-xs text-slate-500">
            Sugestões recomendadas pela escola da intenção. Você pode confirmar com ou sem acomodação.
          </p>
          <form action={updateEnrollmentIntentAccommodationAction} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="intentId" value={intent.id} />
            <label className="min-w-[280px] flex-1 text-xs font-medium text-slate-600">
              Acomodação selecionada
              <select
                name="accommodationId"
                defaultValue={intent.accommodation?.id ?? ''}
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
            <Button type="submit" size="sm" variant="outline">Salvar acomodação</Button>
          </form>
          {intent.accommodation && (
            <p className="mt-2 text-xs text-slate-500">
              Atual: {intent.accommodation.title} • {(intent.accommodation.priceInCents / 100).toFixed(2)} {intent.accommodation.priceUnit}
            </p>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Quote do pacote</h2>
          {!quote ? (
            <p className="mt-2 text-xs text-slate-500">
              Ainda não há quote gerada para esta intenção.
            </p>
          ) : (
            <div className="mt-2 grid gap-1 text-xs text-slate-600 md:grid-cols-2">
              <p>Tipo: <strong>{quote.type}</strong></p>
              <p>Curso: {Number(quote.courseAmount).toFixed(2)} {quote.currency}</p>
              <p>Acomodação: {Number(quote.accommodationAmount).toFixed(2)} {quote.currency}</p>
              <p>Taxas: {Number(quote.fees).toFixed(2)} {quote.currency}</p>
              <p>Desconto: {Number(quote.discounts).toFixed(2)} {quote.currency}</p>
              <p>Total: <strong>{Number(quote.totalAmount).toFixed(2)} {quote.currency}</strong></p>
              <p>Entrada ({Number(quote.downPaymentPercentage).toFixed(2)}%): {Number(quote.downPaymentAmount).toFixed(2)} {quote.currency}</p>
              <p>Saldo: {Number(quote.remainingAmount).toFixed(2)} {quote.currency}</p>
              <p>Comissão curso: {Number(quote.commissionCourseAmount).toFixed(2)} {quote.currency}</p>
              <p>Comissão acomodação: {Number(quote.commissionAccommodationAmount).toFixed(2)} {quote.currency}</p>
              <p>Comissão total: {Number(quote.commissionAmount).toFixed(2)} {quote.currency} ({Number(quote.commissionPercentage).toFixed(2)}%)</p>
              {(quote.items ?? []).length > 0 && (
                <div className="md:col-span-2 mt-2 rounded border border-slate-200 bg-slate-50 p-2">
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
      </section>
    </div>
  );
}
