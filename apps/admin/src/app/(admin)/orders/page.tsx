import Link from 'next/link';
import { DataTable, type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { formatDatePtBr } from '@/lib/date';
import type { OrderAdmin } from '@/types/catalog.types';

function money(amount: number, currency: string) {
  return `${Number(amount ?? 0).toFixed(2)} ${currency}`;
}

export default async function PackageOperationsPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<{
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
  const includeDraft = params.includeDraft === '1';

  const qp = new URLSearchParams();
  qp.set('type', 'package');
  if (selectedStatus) qp.set('status', selectedStatus);
  if (fromDate) qp.set('fromDate', fromDate);
  if (toDate) qp.set('toDate', toDate);
  if (!includeDraft) qp.set('excludeDraft', 'true');

  const orders = await apiFetch<OrderAdmin[]>(`/orders?${qp.toString()}`).catch(() => []);

  const columns: Column<OrderAdmin>[] = [
    {
      key: 'user',
      label: 'Aluno',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">
            {row.user?.firstName} {row.user?.lastName}
          </p>
          <p className="text-xs text-slate-500">{row.user?.email}</p>
        </div>
      ),
    },
    {
      key: 'package_items',
      label: 'Itens do pacote',
      render: (row) => {
        const courseItem = row.items.find((item) => item.itemType === 'course');
        const accommodationItem = row.items.find((item) => item.itemType === 'accommodation');

        if (!courseItem && !accommodationItem) {
          return <p className="text-xs text-slate-500">Sem itens</p>;
        }

        return (
          <div className="space-y-1">
            {courseItem ? (
              <p className="text-xs text-slate-700">{courseItem.course?.program_name ?? 'Curso'}</p>
            ) : null}
            {accommodationItem ? (
              <p className="text-xs text-slate-700">{accommodationItem.accommodation?.title ?? 'Acomodação'}</p>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'window',
      label: 'Janela',
      render: (row) => {
        const courseItem = row.items.find((item) => item.itemType === 'course');
        const accommodationItem = row.items.find((item) => item.itemType === 'accommodation');
        const item = courseItem ?? accommodationItem;
        if (!item) return <span className="text-xs text-slate-500">-</span>;

        return (
          <p className="text-xs text-slate-600">
            {formatDatePtBr(item.startDate)} - {formatDatePtBr(item.endDate)}
          </p>
        );
      },
    },
    {
      key: 'total',
      label: 'Composição financeira',
      render: (row) => (
        <div>
          <p className="text-sm text-slate-700">Total: {money(row.totalAmount, row.currency)}</p>
          <p className="text-xs text-slate-500">Curso: {money(row.courseAmount ?? 0, row.currency)}</p>
          <p className="text-xs text-slate-500">Acomodação: {money(row.accommodationAmount ?? 0, row.currency)}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <div>
          <p className="text-sm text-slate-700">{row.status}</p>
          <p className="text-xs text-slate-500">Pagamento: {row.paymentStatus}</p>
        </div>
      ),
    },
    {
      key: 'enrollment',
      label: 'Matrícula',
      render: (row) =>
        row.enrollment?.id ? (
          <Link href={`/enrollments/${row.enrollment.id}`} className="text-xs text-blue-600 hover:underline">
            Abrir matrícula
          </Link>
        ) : (
          <span className="text-xs text-slate-400">Standalone</span>
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pacote"
        description="Operações de pacote (curso + acomodação) com vínculo para a matrícula."
      />

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

      <DataTable<OrderAdmin>
        columns={columns}
        data={orders}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/package-operations/${item.id}`}
        emptyTitle="Nenhuma order encontrada"
        emptyDescription="Pacotes de curso + acomodação aparecem aqui."
      />
    </div>
  );
}
