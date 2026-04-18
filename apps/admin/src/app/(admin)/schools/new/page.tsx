import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { Institution } from '@/types/structure.types';
import { createSchoolAction } from '../actions';

export default async function NewSchoolPage() {
  await requirePermission('structure.write');
  const institutions = await apiFetch<Institution[]>('/institution').catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nova escola"
        description="Catálogo acadêmico exibido no app"
        actions={<Link href="/schools"><Button variant="outline" size="sm"><ArrowLeft size={14} />Voltar</Button></Link>}
      />

      <form action={createSchoolAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Instituição</span>
            <select name="institutionId" required className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
              <option value="">Selecione</option>
              {institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <p className="text-xs text-slate-500">Toda escola do catálogo deve estar vinculada a uma instituição administrativa.</p>
          </label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Nome</span><input name="name" required minLength={2} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Localização</span><input name="location" required minLength={2} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Website</span><input name="website" type="url" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">E-mail</span><input name="email" type="email" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Telefone</span><input name="phone" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Logo URL</span><input name="logo" type="url" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Descrição</span><textarea name="description" rows={4} className="w-full rounded-lg border border-slate-300 p-3 text-sm" /></label>
          <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" name="isPartner" className="h-4 w-4" /><span className="text-sm text-slate-700">Escola parceira</span></label>
        </div>
        <div className="flex justify-end"><Button type="submit">Salvar escola</Button></div>
      </form>
    </div>
  );
}
