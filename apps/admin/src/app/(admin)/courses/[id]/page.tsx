import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { CourseAdmin, CoursePricingAdmin, SchoolAdmin } from '@/types/catalog.types';
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

  const [course, schools, units, pricingRows] = await Promise.all([
    apiFetch<CourseAdmin>(`/course/${id}`).catch(() => null),
    apiFetch<SchoolAdmin[]>('/school').catch(() => []),
    apiFetch<Unit[]>('/unit').catch(() => []),
    apiFetch<CoursePricingAdmin[]>(`/course-pricing?courseId=${id}`).catch(() => []),
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
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Tipo de período</span>
            <select
              name="periodType"
              defaultValue={course.period_type ?? 'fixed'}
              disabled={!canWrite}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            >
              <option value="fixed">Fixo</option>
              <option value="weekly">Semanal</option>
            </select>
          </label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Preço (centavos)</span><input name="priceInCents" type="number" min={0} defaultValue={course.price_in_cents ?? ''} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Unidade de preço</span><input name="priceUnit" defaultValue={course.price_unit ?? ''} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Tipo de visto</span><input name="visaType" required defaultValue={course.visa_type} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Público-alvo</span><input name="targetAudience" required defaultValue={course.target_audience} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Imagem principal (URL)</span><input name="image" required defaultValue={course.image} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Imagens (URLs separadas por vírgula)</span><input name="images" defaultValue={course.images.join(', ')} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Badges (separadas por vírgula)</span><input name="badges" defaultValue={course.badges.join(', ')} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Descrição</span><textarea name="description" rows={4} required defaultValue={course.description} disabled={!canWrite} className="w-full rounded-lg border border-slate-300 p-3 text-sm disabled:bg-slate-100" /></label>
          <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" name="isActive" defaultChecked={course.is_active} disabled={!canWrite} className="h-4 w-4" /><span className="text-sm text-slate-700">Curso ativo</span></label>
          <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" name="autoApproveIntent" defaultChecked={course.auto_approve_intent ?? false} disabled={!canWrite} className="h-4 w-4" /><span className="text-sm text-slate-700">Auto-approve de intenção</span></label>
        </div>
        {canWrite && (
          <div className="flex items-center justify-between gap-2">
            <Button type="submit" variant="danger" formAction={deleteCourseAction.bind(null, course.id)}>Excluir curso</Button>
            <Button type="submit">Salvar alterações</Button>
          </div>
        )}
      </form>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Oferta e períodos do curso</h2>
        <p className="mt-1 text-xs text-slate-500">
          {course.period_type === 'weekly'
            ? 'Curso semanal: o app calcula valor por semana (per week) conforme duração selecionada em datas válidas.'
            : 'Curso fixo: o app exibe total price da oferta para o período selecionado.'}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Os períodos continuam vinculados às turmas, mas a regra de cálculo/preço da oferta fica centralizada no curso.
        </p>

        <div className="mt-4 space-y-2">
          {pricingRows.map((row) => (
            <div key={row.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium text-slate-900">{row.academicPeriod?.name ?? 'Período'}</p>
              <p className="text-slate-600">
                Preço base: {Number(row.basePrice).toFixed(2)} {row.currency}
              </p>
              <p className="text-slate-500">
                Janela: {row.academicPeriod?.startDate ? new Date(row.academicPeriod.startDate).toLocaleDateString() : '-'} -{' '}
                {row.academicPeriod?.endDate ? new Date(row.academicPeriod.endDate).toLocaleDateString() : '-'}
              </p>
            </div>
          ))}
          {pricingRows.length === 0 && (
            <p className="text-xs text-slate-500">Nenhum pricing configurado para este curso.</p>
          )}
        </div>
      </section>
    </div>
  );
}
