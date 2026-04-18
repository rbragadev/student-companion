import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { SchoolAdmin } from '@/types/catalog.types';
import { createUnitAction } from '../actions';

export default async function NewUnitPage() {
  await requirePermission('structure.write');
  const schools = await apiFetch<SchoolAdmin[]>('/school').catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: 'Unidades', href: '/units' }, { label: 'Nova unidade' }]} />
      <PageHeader
        title="Nova unidade"
        description="Cadastre unidade vinculada a uma escola"
        actions={(
          <Link href="/units"><Button variant="outline" size="sm"><ArrowLeft size={14} />Voltar</Button></Link>
        )}
      />

      <form action={createUnitAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Escola</span>
            <select name="schoolId" required className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
              <option value="">Selecione</option>
              {schools.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input name="name" required minLength={2} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Código</span>
            <input name="code" required minLength={2} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Endereço</span>
            <input name="address" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Cidade</span>
            <input name="city" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Estado</span>
            <input name="state" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">País</span>
            <input name="country" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
        </div>

        <div className="flex justify-end"><Button type="submit">Salvar unidade</Button></div>
      </form>
    </div>
  );
}
