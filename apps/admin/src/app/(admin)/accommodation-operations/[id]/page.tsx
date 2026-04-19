import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { EnrollmentAdmin, OrderAdmin } from '@/types/catalog.types';
import {
  sendAccommodationOrderMessageAction,
  updateAccommodationOrderWorkflowAction,
  updateStandaloneAccommodationOrderStatusAction,
} from '../actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

function money(amount: number | undefined, currency: string) {
  return `${Number(amount ?? 0).toFixed(2)} ${currency}`;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

function toneByStatus(status?: string | null) {
  const value = String(status ?? '').toLowerCase();
  if (value.includes('paid') || value === 'closed' || value === 'approved') {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (value.includes('pending') || value.includes('submitted') || value.includes('selected')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (value.includes('cancel') || value.includes('failed') || value.includes('denied') || value.includes('rejected')) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export default async function AccommodationOperationDetailPage({ params }: Readonly<PageProps>) {
  await requirePermission('users.read');
  const { id } = await params;

  const order = await apiFetch<OrderAdmin>(`/orders/${id}`).catch(() => null);
  if (!order) notFound();

  const accommodationItem = order.items.find((item) => item.itemType === 'accommodation');
  if (!accommodationItem) notFound();

  const enrollment = order.enrollment?.id
    ? await apiFetch<EnrollmentAdmin>(`/enrollments/${order.enrollment.id}`).catch(() => null)
    : null;
  const accommodationMessages =
    enrollment?.messages?.filter((item) => (item.channel ?? 'enrollment') === 'accommodation') ?? [];

  const isLinked = Boolean(enrollment?.id);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: 'Fechamento Acomodação', href: '/accommodation-operations' },
          { label: accommodationItem.accommodation?.title ?? 'Acomodação' },
        ]}
      />
      <PageHeader
        title="Venda da Acomodação"
        description="Workflow e comunicação da acomodação como produto vendido, separado da matrícula."
        actions={(
          <Link href="/accommodation-operations">
            <Button variant="outline" size="sm"><ArrowLeft size={14} />Voltar</Button>
          </Link>
        )}
      />

      <section className="grid gap-3 md:grid-cols-4">
        <article className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Produto vendido</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{accommodationItem.accommodation?.title ?? 'Acomodação'}</p>
          <p className="text-xs text-slate-500">
            {formatDate(accommodationItem.startDate)} - {formatDate(accommodationItem.endDate)}
          </p>
          <p className="mt-1 text-xs text-slate-700">
            Valor do item: <strong>{money(accommodationItem.amount, order.currency)}</strong>
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status comercial</p>
          <p className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneByStatus(order.status)}`}>
            {order.status}
          </p>
          <p className="mt-2 text-xs text-slate-500">Tipo de venda: {order.type}</p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status pagamento</p>
          <p className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneByStatus(order.paymentStatus)}`}>
            {order.paymentStatus}
          </p>
          <p className="mt-2 text-xs text-slate-500">Total da venda: {money(order.totalAmount, order.currency)}</p>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Dados da Acomodação Vendida</h2>
          <p className="mt-2 text-sm text-slate-700">{accommodationItem.accommodation?.title ?? 'Acomodação'}</p>
          <p className="text-xs text-slate-500">
            {accommodationItem.accommodation?.accommodationType ?? '-'} • {accommodationItem.accommodation?.location ?? '-'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Estadia: {formatDate(accommodationItem.startDate)} - {formatDate(accommodationItem.endDate)}
          </p>
          <p className="text-xs text-slate-500">
            Valor da acomodação: {money(accommodationItem.amount, order.currency)}
          </p>
          <p className="text-xs text-slate-500">Total da order: {money(order.totalAmount, order.currency)}</p>
          {accommodationItem.accommodation?.id ? (
            <Link href={`/accommodations/${accommodationItem.accommodation.id}`} className="mt-2 inline-block text-xs text-blue-600 hover:underline">
              Abrir cadastro base da acomodação
            </Link>
          ) : null}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Contexto Comercial da Venda</h2>
          <p className="mt-2 text-sm text-slate-700">
            {order.user?.firstName} {order.user?.lastName}
          </p>
          <p className="text-xs text-slate-500">{order.user?.email}</p>
          <p className="mt-1 text-xs text-slate-500">Order: {order.id}</p>
          <p className="text-xs text-slate-500">Status order: {order.status}</p>
          <p className="text-xs text-slate-500">Pagamento: {order.paymentStatus}</p>
          {isLinked ? (
            <>
              <p className="mt-2 text-xs text-slate-700">Vínculo operacional: matrícula ativa</p>
              <Link href={`/enrollments/${enrollment!.id}`} className="mt-1 inline-block text-xs text-blue-600 hover:underline">
                Abrir matrícula vinculada
              </Link>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Sem matrícula vinculada (standalone).</p>
          )}
        </article>
      </section>

      {isLinked ? (
        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Workflow da acomodação</h2>
            <p className="mt-1 text-xs text-slate-500">Opera apenas o status da acomodação no contexto da venda.</p>
            <form action={updateAccommodationOrderWorkflowAction} className="mt-4 grid gap-3">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="enrollmentId" value={enrollment!.id} />
              <label className="text-xs font-medium text-slate-600">
                Status da acomodação
                <select
                  name="status"
                  defaultValue={enrollment!.accommodationStatus}
                  className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
                >
                  <option value="not_selected">Não selecionada</option>
                  <option value="selected">Selecionada</option>
                  <option value="approved">Aprovada</option>
                  <option value="denied">Negada</option>
                  <option value="closed">Fechada</option>
                </select>
              </label>
              <label className="text-xs font-medium text-slate-600">
                Motivo (opcional)
                <textarea
                  name="reason"
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Ex.: acomodação validada e pronta para operação"
                />
              </label>
              <div>
                <Button type="submit" size="sm">Atualizar workflow</Button>
              </div>
            </form>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-slate-900">Chat da acomodação</h2>
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
              {accommodationMessages.length ? (
                accommodationMessages.map((message) => (
                  <div key={message.id} className="rounded border border-slate-200 bg-white p-2">
                    <p className="text-xs font-medium text-slate-800">
                      {message.sender?.firstName} {message.sender?.lastName} • {new Date(message.createdAt).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-slate-600">{message.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">Sem mensagens de acomodação.</p>
              )}
            </div>
            <form action={sendAccommodationOrderMessageAction} className="mt-3 grid gap-2">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="enrollmentId" value={enrollment!.id} />
              <textarea
                name="message"
                rows={3}
                required
                placeholder="Mensagem para equipe/aluno sobre a acomodação"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div>
                <Button type="submit" size="sm">Enviar mensagem</Button>
              </div>
            </form>
          </article>
        </section>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Workflow da order standalone</h2>
          <p className="mt-1 text-xs text-slate-500">
            Sem matrícula vinculada: você pode operar status comercial e pagamento direto na order.
          </p>
          <form action={updateStandaloneAccommodationOrderStatusAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input type="hidden" name="orderId" value={order.id} />
            <label className="text-xs font-medium text-slate-600">
              Status da order
              <select
                name="status"
                defaultValue={order.status}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              >
                <option value="draft">draft</option>
                <option value="submitted">submitted</option>
                <option value="approved">approved</option>
                <option value="cancelled">cancelled</option>
                <option value="closed">closed</option>
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Status de pagamento
              <select
                name="paymentStatus"
                defaultValue={order.paymentStatus}
                className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              >
                <option value="pending">pending</option>
                <option value="partially_paid">partially_paid</option>
                <option value="paid">paid</option>
                <option value="failed">failed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </label>
            <div className="md:col-span-2">
              <Button type="submit" size="sm">Salvar status da order</Button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
