import Link from 'next/link';
import { Building2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { SchoolAdmin } from '@/types/catalog.types';

const columns: Column<SchoolAdmin>[] = [
  {
    key: 'name',
    label: 'Escola',
    render: (item) => (
      <div>
        <p className="font-medium text-slate-900">{item.name}</p>
        <p className="text-xs text-slate-500">{item.location}</p>
      </div>
    ),
  },
  {
    key: 'courses',
    label: 'Cursos',
    render: (item) => String(item._count?.course ?? 0),
  },
  {
    key: 'institution',
    label: 'Instituição',
    render: (item) => item.institution?.name ?? '-',
  },
  {
    key: 'partner',
    label: 'Parceira',
    render: (item) => <Badge variant={item.isPartner ? 'success' : 'default'}>{item.isPartner ? 'Sim' : 'Não'}</Badge>,
  },
];

export default async function SchoolsPage() {
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');
  const schools = await apiFetch<SchoolAdmin[]>('/school').catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Escolas (Catálogo do App)"
        description="Catálogo acadêmico exibido no app"
        actions={canWrite ? <Link href="/schools/new"><Button size="sm"><Plus size={14} />Nova escola</Button></Link> : undefined}
      />

      <DataTable<SchoolAdmin>
        columns={columns}
        data={schools}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/schools/${item.id}`}
        emptyTitle="Nenhuma escola cadastrada"
        emptyDescription="Cadastre escolas para habilitar cursos e recomendações no app."
        emptyAction={canWrite ? <Link href="/schools/new"><Button size="sm"><Building2 size={14} />Criar escola</Button></Link> : undefined}
      />
    </div>
  );
}
