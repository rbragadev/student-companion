import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { AcademicPeriod } from '@/types/structure.types';
import type { CourseAdmin, CoursePricingAdmin } from '@/types/catalog.types';
import { createCoursePricingAction, updateCoursePricingAction } from './actions';

function money(value: number, currency: string) {
  return `${Number(value).toFixed(2)} ${currency}`;
}

export default async function CoursePricingPage() {
  await requirePermission('structure.read');

  const [rows, courses, periods] = await Promise.all([
    apiFetch<CoursePricingAdmin[]>('/course-pricing').catch(() => []),
    apiFetch<CourseAdmin[]>('/course').catch(() => []),
    apiFetch<AcademicPeriod[]>('/academic-period').catch(() => []),
  ]);

  const columns: Column<CoursePricingAdmin>[] = [
    {
      key: 'course',
      label: 'Curso',
      render: (item) => item.course?.program_name ?? '-',
    },
    {
      key: 'period',
      label: 'Período',
      render: (item) => item.academicPeriod?.name ?? '-',
    },
    {
      key: 'price',
      label: 'Preço',
      render: (item) => money(item.basePrice, item.currency),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (item.isActive ? 'Ativo' : 'Inativo'),
    },
    {
      key: 'actions',
      label: 'Atualizar',
      render: (item) => (
        <form action={updateCoursePricingAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={item.id} />
          <input
            name="basePrice"
            type="number"
            step="0.01"
            min={0}
            defaultValue={item.basePrice}
            className="h-8 w-24 rounded border border-slate-300 px-2 text-xs"
          />
          <input
            name="currency"
            defaultValue={item.currency}
            className="h-8 w-16 rounded border border-slate-300 px-2 text-xs"
          />
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input name="isActive" type="checkbox" defaultChecked={item.isActive} />
            ativo
          </label>
          <input
            name="duration"
            defaultValue={item.duration ?? ''}
            placeholder="duration"
            className="h-8 w-24 rounded border border-slate-300 px-2 text-xs"
          />
          <button type="submit" className="rounded bg-slate-900 px-2 py-1 text-xs text-white">
            Salvar
          </button>
        </form>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Preço de Curso por Período"
        description="Configura o preço real por curso e período letivo."
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Novo preço</h2>
        <form action={createCoursePricingAction} className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs text-slate-600">
            Curso
            <select name="courseId" className="mt-1 h-9 w-full rounded border border-slate-300 px-3 text-sm">
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.program_name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Período
            <select name="academicPeriodId" className="mt-1 h-9 w-full rounded border border-slate-300 px-3 text-sm">
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Preço base
            <input name="basePrice" type="number" step="0.01" min={0} className="mt-1 h-9 w-full rounded border border-slate-300 px-3 text-sm" />
          </label>
          <label className="text-xs text-slate-600">
            Moeda
            <input name="currency" defaultValue="CAD" className="mt-1 h-9 w-full rounded border border-slate-300 px-3 text-sm" />
          </label>
          <label className="text-xs text-slate-600 md:col-span-2">
            Duração (opcional)
            <input name="duration" className="mt-1 h-9 w-full rounded border border-slate-300 px-3 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600 md:col-span-2">
            <input name="isActive" type="checkbox" defaultChecked />
            Preço ativo
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-sm text-white">
              Criar preço
            </button>
          </div>
        </form>
      </section>

      <DataTable<CoursePricingAdmin>
        columns={columns}
        data={rows}
        keyExtractor={(item) => item.id}
        emptyTitle="Nenhum preço de curso cadastrado"
        emptyDescription="Cadastre ao menos um preço ativo para permitir intenção com curso."
      />
    </div>
  );
}
