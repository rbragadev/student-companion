import Link from 'next/link';
import { BookOpen, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { CourseAdmin } from '@/types/catalog.types';

const columns: Column<CourseAdmin>[] = [
  {
    key: 'program_name',
    label: 'Curso',
    render: (item) => (
      <div>
        <p className="font-medium text-slate-900">{item.program_name}</p>
        <p className="text-xs text-slate-500">
          {item.school?.institution?.name ?? '-'} {'>'} {item.school?.name ?? '-'} {'>'} {item.unit?.name ?? '-'}
        </p>
      </div>
    ),
  },
  {
    key: 'duration',
    label: 'Duração',
  },
  {
    key: 'price',
    label: 'Preço',
    render: (item) => item.price_in_cents ? `$${(item.price_in_cents / 100).toFixed(0)}/${item.price_unit ?? 'unit'}` : '-',
  },
  {
    key: 'status',
    label: 'Status',
    render: (item) => <Badge variant={item.is_active ? 'success' : 'default'}>{item.is_active ? 'Ativo' : 'Inativo'}</Badge>,
  },
];

export default async function CoursesPage() {
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');
  const courses = await apiFetch<CourseAdmin[]>('/course').catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cursos (Catálogo do App)"
        description="Cursos exibidos no mobile e usados pelo mecanismo de recomendação"
        actions={canWrite ? <Link href="/courses/new"><Button size="sm"><Plus size={14} />Novo curso</Button></Link> : undefined}
      />

      <DataTable<CourseAdmin>
        columns={columns}
        data={courses}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/courses/${item.id}`}
        emptyTitle="Nenhum curso cadastrado"
        emptyDescription="Cadastre cursos vinculados a escolas para habilitar o catálogo do app."
        emptyAction={canWrite ? <Link href="/courses/new"><Button size="sm"><BookOpen size={14} />Criar curso</Button></Link> : undefined}
      />
    </div>
  );
}
