import Link from 'next/link';
import { DataTable, type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { OrderAdmin } from '@/types/catalog.types';

function money(amount: number, currency: string) {
  return `${Number(amount ?? 0).toFixed(2)} ${currency}`;
}

export default async function OrdersPage() {
  await requirePermission('users.read');

  const orders = await apiFetch<OrderAdmin[]>('/orders').catch(() => []);

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

