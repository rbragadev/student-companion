import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { RECORD_STATUS_LABEL, RECORD_STATUS_OPTIONS, SHIFT_LABEL, SHIFT_OPTIONS } from '@/lib/structure';
import type { AcademicPeriod, ClassGroup, Unit } from '@/types/structure.types';
import { deleteClassGroupAction, updateClassGroupAction } from '../actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClassGroupDetailPage({ params }: Readonly<PageProps>) {
  const { id } = await params;
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');

  const [classGroup, units, periods] = await Promise.all([
    apiFetch<ClassGroup>(`/class-group/${id}`).catch(() => null),
    apiFetch<Unit[]>('/unit').catch(() => []),
    apiFetch<AcademicPeriod[]>('/academic-period').catch(() => []),
  ]);

  if (!classGroup) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Turma: ${classGroup.name}`}
        description="Edite dados e vínculos estruturais da turma"
        actions={(
          <Link href="/class-groups"><Button variant="outline" size="sm"><ArrowLeft size={14} />Voltar</Button></Link>
        )}
      />

      <form action={updateClassGroupAction.bind(null, classGroup.id)} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Unidade</span>
            <select name="unitId" required defaultValue={classGroup.unitId} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100">
              {units.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
            </select>
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Período letivo</span>
            <select name="periodId" required defaultValue={classGroup.periodId} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100">
              {periods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Nome</span><input name="name" required minLength={2} defaultValue={classGroup.name} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Código</span><input name="code" required minLength={2} defaultValue={classGroup.code} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Turno</span>
            <select name="shift" defaultValue={classGroup.shift} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100">
              {SHIFT_OPTIONS.map((shift) => <option key={shift} value={shift}>{SHIFT_LABEL[shift]}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select name="status" defaultValue={classGroup.status} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100">
              {RECORD_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{RECORD_STATUS_LABEL[status]}</option>)}
            </select>
          </label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Capacidade</span><input name="capacity" type="number" min={1} defaultValue={classGroup.capacity ?? ''} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
        </div>

        {canWrite && (
          <div className="flex items-center justify-between gap-2">
            <Button type="submit" variant="danger" formAction={deleteClassGroupAction.bind(null, classGroup.id)}>Excluir turma</Button>
            <Button type="submit">Salvar alterações</Button>
          </div>
        )}
      </form>
    </div>
  );
}
