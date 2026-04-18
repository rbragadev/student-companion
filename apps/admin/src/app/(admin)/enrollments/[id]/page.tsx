import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type {
  EnrollmentAdmin,
  EnrollmentTimelineEventAdmin,
} from '@/types/catalog.types';
import {
  createEnrollmentDocumentAction,
  updateEnrollmentAccommodationAction,
  updateEnrollmentAccommodationWorkflowAction,
  createEnrollmentMessageAction,
  updateEnrollmentDocumentAction,
  updateEnrollmentPricingAction,
  updateEnrollmentWorkflowAction,
} from '../actions';

const STATUS_OPTIONS = [
  { value: 'application_started', label: 'Application Started' },
  { value: 'documents_pending', label: 'Documents Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
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
      <PageHeader
        title="Detalhe da Matrícula"
        description="Fluxo operacional, documentos, mensagens, timeline e pricing."
        actions={(
          <Link href="/enrollments">
            <Button size="sm" variant="outline"><ArrowLeft size={14} />Voltar</Button>
          </Link>
        )}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Aluno</h2>
          <p className="mt-2 text-sm text-slate-700">{enrollment.student.firstName} {enrollment.student.lastName}</p>
          <p className="text-xs text-slate-500">{enrollment.student.email}</p>
          <p className="mt-1 text-xs text-slate-500">Status aluno (global): {enrollment.student.studentStatus}</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Contexto</h2>
          <p className="mt-2 text-sm text-slate-700">{enrollment.institution.name}</p>
          <p className="text-xs text-slate-500">{enrollment.school.name} • {enrollment.unit.name} ({enrollment.unit.code})</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Curso e Turma</h2>
          <p className="mt-2 text-sm text-slate-700">{enrollment.course.program_name}</p>
          <p className="text-xs text-slate-500">{enrollment.classGroup.name} ({enrollment.classGroup.code})</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Período e Status</h2>
          <p className="mt-2 text-sm text-slate-700">{enrollment.academicPeriod.name}</p>
          <p className="text-xs text-slate-500">
            {new Date(enrollment.academicPeriod.startDate).toLocaleDateString('pt-BR')} - {new Date(enrollment.academicPeriod.endDate).toLocaleDateString('pt-BR')}
          </p>
          <p className="mt-1 text-xs text-slate-500">Status matrícula: {enrollment.status}</p>
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
