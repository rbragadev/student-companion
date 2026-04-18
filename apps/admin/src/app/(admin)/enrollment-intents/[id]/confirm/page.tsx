import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { EnrollmentIntentAdmin } from '@/types/catalog.types';
import { confirmEnrollmentFromIntentAction } from '../../actions';

export default async function ConfirmEnrollmentIntentPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  await requirePermission('users.write');
  const { id } = await params;

  const intent = await apiFetch<EnrollmentIntentAdmin>(`/enrollment-intents/${id}`).catch(() => null);
  if (!intent) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Confirmar Matrícula"
        description="Esta ação converte a intenção pendente em matrícula real e atualiza o aluno para enrolled."
        actions={(
          <Link href={`/enrollment-intents/${id}`}>
            <Button size="sm" variant="outline"><ArrowLeft size={14} />Voltar</Button>
          </Link>
        )}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-700">
          <strong>Aluno:</strong> {intent.student.firstName} {intent.student.lastName}
        </p>
        <p className="text-sm text-slate-700 mt-1">
          <strong>Curso:</strong> {intent.course.program_name}
        </p>
        <p className="text-sm text-slate-700 mt-1">
          <strong>Turma:</strong> {intent.classGroup.name} ({intent.classGroup.code})
        </p>
        <p className="text-sm text-slate-700 mt-1">
          <strong>Período:</strong> {intent.academicPeriod.name}
        </p>
      </section>

      <form action={confirmEnrollmentFromIntentAction} className="flex justify-end">
        <input type="hidden" name="intentId" value={intent.id} />
        <Button type="submit"><CheckCircle2 size={14} />Confirmar matrícula</Button>
      </form>
    </div>
  );
}
