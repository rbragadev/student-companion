import Link from 'next/link';
import { DataTable, type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { OrderAdmin } from '@/types/catalog.types';

function money(amount: number, currency: string) {
  return `${Number(amount ?? 0).toFixed(2)} ${currency}`;
}

export default async function OrdersPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<{
    type?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    includeDraft?: string;
  }>;
}>) {
  await requirePermission('users.read');
  const params = (await searchParams) ?? {};
  const selectedType = params.type ?? '';
  const selectedStatus = params.status ?? '';
  const fromDate = params.fromDate ?? '';
  const toDate = params.toDate ?? '';
  const includeDraft = params.includeDraft === '1';

  const qp = new URLSearchParams();
  if (selectedType) qp.set('type', selectedType);
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
      key: 'type',
      label: 'Tipo',
      render: (row) => row.type,
    },
    {
      key: 'createdAt',
      label: 'Data',
      render: (row) => new Date(row.createdAt).toLocaleDateString('pt-BR'),
    },
    {
      key: 'items',
      label: 'Itens',
      render: (row) => (
        <div className="space-y-1">
          {row.items.map((item) => (
            <p key={item.id} className="text-xs text-slate-600">
              {item.itemType === 'course'
                ? item.course?.program_name ?? 'Curso'
                : item.accommodation?.title ?? 'Acomodação'}
            </p>
          ))}
        </div>
      ),
    },
    {
      key: 'total',
      label: 'Valor',
      render: (row) => money(row.totalAmount, row.currency),
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
        title="Vendas / Orders"
        description="Curso e acomodação como produtos de venda independentes, com vínculo opcional à matrícula."
      />

      <form method="get" className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-5">
        <label className="space-y-1 text-sm">
          <span className="text-slate-600">Tipo</span>
          <select
            name="type"
            defaultValue={selectedType}
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="course">Curso</option>
            <option value="accommodation">Acomodação</option>
            <option value="package">Pacote</option>
          </select>
        </label>
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
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white"
        >
          Filtrar
        </button>
      </form>

      <DataTable<OrderAdmin>
        columns={columns}
        data={orders}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/orders/${item.id}`}
        emptyTitle="Nenhuma order encontrada"
        emptyDescription="As vendas de curso, acomodação e pacote aparecerão aqui."
      />
    </div>
  );
}
