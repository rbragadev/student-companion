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
}: Readonly<{
  searchParams?: Promise<{
    error?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    includeDraft?: string;
  }>;
}>) {
  await requirePermission('users.read');

  const params = (await searchParams) ?? {};
  const selectedStatus = params.status ?? '';
  const fromDate = params.fromDate ?? '';
  const toDate = params.toDate ?? '';
  const includeDraft = params.includeDraft !== '0';

  const [orders, students, accommodations, pricingRows, enrollments] = await Promise.all([
    (async () => {
      const qp = new URLSearchParams();
      qp.set('type', 'accommodation');
      if (selectedStatus) qp.set('status', selectedStatus);
      if (fromDate) qp.set('fromDate', fromDate);
      if (toDate) qp.set('toDate', toDate);
      if (!includeDraft) qp.set('excludeDraft', 'true');
      return apiFetch<OrderAdmin[]>(`/orders?${qp.toString()}`).catch(() => []);
    })(),
    apiFetch<StudentAdmin[]>('/users/student').catch(() => []),
    apiFetch<AccommodationAdmin[]>('/accommodation').catch(() => []),
    apiFetch<AccommodationPricingAdmin[]>('/accommodation-pricing').catch(() => []),
    apiFetch<EnrollmentAdmin[]>('/enrollments').catch(() => []),
  ]);
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
        title="Acomodação"
        description="Operação da venda de acomodação como produto independente, com vínculo opcional à matrícula."
      />

      {params.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {decodeURIComponent(params.error)}
        </div>
      ) : null}

      <form method="get" className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span className="text-slate-600">Status</span>
          <input
            name="status"
            defaultValue={selectedStatus}
            placeholder="submitted"
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-600">De</span>
          <input
            name="fromDate"
            type="date"
            defaultValue={fromDate}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-slate-600">Até</span>
          <input
            name="toDate"
            type="date"
            defaultValue={toDate}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="includeDraft"
            value="1"
            defaultChecked={includeDraft}
          />
          <span>Incluir rascunhos</span>
        </label>
        <button
          type="submit"
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white sm:col-span-4 sm:w-40"
        >
          Filtrar
        </button>
      </form>

      <NewAccommodationOrderForm
        students={students}
        accommodations={accommodations}
        pricingRows={pricingRows}
        enrollments={enrollments}
      />

      <DataTable<OrderAdmin>
        columns={columns}
        data={orders}
        keyExtractor={(order) => order.id}
        getRowHref={(order) => `/accommodation-operations/${order.id}`}
        emptyTitle="Nenhuma operação de acomodação encontrada"
        emptyDescription="Quando houver order com item de acomodação, ela aparecerá aqui."
      />
    </div>
  );
}
