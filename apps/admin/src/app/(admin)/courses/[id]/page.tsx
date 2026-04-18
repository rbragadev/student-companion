import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { CourseAdmin, SchoolAdmin } from '@/types/catalog.types';
import type { Unit } from '@/types/structure.types';
import { CourseHierarchyFields } from '../course-hierarchy-fields';
import { deleteCourseAction, updateCourseAction } from '../actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: Readonly<PageProps>) {
  const { id } = await params;
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');

  const [course, schools, units] = await Promise.all([
    apiFetch<CourseAdmin>(`/course/${id}`).catch(() => null),
    apiFetch<SchoolAdmin[]>('/school').catch(() => []),
    apiFetch<Unit[]>('/unit').catch(() => []),
  ]);

  if (!course) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Curso: ${course.program_name}`}
        description="Edite dados do curso vinculado à unidade e exibido no app"
        actions={<Link href="/courses"><Button variant="outline" size="sm"><ArrowLeft size={14} />Voltar</Button></Link>}
      />

      <form action={updateCourseAction.bind(null, course.id)} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CourseHierarchyFields
            schools={schools}
            units={units}
            defaultSchoolId={course.school_id}
            defaultUnitId={course.unitId}
            disabled={!canWrite}
          />
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Nome do programa</span><input name="programName" required minLength={2} defaultValue={course.program_name} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Horas semanais</span><input name="weeklyHours" type="number" min={1} required defaultValue={course.weekly_hours} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Duração</span><input name="duration" required defaultValue={course.duration} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Preço (centavos)</span><input name="priceInCents" type="number" min={0} defaultValue={course.price_in_cents ?? ''} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Unidade de preço</span><input name="priceUnit" defaultValue={course.price_unit ?? ''} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Tipo de visto</span><input name="visaType" required defaultValue={course.visa_type} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Público-alvo</span><input name="targetAudience" required defaultValue={course.target_audience} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Imagem principal (URL)</span><input name="image" required defaultValue={course.image} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Imagens (URLs separadas por vírgula)</span><input name="images" defaultValue={course.images.join(', ')} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Badges (separadas por vírgula)</span><input name="badges" defaultValue={course.badges.join(', ')} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Descrição</span><textarea name="description" rows={4} required defaultValue={course.description} disabled={!canWrite} className="w-full rounded-lg border border-slate-300 p-3 text-sm disabled:bg-slate-100" /></label>
          <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" name="isActive" defaultChecked={course.is_active} disabled={!canWrite} className="h-4 w-4" /><span className="text-sm text-slate-700">Curso ativo</span></label>
        </div>
        {canWrite && (
          <div className="flex items-center justify-between gap-2">
            <Button type="submit" variant="danger" formAction={deleteCourseAction.bind(null, course.id)}>Excluir curso</Button>
            <Button type="submit">Salvar alterações</Button>
          </div>
        )}
      </form>
    </div>
  );
}
