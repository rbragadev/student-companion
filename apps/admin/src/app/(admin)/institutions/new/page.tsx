import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { requirePermission } from '@/lib/authorization';
import { createInstitutionAction } from '../actions';

export default async function NewInstitutionPage() {
  await requirePermission('structure.write');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nova instituição"
        description="Cadastre uma instituição para uso no módulo estrutural"
        actions={(
          <Link href="/institutions">
            <Button variant="outline" size="sm"><ArrowLeft size={14} />Voltar</Button>
          </Link>
        )}
      />

      <form action={createInstitutionAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Nome</span>
          <input name="name" required minLength={2} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Descrição</span>
          <textarea name="description" rows={4} className="w-full rounded-lg border border-slate-300 p-3 text-sm" />
        </label>

        <div className="flex justify-end">
          <Button type="submit">Salvar instituição</Button>
        </div>
      </form>
    </div>
  );
}
