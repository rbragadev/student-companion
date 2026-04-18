import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { Permission } from '@/types/auth.types';
import { createProfileAction } from '../actions';

export default async function NewProfilePage() {
  await requirePermission('roles.write');
  const permissions = await apiFetch<Permission[]>('/permission').catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Novo perfil"
        description="Crie um perfil e selecione suas permissões iniciais"
        actions={(
          <Link href="/profiles">
            <Button variant="outline" size="sm">
              <ArrowLeft size={14} />
              Voltar
            </Button>
          </Link>
        )}
      />

      <form action={createProfileAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Slug interno (name)</span>
            <input
              name="name"
              required
              minLength={2}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              placeholder="ex: support_manager"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Nome exibido (label)</span>
            <input
              name="label"
              required
              minLength={2}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              placeholder="Ex: Support Manager"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Descrição</span>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm"
            placeholder="Resumo do escopo de acesso"
          />
        </label>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Permissões</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {permissions.map((permission) => (
              <label
                key={permission.id}
                className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2"
              >
                <input
                  type="checkbox"
                  name="permissionIds"
                  value={permission.id}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{permission.key}</span>
                  <span className="block text-xs text-slate-500">{permission.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit">Criar perfil</Button>
        </div>
      </form>
    </div>
  );
}
