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

  const [intent, recommendedAccommodations] = await Promise.all([
    apiFetch<EnrollmentIntentAdmin>(`/enrollment-intents/${id}`).catch(() => null),
    apiFetch<Array<{
      id: string;
      title: string;
      accommodationType: string;
      priceInCents: number;
      priceUnit: string;
    }>>(`/enrollment-intents/recommended-accommodations?intentId=${id}`).catch(() => []),
  ]);
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
        <p className="text-sm text-slate-700 mt-1">
          <strong>Acomodação:</strong> {intent.accommodation ? `${intent.accommodation.title} (${(intent.accommodation.priceInCents / 100).toFixed(0)}/${intent.accommodation.priceUnit})` : 'Sem acomodação'}
        </p>
      </section>

      <form action={confirmEnrollmentFromIntentAction} className="grid gap-3">
        <input type="hidden" name="intentId" value={intent.id} />
        <label className="text-sm text-slate-700">
          Acomodação do pacote (opcional)
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
        <div className="flex justify-end">
          <Button type="submit"><CheckCircle2 size={14} />Confirmar matrícula</Button>
        </div>
      </form>
    </div>
  );
}
