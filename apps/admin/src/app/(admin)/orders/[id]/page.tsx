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
          {order.enrollment?.id ? (
            <Link href={`/enrollments/${order.enrollment.id}`} className="mt-2 inline-block text-xs text-blue-600 hover:underline">
              Abrir matrícula vinculada
            </Link>
          ) : null}
        </article>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Itens</h2>
        <div className="mt-3 space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="rounded border border-slate-200 p-3 text-xs text-slate-600">
              <p className="font-medium text-slate-800">
                {item.itemType === 'course'
                  ? item.course?.program_name ?? 'Curso'
                  : item.accommodation?.title ?? 'Acomodação'}
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

