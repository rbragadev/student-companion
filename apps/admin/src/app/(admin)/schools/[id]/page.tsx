import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { SchoolAdmin } from '@/types/catalog.types';
import type { Institution } from '@/types/structure.types';
import { deleteSchoolAction, updateSchoolAction } from '../actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SchoolDetailPage({ params }: Readonly<PageProps>) {
  const { id } = await params;
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');
  const institutions = await apiFetch<Institution[]>('/institution').catch(() => []);

  const school = await apiFetch<SchoolAdmin>(`/school/${id}`).catch(() => null);
  if (!school) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: 'Instituições', href: '/institutions' },
          { label: school.institution?.name ?? 'Instituição' },
          { label: 'Escolas', href: '/schools' },
          { label: school.name },
        ]}
      />
      <PageHeader
        title={`Escola: ${school.name}`}
        description="Catálogo acadêmico exibido no app"
        actions={<Link href="/schools"><Button variant="outline" size="sm"><ArrowLeft size={14} />Voltar</Button></Link>}
      />

      <form action={updateSchoolAction.bind(null, school.id)} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Instituição</span>
            <select name="institutionId" required defaultValue={school.institutionId} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100">
              <option value="">Selecione</option>
              {institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <p className="text-xs text-slate-500">Vínculo administrativo da escola no SaaS (não altera o contrato do mobile).</p>
          </label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Nome</span><input name="name" required minLength={2} defaultValue={school.name} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Localização</span><input name="location" required minLength={2} defaultValue={school.location} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Website</span><input name="website" type="url" defaultValue={school.website ?? ''} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">E-mail</span><input name="email" type="email" defaultValue={school.email ?? ''} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Telefone</span><input name="phone" defaultValue={school.phone ?? ''} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Logo URL</span><input name="logo" type="url" defaultValue={school.logo ?? ''} disabled={!canWrite} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Descrição</span><textarea name="description" rows={4} defaultValue={school.description ?? ''} disabled={!canWrite} className="w-full rounded-lg border border-slate-300 p-3 text-sm disabled:bg-slate-100" /></label>
          <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" name="isPartner" defaultChecked={school.isPartner} disabled={!canWrite} className="h-4 w-4" /><span className="text-sm text-slate-700">Escola parceira</span></label>
        </div>
        {canWrite && (
          <div className="flex items-center justify-between gap-2">
            <Button type="submit" variant="danger" formAction={deleteSchoolAction.bind(null, school.id)}>Excluir escola</Button>
            <Button type="submit">Salvar alterações</Button>
          </div>
        )}
      </form>
    </div>
  );
}
