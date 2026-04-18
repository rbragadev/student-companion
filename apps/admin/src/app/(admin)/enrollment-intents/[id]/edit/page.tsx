import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { CourseAdmin, EnrollmentIntentAdmin } from '@/types/catalog.types';
import type { AcademicPeriod, ClassGroup } from '@/types/structure.types';
import { updateEnrollmentIntentAction } from '../../actions';

export default async function EditEnrollmentIntentPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  await requirePermission('users.write');
  const { id } = await params;

  const [intent, courses, classGroups, periods, recommendedAccommodations] = await Promise.all([
    apiFetch<EnrollmentIntentAdmin>(`/enrollment-intents/${id}`).catch(() => null),
    apiFetch<CourseAdmin[]>('/course').catch(() => []),
    apiFetch<ClassGroup[]>('/class-group').catch(() => []),
    apiFetch<AcademicPeriod[]>('/academic-period').catch(() => []),
    apiFetch<Array<{
      id: string;
      title: string;
      accommodationType: string;
      priceInCents: number;
      priceUnit: string;
    }>>(`/enrollment-intents/recommended-accommodations?intentId=${id}`).catch(() => []),
  ]);

  if (!intent) notFound();
  if (intent.status !== 'pending') {
    return (
      <div className="flex flex-col gap-4">
        <Breadcrumbs
          items={[
            { label: 'Intenções', href: '/enrollment-intents' },
            { label: intent.student.firstName + ' ' + intent.student.lastName, href: `/enrollment-intents/${id}` },
            { label: 'Editar' },
          ]}
        />
        <PageHeader title="Intenção não editável" description="Apenas intenções pendentes podem ser alteradas." />
        <Link href={`/enrollment-intents/${id}`}>
          <Button size="sm" variant="outline"><ArrowLeft size={14} />Voltar ao detalhe</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: 'Intenções', href: '/enrollment-intents' },
          { label: intent.student.firstName + ' ' + intent.student.lastName, href: `/enrollment-intents/${id}` },
          { label: 'Editar' },
        ]}
      />
      <PageHeader
        title="Editar Intenção de Matrícula"
        description="Troque curso, turma e período antes da confirmação."
        actions={(
          <Link href={`/enrollment-intents/${id}`}>
            <Button size="sm" variant="outline"><ArrowLeft size={14} />Cancelar</Button>
          </Link>
        )}
      />

      <form action={updateEnrollmentIntentAction} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2">
        <input type="hidden" name="intentId" value={intent.id} />

        <label className="text-sm text-slate-700">
          Curso
          <select name="courseId" defaultValue={intent.course.id} className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.program_name}</option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700">
          Turma
          <select name="classGroupId" defaultValue={intent.classGroup.id} className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
            {classGroups.map((group) => (
              <option key={group.id} value={group.id}>{group.name} ({group.code})</option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700 md:col-span-2">
          Período
          <select name="academicPeriodId" defaultValue={intent.academicPeriod.id} className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
            {periods.map((period) => (
              <option key={period.id} value={period.id}>{period.name}</option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700 md:col-span-2">
          Acomodação (opcional)
          <select
            name="accommodationId"
            defaultValue={intent.accommodation?.id ?? ''}
            className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
          >
            <option value="">Sem acomodação</option>
            {recommendedAccommodations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.accommodationType}) - ${(item.priceInCents / 100).toFixed(0)}/{item.priceUnit}
              </option>
            ))}
          </select>
        </label>

        <div className="md:col-span-2 flex justify-end">
          <Button type="submit">Salvar alteração</Button>
        </div>
      </form>
    </div>
  );
}
