import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { EnrollmentAdmin } from '@/types/catalog.types';

export default async function EnrollmentDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  await requirePermission('users.read');
  const { id } = await params;

  const enrollment = await apiFetch<EnrollmentAdmin>(`/enrollments/${id}`).catch(() => null);
  if (!enrollment) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Detalhe da Matrícula"
        description="Vínculo acadêmico completo originado da intenção."
        actions={(
          <Link href="/enrollments">
            <Button size="sm" variant="outline"><ArrowLeft size={14} />Voltar</Button>
          </Link>
        )}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Aluno</h2>
          <p className="mt-2 text-sm text-slate-700">{enrollment.student.firstName} {enrollment.student.lastName}</p>
          <p className="text-xs text-slate-500">{enrollment.student.email}</p>
          <p className="mt-1 text-xs text-slate-500">Status aluno: {enrollment.student.studentStatus}</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Contexto</h2>
          <p className="mt-2 text-sm text-slate-700">{enrollment.institution.name}</p>
          <p className="text-xs text-slate-500">{enrollment.school.name} • {enrollment.unit.name} ({enrollment.unit.code})</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Curso e Turma</h2>
          <p className="mt-2 text-sm text-slate-700">{enrollment.course.program_name}</p>
          <p className="text-xs text-slate-500">{enrollment.classGroup.name} ({enrollment.classGroup.code})</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Período</h2>
          <p className="mt-2 text-sm text-slate-700">{enrollment.academicPeriod.name}</p>
          <p className="text-xs text-slate-500">
            {new Date(enrollment.academicPeriod.startDate).toLocaleDateString('pt-BR')} - {new Date(enrollment.academicPeriod.endDate).toLocaleDateString('pt-BR')}
          </p>
          <p className="mt-1 text-xs text-slate-500">Status matrícula: {enrollment.status}</p>
        </article>
      </section>
    </div>
  );
}
