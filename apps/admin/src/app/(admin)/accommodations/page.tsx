import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { AccommodationAdmin } from '@/types/catalog.types';

const columns: Column<AccommodationAdmin>[] = [
  {
    key: 'title',
    label: 'Acomodação',
    render: (item) => (
      <div>
        <p className="font-medium text-slate-900">{item.title}</p>
        <p className="text-xs text-slate-500">{item.location} • {item.accommodationType}</p>
      </div>
    ),
  },
  {
    key: 'price',
    label: 'Preço',
    render: (item) => `$${(item.priceInCents / 100).toFixed(0)}/${item.priceUnit}`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (item) => <Badge variant={item.isActive ? 'success' : 'default'}>{item.isActive ? 'Ativa' : 'Inativa'}</Badge>,
  },
];

export default async function AccommodationsPage() {
  await requirePermission('structure.read');
  const accommodations = await apiFetch<AccommodationAdmin[]>('/accommodation').catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Acomodações"
        description="Inventário de acomodações exibidas no app mobile"
      />
      <DataTable<AccommodationAdmin>
        columns={columns}
        data={accommodations}
        keyExtractor={(item) => item.id}
        emptyTitle="Nenhuma acomodação cadastrada"
        emptyDescription="O catálogo de acomodações está vazio."
      />
    </div>
  );
}
