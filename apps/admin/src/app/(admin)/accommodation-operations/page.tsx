import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type {
  AccommodationAdmin,
  AccommodationPricingAdmin,
  EnrollmentAdmin,
  OrderAdmin,
  StudentAdmin,
} from '@/types/catalog.types';
import { NewAccommodationOrderForm } from './new-accommodation-order-form';

function money(value?: number, currency = 'CAD') {
  return `${Number(value ?? 0).toFixed(2)} ${currency}`;
}

export default async function AccommodationOperationsPage({
  searchParams,
}: Readonly<{ searchParams?: Promise<{ error?: string }> }>) {
  await requirePermission('users.read');

  const [orders, students, accommodations, pricingRows, enrollments] = await Promise.all([
    apiFetch<OrderAdmin[]>('/orders').catch(() => []),
    apiFetch<StudentAdmin[]>('/users/student').catch(() => []),
    apiFetch<AccommodationAdmin[]>('/accommodation').catch(() => []),
    apiFetch<AccommodationPricingAdmin[]>('/accommodation-pricing').catch(() => []),
    apiFetch<EnrollmentAdmin[]>('/enrollments').catch(() => []),
  ]);
  const params = (await searchParams) ?? {};
  const rows = orders.filter((order) =>
    order.items.some((item) => item.itemType === 'accommodation'),
  );

  const columns: Column<OrderAdmin>[] = [
    {
      key: 'student',
      label: 'Aluno',
      render: (order) => (
        <div>
          <p className="font-medium text-slate-900">{order.user?.firstName} {order.user?.lastName}</p>
          <p className="text-xs text-slate-500">{order.user?.email}</p>
        </div>
      ),
    },
    {
      key: 'accommodation',
      label: 'Acomodação',
      render: (order) => {
        const accItem = order.items.find((item) => item.itemType === 'accommodation');
        return (
          <div>
            <p className="font-medium text-slate-900">{accItem?.accommodation?.title ?? 'Acomodação'}</p>
            <p className="text-xs text-slate-500">
              {accItem?.accommodation?.accommodationType ?? '-'} •{' '}
              {accItem?.accommodation?.location ?? '-'}
            </p>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status da venda',
      render: (order) => `${order.status} • pagamento ${order.paymentStatus}`,
    },
    {
      key: 'financial',
      label: 'Acomodação / Total',
      render: (order) => {
        const accItem = order.items.find((item) => item.itemType === 'accommodation');
        return (
        <div>
          <p className="text-sm text-slate-700">
            Acomodação {money(Number(accItem?.amount ?? 0), order.currency)}
          </p>
          <p className="text-xs text-slate-500">
            Order total {money(Number(order.totalAmount), order.currency)}
          </p>
        </div>
      )},
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fechamento de Acomodação"
        description="Operação da venda de acomodação como produto independente, com vínculo opcional à matrícula."
      />

      {params.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {decodeURIComponent(params.error)}
        </div>
      ) : null}

      <NewAccommodationOrderForm
        students={students}
        accommodations={accommodations}
        pricingRows={pricingRows}
        enrollments={enrollments}
      />

      <DataTable<OrderAdmin>
        columns={columns}
        data={rows}
        keyExtractor={(order) => order.id}
        getRowHref={(order) => `/accommodation-operations/${order.id}`}
        emptyTitle="Nenhuma operação de acomodação encontrada"
        emptyDescription="Quando houver order com item de acomodação, ela aparecerá aqui."
      />
    </div>
  );
}
