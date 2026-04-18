import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { Unit } from '@/types/structure.types';
import type { SchoolAdmin } from '@/types/catalog.types';
import { deleteUnitAction, updateUnitAction } from '../actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UnitDetailPage({ params }: Readonly<PageProps>) {
  const { id } = await params;
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');

  const [unit, schools] = await Promise.all([
    apiFetch<Unit>(`/unit/${id}`).catch(() => null),
    apiFetch<SchoolAdmin[]>('/school').catch(() => []),
  ]);

  if (!unit) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Unidade: ${unit.name}`}
        description="Edite os dados estruturais da unidade vinculada à escola"
        actions={(
          <Link href="/units"><Button variant="outline" size="sm"><ArrowLeft size={14} />Voltar</Button></Link>
        )}
      />

      <form action={updateUnitAction.bind(null, unit.id)} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Escola</span>
            <select name="schoolId" required defaultValue={unit.schoolId} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100">
              {schools.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input name="name" required minLength={2} defaultValue={unit.name} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Código</span>
            <input name="code" required minLength={2} defaultValue={unit.code} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Endereço</span>
            <input name="address" defaultValue={unit.address ?? ''} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" />
          </label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Cidade</span><input name="city" defaultValue={unit.city ?? ''} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Estado</span><input name="state" defaultValue={unit.state ?? ''} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">País</span><input name="country" defaultValue={unit.country ?? ''} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
        </div>

        {canWrite && (
          <div className="flex items-center justify-between gap-2">
            <Button type="submit" variant="danger" formAction={deleteUnitAction.bind(null, unit.id)}>Excluir unidade</Button>
            <Button type="submit">Salvar alterações</Button>
          </div>
        )}
      </form>
    </div>
  );
}
