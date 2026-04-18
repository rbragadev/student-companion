import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { requirePermission } from '@/lib/authorization';
import { RECORD_STATUS_LABEL, RECORD_STATUS_OPTIONS } from '@/lib/structure';
import { createAcademicPeriodAction } from '../actions';

export default async function NewAcademicPeriodPage() {
  await requirePermission('structure.write');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Novo período letivo"
        description="Defina janela temporal e status do período"
        actions={(
          <Link href="/academic-periods"><Button variant="outline" size="sm"><ArrowLeft size={14} />Voltar</Button></Link>
        )}
      />

      <form action={createAcademicPeriodAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input name="name" required minLength={2} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Data inicial</span>
            <input name="startDate" type="date" required className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Data final</span>
            <input name="endDate" type="date" required className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select name="status" defaultValue="ACTIVE" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
              {RECORD_STATUS_OPTIONS.map((status) => <option key={status} value={status}>{RECORD_STATUS_LABEL[status]}</option>)}
            </select>
          </label>
        </div>

        <div className="flex justify-end"><Button type="submit">Salvar período</Button></div>
      </form>
    </div>
  );
}
