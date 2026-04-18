import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { RECORD_STATUS_LABEL, RECORD_STATUS_OPTIONS, SHIFT_LABEL, SHIFT_OPTIONS } from '@/lib/structure';
import type { AcademicPeriod, Unit } from '@/types/structure.types';
import { createClassGroupAction } from '../actions';

export default async function NewClassGroupPage() {
  await requirePermission('structure.write');

  const [units, periods] = await Promise.all([
    apiFetch<Unit[]>('/unit').catch(() => []),
    apiFetch<AcademicPeriod[]>('/academic-period').catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nova turma"
        description="Cadastre turma vinculada à unidade e período letivo"
        actions={(
          <Link href="/class-groups"><Button variant="outline" size="sm"><ArrowLeft size={14} />Voltar</Button></Link>
        )}
      />

      <form action={createClassGroupAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Unidade</span>
            <select name="unitId" required className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
              <option value="">Selecione</option>
              {units.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
            </select>
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Período letivo</span>
            <select name="periodId" required className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
              <option value="">Selecione</option>
              {periods.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Nome</span><input name="name" required minLength={2} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Código</span><input name="code" required minLength={2} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Turno</span>
            <select name="shift" defaultValue="MORNING" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
              {SHIFT_OPTIONS.map((shift) => <option key={shift} value={shift}>{SHIFT_LABEL[shift]}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select name="status" defaultValue="ACTIVE" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
              {RECORD_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{RECORD_STATUS_LABEL[status]}</option>)}
            </select>
          </label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Capacidade</span><input name="capacity" type="number" min={1} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
        </div>

        <div className="flex justify-end"><Button type="submit">Salvar turma</Button></div>
      </form>
    </div>
  );
}
