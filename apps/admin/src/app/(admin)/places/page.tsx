import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { PlaceAdmin } from '@/types/catalog.types';

const columns: Column<PlaceAdmin>[] = [
  {
    key: 'name',
    label: 'Lugar',
    render: (item) => (
      <div>
        <p className="font-medium text-slate-900">{item.name}</p>
        <p className="text-xs text-slate-500">{item.category} • {item.location ?? '-'}</p>
      </div>
    ),
  },
  {
    key: 'rating',
    label: 'Nota',
    render: (item) => String(item.rating ?? '-'),
  },
  {
    key: 'status',
    label: 'Status',
    render: (item) => <Badge variant={item.isActive ? 'success' : 'default'}>{item.isActive ? 'Ativo' : 'Inativo'}</Badge>,
  },
];

export default async function PlacesPage() {
  await requirePermission('structure.read');
  const places = await apiFetch<PlaceAdmin[]>('/place').catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lugares"
        description="Pontos de interesse exibidos no app mobile"
      />
      <DataTable<PlaceAdmin>
        columns={columns}
        data={places}
        keyExtractor={(item) => item.id}
        emptyTitle="Nenhum lugar cadastrado"
        emptyDescription="O catálogo de lugares está vazio."
      />
    </div>
  );
}
