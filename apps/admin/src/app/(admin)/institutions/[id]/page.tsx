import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { Institution } from '@/types/structure.types';
import { deleteInstitutionAction, updateInstitutionAction } from '../actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InstitutionDetailPage({ params }: Readonly<PageProps>) {
  const { id } = await params;
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');

  const institution = await apiFetch<Institution>(`/institution/${id}`).catch(() => null);
  if (!institution) notFound();
  const units = (institution.schools ?? []).flatMap((school) => school.units ?? []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Instituição: ${institution.name}`}
        description="Escopo administrativo do cliente no SaaS"
        actions={(
          <Link href="/institutions">
            <Button variant="outline" size="sm"><ArrowLeft size={14} />Voltar</Button>
          </Link>
        )}
      />

      <form action={updateInstitutionAction.bind(null, institution.id)} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Nome</span>
          <input
            name="name"
            required
            minLength={2}
            defaultValue={institution.name}
            disabled={!canWrite}
            className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Descrição</span>
          <textarea
            name="description"
            rows={4}
            defaultValue={institution.description ?? ''}
            disabled={!canWrite}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm disabled:bg-slate-100"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Escolas vinculadas</p>
            <p className="mt-1 text-sm text-slate-700">
              {(institution.schools?.length ?? 0) === 0
                ? 'Nenhuma escola vinculada.'
                : institution.schools?.map((item) => item.name).join(', ')}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unidades vinculadas</p>
            <p className="mt-1 text-sm text-slate-700">
              {units.length === 0
                ? 'Nenhuma unidade vinculada.'
                : units.map((item) => item.name).join(', ')}
            </p>
          </div>
        </div>

        {canWrite && (
          <div className="flex items-center justify-between gap-2">
            <Button type="submit" variant="danger" formAction={deleteInstitutionAction.bind(null, institution.id)}>
              Excluir instituição
            </Button>
            <Button type="submit">Salvar alterações</Button>
          </div>
        )}
      </form>
    </div>
  );
}
