import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { toDateInputValue } from '@/lib/date';
import type { CourseAdmin, CoursePricingAdmin, EnrollmentAdmin, SchoolAdmin } from '@/types/catalog.types';
import type { AcademicPeriod, ClassGroup, Unit } from '@/types/structure.types';
import { CourseHierarchyFields } from '../course-hierarchy-fields';
import { CoursePricingPeriodFields } from '../course-pricing-period-fields';
import {
  createCoursePricingInlineAction,
  deleteCourseAction,
  updateCourseAction,
  updateCoursePricingInlineAction,
} from '../actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CourseDetailPage({ params }: Readonly<PageProps>) {
  const { id } = await params;
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');

  const [course, schools, units, pricingRows, classGroups, periods, linkedEnrollments] = await Promise.all([
    apiFetch<CourseAdmin>(`/course/${id}`).catch(() => null),
    apiFetch<SchoolAdmin[]>('/school').catch(() => []),
    apiFetch<Unit[]>('/unit').catch(() => []),
    apiFetch<CoursePricingAdmin[]>(`/course-pricing?courseId=${id}`).catch(() => []),
    apiFetch<ClassGroup[]>(`/class-group?courseId=${id}`).catch(() => []),
    apiFetch<AcademicPeriod[]>('/academic-period').catch(() => []),
    apiFetch<EnrollmentAdmin[]>(`/enrollments?courseId=${id}`).catch(() => []),
  ]);

  if (!course) notFound();
  const linkedStudentsCount = linkedEnrollments.length;
  const linkedRevenue = linkedEnrollments.reduce(
    (total, enrollment) =>
      total + Number(enrollment.pricing?.packageTotalAmount ?? enrollment.pricing?.totalAmount ?? 0),
    0,
  );
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: 'Cursos', href: '/courses' },
          { label: course.school?.institution?.name ?? 'Instituição' },
          { label: course.school?.name ?? 'Escola' },
          { label: course.program_name },
        ]}
      />
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
            <span className="text-sm font-medium text-slate-700">Tipo de oferta</span>
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
        <h2 className="text-sm font-semibold text-slate-900">Oferta e janelas de datas do curso</h2>
        <p className="mt-1 text-xs text-slate-500">
          {course.period_type === 'weekly'
            ? 'Curso semanal: o app cobra por semana (base price / week). Duração exibida automaticamente por seleção de janela semanal.'
            : 'Curso fixo: o app exibe total price da oferta para a janela selecionada.'}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          A estrutura interna usa janelas vinculadas às turmas, mas a regra de cálculo/preço da oferta fica centralizada no curso.
        </p>

        <div className="mt-4 space-y-2">
          {canWrite && (
            <form action={createCoursePricingInlineAction.bind(null, course.id)} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 text-sm sm:grid-cols-6">
              <input type="hidden" name="courseId" value={course.id} />
              <select name="classGroupId" required className="h-9 rounded-lg border border-slate-300 px-3 text-sm">
                <option value="">Turma interna</option>
                {classGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                  {group.name} ({group.code})
                  </option>
                ))}
              </select>
              <CoursePricingPeriodFields
                periodType={course.period_type ?? 'fixed'}
                startDate=""
                endDate=""
                duration=""
                canWrite={canWrite}
              />
              <input
                name="basePrice"
                type="number"
                min={0}
                step="0.01"
                required
                placeholder={course.period_type === 'weekly' ? 'Preço base por semana' : 'Preço base da janela'}
                className="h-9 rounded-lg border border-slate-300 px-3 text-sm"
              />
              <input name="currency" defaultValue="CAD" required className="h-9 rounded-lg border border-slate-300 px-3 text-sm" />
              <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm">
                <input type="checkbox" name="isActive" defaultChecked />
                Ativo
              </label>
              <Button type="submit" size="sm">Adicionar pricing</Button>
            </form>
          )}
          {pricingRows.map((row) => (
            <form key={row.id} action={updateCoursePricingInlineAction.bind(null, course.id)} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 text-sm sm:grid-cols-6">
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="classGroupId" value={row.academicPeriod?.classGroupId ?? ''} />
              <div className="sm:col-span-2">
                <p className="font-medium text-slate-900">
                  Janela de datas
                  {row.academicPeriod?.classGroup?.name
                    ? ` • ${row.academicPeriod.classGroup.name} (${row.academicPeriod.classGroup.code})`
                    : ''}
                </p>
                <p className="text-xs text-slate-500">
                  Janela: {row.academicPeriod?.startDate ? toDateInputValue(row.academicPeriod.startDate) : '-'} -{' '}
                  {row.academicPeriod?.endDate ? toDateInputValue(row.academicPeriod.endDate) : '-'}
                </p>
              </div>
              <CoursePricingPeriodFields
                periodType={course.period_type ?? 'fixed'}
                startDate={row.academicPeriod?.startDate ? toDateInputValue(row.academicPeriod.startDate) : ''}
                endDate={row.academicPeriod?.endDate ? toDateInputValue(row.academicPeriod.endDate) : ''}
                duration={row.duration ?? ''}
                canWrite={canWrite}
              />
              <input name="basePrice" type="number" min={0} step="0.01" defaultValue={Number(row.basePrice)} disabled={!canWrite} className="h-9 rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" />
              <input name="currency" defaultValue={row.currency} disabled={!canWrite} className="h-9 rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" />
              <div className="flex items-center gap-2">
                <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm">
                  <input type="checkbox" name="isActive" defaultChecked={row.isActive} disabled={!canWrite} />
                  Ativo
                </label>
                <Button type="submit" size="sm" disabled={!canWrite}>Salvar</Button>
              </div>
            </form>
          ))}
          {pricingRows.length === 0 && (
            <p className="text-xs text-slate-500">Nenhum pricing configurado para este curso.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Turmas internas vinculadas</h2>
        <p className="mt-1 text-xs text-slate-500">
          Turma é operacional interno do admin. O aluno não escolhe turma no app.
        </p>
        <div className="mt-4 space-y-2">
          {classGroups.map((group) => {
            const countPeriods = periods.filter((period) => period.classGroupId === group.id).length;
            return (
              <div key={group.id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">
                  {group.name} ({group.code})
                </p>
                <p className="text-xs text-slate-500">Status: {group.status}</p>
                <p className="text-xs text-slate-500">Janelas internas: {countPeriods}</p>
              </div>
            );
          })}
          {classGroups.length === 0 && (
            <p className="text-xs text-slate-500">Nenhuma turma cadastrada para este curso.</p>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <Link href="/class-groups/new">
            <Button variant="outline" size="sm">Nova turma interna</Button>
          </Link>
          <Link href="/class-groups">
            <Button variant="outline" size="sm">Gerenciar turmas</Button>
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Matrículas vinculadas</h2>
        <p className="mt-1 text-xs text-slate-500">Operação: acompanhe alunos usando este curso e acesse a matrícula direto.</p>
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p>Alunos vinculados: <strong>{linkedStudentsCount}</strong></p>
          <p>Receita estimada (pacotes): <strong>{linkedRevenue.toFixed(2)} CAD</strong></p>
        </div>
        <div className="mt-3 space-y-2">
          {linkedEnrollments.map((enrollment) => (
            <Link
              key={enrollment.id}
              href={`/enrollments/${enrollment.id}`}
              className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
            >
              <p className="text-sm font-medium text-slate-900">
                {enrollment.student.firstName} {enrollment.student.lastName}
              </p>
              <p className="text-xs text-slate-500">
                {enrollment.academicPeriod.name} • {enrollment.status}
                {enrollment.accommodation ? ` • com ${enrollment.accommodation.title}` : ' • sem acomodação'}
              </p>
            </Link>
          ))}
          {linkedEnrollments.length === 0 && (
            <p className="text-xs text-slate-500">Nenhuma matrícula vinculada a este curso.</p>
          )}
        </div>
      </section>
    </div>
  );
}
