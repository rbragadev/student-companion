import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Pencil } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { EnrollmentIntentAdmin } from '@/types/catalog.types';

const STATUS_LABEL: Record<EnrollmentIntentAdmin['student']['studentStatus'], string> = {
  lead: 'Lead',
  application_started: 'Application Started',
  pending_enrollment: 'Pending Enrollment',
  enrolled: 'Enrolled',
};

const INTENT_LABEL: Record<EnrollmentIntentAdmin['status'], string> = {
  pending: 'Pendente',
  converted: 'Convertida',
};

export default async function EnrollmentIntentDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  await requirePermission('users.read');
  const { id } = await params;

  const intent = await apiFetch<EnrollmentIntentAdmin>(`/enrollment-intents/${id}`).catch(() => null);
  if (!intent) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Detalhe da Intenção de Matrícula"
        description="Consulta de vínculo aluno > curso > turma > período"
        actions={(
          <div className="flex items-center gap-2">
            {intent.status === 'pending' && (
              <>
                <Link href={`/enrollment-intents/${intent.id}/edit`}>
                  <Button size="sm" variant="outline"><Pencil size={14} />Editar</Button>
                </Link>
                <Link href={`/enrollment-intents/${intent.id}/confirm`}>
                  <Button size="sm"><CheckCircle2 size={14} />Confirmar matrícula</Button>
                </Link>
              </>
            )}
            <Link href="/enrollment-intents">
              <Button size="sm" variant="outline"><ArrowLeft size={14} />Voltar</Button>
            </Link>
          </div>
        )}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Aluno</h2>
          <p className="mt-2 text-sm text-slate-700">{intent.student.firstName} {intent.student.lastName}</p>
          <p className="text-xs text-slate-500">{intent.student.email}</p>
          <p className="mt-2 text-xs text-slate-500">Status: {STATUS_LABEL[intent.student.studentStatus]}</p>
          <p className="mt-1 text-xs text-slate-500">Intenção: {INTENT_LABEL[intent.status]}</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Curso</h2>
          <p className="mt-2 text-sm text-slate-700">{intent.course.program_name}</p>
          <p className="text-xs text-slate-500">
            {intent.course.school?.institution?.name ?? '-'} {'>'} {intent.course.school?.name ?? '-'}
          </p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Turma</h2>
          <p className="mt-2 text-sm text-slate-700">{intent.classGroup.name}</p>
          <p className="text-xs text-slate-500">Código: {intent.classGroup.code}</p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Período</h2>
          <p className="mt-2 text-sm text-slate-700">{intent.academicPeriod.name}</p>
          <p className="text-xs text-slate-500">
            {new Date(intent.academicPeriod.startDate).toLocaleDateString('pt-BR')} - {new Date(intent.academicPeriod.endDate).toLocaleDateString('pt-BR')}
          </p>
        </article>
      </section>
    </div>
  );
}
