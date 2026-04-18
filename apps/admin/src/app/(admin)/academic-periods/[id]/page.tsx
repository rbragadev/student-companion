import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { RECORD_STATUS_LABEL, RECORD_STATUS_OPTIONS } from '@/lib/structure';
import type { AcademicPeriod, ClassGroup } from '@/types/structure.types';
import { deleteAcademicPeriodAction, updateAcademicPeriodAction } from '../actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

function toDateInput(value: string): string {
  return value.slice(0, 10);
}

export default async function AcademicPeriodDetailPage({ params }: Readonly<PageProps>) {
  const { id } = await params;
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');

  const [period, classGroups] = await Promise.all([
    apiFetch<AcademicPeriod>(`/academic-period/${id}`).catch(() => null),
    apiFetch<ClassGroup[]>('/class-group').catch(() => []),
  ]);
  if (!period) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Período: ${period.name}`}
        description="Atualize o período interno vinculado à turma"
        actions={(
          <Link href="/academic-periods"><Button variant="outline" size="sm"><ArrowLeft size={14} />Voltar</Button></Link>
        )}
      />

      <form action={updateAcademicPeriodAction.bind(null, period.id)} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Turma</span>
            <select name="classGroupId" required defaultValue={period.classGroupId} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100">
              {classGroups.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
            </select>
            <p className="text-xs text-slate-500">O período sempre pertence a uma turma.</p>
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input name="name" required minLength={2} defaultValue={period.name} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" />
          </label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Data inicial</span><input name="startDate" type="date" required defaultValue={toDateInput(period.startDate)} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Data final</span><input name="endDate" type="date" required defaultValue={toDateInput(period.endDate)} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select name="status" defaultValue={period.status} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100">
              {RECORD_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{RECORD_STATUS_LABEL[status]}</option>)}
            </select>
          </label>
        </div>

        {canWrite && (
          <div className="flex items-center justify-between gap-2">
            <Button type="submit" variant="danger" formAction={deleteAcademicPeriodAction.bind(null, period.id)}>Excluir período</Button>
            <Button type="submit">Salvar alterações</Button>
          </div>
        )}
      </form>
    </div>
  );
}
