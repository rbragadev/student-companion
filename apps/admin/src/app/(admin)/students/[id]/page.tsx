import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { StudentAdmin, StudentAcademicJourneyAdmin } from '@/types/catalog.types';

const intentStatusLabel = {
  pending: 'Pendente',
  converted: 'Convertida',
  cancelled: 'Cancelada',
  denied: 'Negada',
} as const;

const enrollmentStatusLabel = {
  active: 'Ativa',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  denied: 'Negada',
} as const;

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('pt-BR');
}

export default async function StudentDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  await requirePermission('users.read');
  const { id } = await params;

  const [student, journey] = await Promise.all([
    apiFetch<StudentAdmin>(`/users/${id}`).catch(() => null),
    apiFetch<StudentAcademicJourneyAdmin>(`/enrollments/journey/${id}`).catch(() => null),
  ]);

  if (!student || !journey) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Jornada Acadêmica do Aluno"
        description="Visão operacional de intenção pendente, matrícula ativa e histórico completo."
        actions={(
          <Link href="/students">
            <Button size="sm" variant="outline"><ArrowLeft size={14} />Voltar</Button>
          </Link>
        )}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Aluno</h2>
          <p className="mt-2 text-sm text-slate-700">{student.firstName} {student.lastName}</p>
          <p className="text-xs text-slate-500">{student.email}</p>
          <p className="mt-1 text-xs text-slate-500">Status atual: {student.studentStatus ?? 'lead'}</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Intenção em andamento</h2>
          {journey.activeIntent ? (
            <>
              <p className="mt-2 text-sm text-slate-700">{journey.activeIntent.course.program_name}</p>
              <p className="text-xs text-slate-500">Turma: {journey.activeIntent.classGroup.name} ({journey.activeIntent.classGroup.code})</p>
              <p className="text-xs text-slate-500">Período: {journey.activeIntent.academicPeriod.name}</p>
              <p className="text-xs text-slate-500">Status: {intentStatusLabel[journey.activeIntent.status]}</p>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Nenhuma intenção pendente.</p>
          )}
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Matrícula ativa</h2>
          {journey.activeEnrollment ? (
            <>
              <p className="mt-2 text-sm text-slate-700">{journey.activeEnrollment.course.program_name}</p>
              <p className="text-xs text-slate-500">
                {journey.activeEnrollment.institution.name} {'>'} {journey.activeEnrollment.school.name} {'>'} {journey.activeEnrollment.unit.name}
              </p>
              <p className="text-xs text-slate-500">
                Turma: {journey.activeEnrollment.classGroup.name} ({journey.activeEnrollment.classGroup.code}) • {journey.activeEnrollment.academicPeriod.name}
              </p>
              <p className="text-xs text-slate-500">Status: {enrollmentStatusLabel[journey.activeEnrollment.status]}</p>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Nenhuma matrícula ativa.</p>
          )}
        </article>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Histórico de Intenções</h2>
        <div className="mt-3 space-y-2">
          {journey.intentHistory.length === 0 && <p className="text-xs text-slate-500">Sem histórico.</p>}
          {journey.intentHistory.map((intent) => (
            <div key={intent.id} className="rounded border border-slate-200 p-3 text-xs text-slate-600">
              <p className="font-medium text-slate-800">{intent.course.program_name}</p>
              <p>Turma: {intent.classGroup.name} ({intent.classGroup.code})</p>
              <p>Período: {intent.academicPeriod.name}</p>
              <p>Status: {intentStatusLabel[intent.status]}</p>
              {intent.status === 'denied' && intent.deniedReason && (
                <p>Motivo da negativa: {intent.deniedReason}</p>
              )}
              <p>Criada em: {formatDate(intent.createdAt)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Histórico de Matrículas</h2>
        <div className="mt-3 space-y-2">
          {journey.enrollmentHistory.length === 0 && <p className="text-xs text-slate-500">Sem histórico.</p>}
          {journey.enrollmentHistory.map((enrollment) => (
            <div key={enrollment.id} className="rounded border border-slate-200 p-3 text-xs text-slate-600">
              <p className="font-medium text-slate-800">{enrollment.course.program_name}</p>
              <p>Turma: {enrollment.classGroup.name} ({enrollment.classGroup.code})</p>
              <p>Período: {enrollment.academicPeriod.name}</p>
              <p>Status: {enrollmentStatusLabel[enrollment.status]}</p>
              <p>Criada em: {formatDate(enrollment.createdAt)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
