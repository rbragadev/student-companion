import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { StudentAdmin } from '@/types/catalog.types';

const columns: Column<StudentAdmin>[] = [
  {
    key: 'name',
    label: 'Aluno',
    render: (item) => (
      <div>
        <p className="font-medium text-slate-900">{item.firstName} {item.lastName}</p>
        <p className="text-xs text-slate-500">{item.email}</p>
      </div>
    ),
  },
  {
    key: 'destination',
    label: 'Destino',
    render: (item) => item.preferences ? `${item.preferences.destinationCity}, ${item.preferences.destinationCountry}` : '-',
  },
  {
    key: 'purpose',
    label: 'Objetivo',
    render: (item) => item.preferences?.purpose ?? '-',
  },
  {
    key: 'englishLevel',
    label: 'Inglês',
    render: (item) => item.preferences?.englishLevel ?? '-',
  },
  {
    key: 'studentStatus',
    label: 'Status Aluno',
    render: (item) => item.studentStatus ?? 'lead',
  },
];

export default async function StudentsPage() {
  await requirePermission('users.read');
  const students = await apiFetch<StudentAdmin[]>('/users/student').catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Alunos"
        description="Usuários estudantes e preferências usadas pelo mecanismo de recomendação"
      />
      <DataTable<StudentAdmin>
        columns={columns}
        data={students}
        keyExtractor={(item) => item.id}
        emptyTitle="Nenhum aluno encontrado"
        emptyDescription="Cadastre usuários STUDENT para popular este módulo."
      />
    </div>
  );
}
