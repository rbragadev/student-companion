import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { OrderAdmin } from '@/types/catalog.types';

function money(amount: number, currency: string) {
  return `${Number(amount ?? 0).toFixed(2)} ${currency}`;
}

export default async function OrderDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  await requirePermission('users.read');
  const { id } = await params;

  const order = await apiFetch<OrderAdmin>(`/orders/${id}`).catch(() => null);
  if (!order) notFound();
  const enrollmentForContext = order.enrollment?.id
    ? await apiFetch<{
        id: string;
        course: { id: string; program_name: string };
        accommodation?: { id: string; title: string } | null;
      }>(`/enrollments/${order.enrollment.id}`).catch(() => null)
    : null;

  const courseItems = order.items.filter((item) => item.itemType === 'course');
  const accommodationItems = order.items.filter((item) => item.itemType === 'accommodation');
  const hasAccommodationInEnrollmentOnly =
    accommodationItems.length === 0 && Boolean(enrollmentForContext?.accommodation?.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Detalhe da Order"
        description="Venda de curso/acomodação independente com vínculo opcional à matrícula."
        actions={(
          <Link href="/orders">
            <Button size="sm" variant="outline"><ArrowLeft size={14} />Voltar</Button>
          </Link>
        )}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Aluno</h2>
          <p className="mt-2 text-sm text-slate-700">
            {order.user?.firstName} {order.user?.lastName}
          </p>
          <p className="text-xs text-slate-500">{order.user?.email}</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Order</h2>
          <p className="mt-2 text-sm text-slate-700">Tipo: {order.type}</p>
          <p className="text-xs text-slate-500">Status: {order.status}</p>
          <p className="text-xs text-slate-500">Pagamento: {order.paymentStatus}</p>
          <p className="text-xs text-slate-500">Total: {money(order.totalAmount, order.currency)}</p>
          <p className="text-xs text-slate-500">
            Curso: {money(order.courseAmount ?? 0, order.currency)} • Acomodação:{' '}
            {money(order.accommodationAmount ?? 0, order.currency)}
          </p>
          <p className="text-xs text-slate-500">
            Entrada ({Number(order.downPaymentPercentage ?? 30).toFixed(2)}%):{' '}
            {money(order.downPaymentAmount ?? 0, order.currency)}
          </p>
          <p className="text-xs text-slate-500">
            Saldo: {money(order.remainingAmount ?? 0, order.currency)}
          </p>
          <p className="text-xs text-slate-500">
            Comissão: {money(order.commissionAmount ?? 0, order.currency)} ({Number(order.commissionPercentage ?? 0).toFixed(2)}%)
          </p>
          {order.enrollment?.id ? (
            <Link href={`/enrollments/${order.enrollment.id}`} className="mt-2 inline-block text-xs text-blue-600 hover:underline">
              Abrir matrícula vinculada
            </Link>
          ) : null}
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Item de curso</h2>
          {courseItems.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">Esta order não possui item de curso.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {courseItems.map((item) => (
                <div key={item.id} className="rounded border border-slate-200 p-3 text-xs text-slate-600">
                  <p className="font-medium text-slate-800">{item.course?.program_name ?? enrollmentForContext?.course.program_name ?? 'Curso'}</p>
                  <p>
                    Período: {new Date(item.startDate).toLocaleDateString('pt-BR')} -{' '}
                    {new Date(item.endDate).toLocaleDateString('pt-BR')}
                  </p>
                  <p>Valor: {money(item.amount, order.currency)}</p>
                  {order.enrollment?.id ? (
                    <Link
                      href={`/enrollments/${order.enrollment.id}`}
                      className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                    >
                      Abrir matrícula vinculada
                    </Link>
                  ) : null}
                  {item.course?.id ? (
                    <Link
                      href={`/courses/${item.course.id}`}
                      className="ml-3 mt-1 inline-block text-xs text-blue-600 hover:underline"
                    >
                      Abrir curso
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Item de acomodação</h2>
          {accommodationItems.length === 0 ? (
            <div className="mt-2 space-y-2 text-xs text-slate-500">
              <p>Esta order não possui item de acomodação explícito.</p>
              {hasAccommodationInEnrollmentOnly ? (
                <div className="rounded border border-amber-200 bg-amber-50 p-2 text-amber-700">
                  A matrícula vinculada possui acomodação: <strong>{enrollmentForContext?.accommodation?.title}</strong>.
                  <div>
                    <Link
                      href={`/enrollments/${order.enrollment!.id}`}
                      className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                    >
                      Abrir matrícula para ver o vínculo da acomodação
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {accommodationItems.map((item) => (
                <div key={item.id} className="rounded border border-slate-200 p-3 text-xs text-slate-600">
                  <p className="font-medium text-slate-800">{item.accommodation?.title ?? 'Acomodação'}</p>
                  <p>
                    Período: {new Date(item.startDate).toLocaleDateString('pt-BR')} -{' '}
                    {new Date(item.endDate).toLocaleDateString('pt-BR')}
                  </p>
                  <p>Valor: {money(item.amount, order.currency)}</p>
                  <Link
                    href={`/accommodation-operations/${order.id}`}
                    className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                  >
                    Abrir operação da acomodação
                  </Link>
                  {item.accommodation?.id ? (
                    <Link
                      href={`/accommodations/${item.accommodation.id}`}
                      className="ml-3 mt-1 inline-block text-xs text-blue-600 hover:underline"
                    >
                      Abrir cadastro da acomodação
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Resumo técnico dos itens</h2>
        <div className="mt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="rounded border border-slate-200 p-3 text-xs text-slate-600">
              <p className="font-medium text-slate-800">
                {item.itemType} • ref {item.referenceId}
              </p>
              <p>
                Período: {new Date(item.startDate).toLocaleDateString('pt-BR')} -{' '}
                {new Date(item.endDate).toLocaleDateString('pt-BR')}
              </p>
              <p>Valor: {money(item.amount, order.currency)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
