import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { createAdminUserAction } from '../actions';
import type { AdminProfile } from '@/types/auth.types';

export default async function NewAdminUserPage() {
  await requirePermission('users.write');

  const profiles = await apiFetch<AdminProfile[]>('/admin-profile').catch(() => []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Novo usuário admin"
        description="Crie usuário administrativo e associe perfis"
        actions={(
          <Link href="/admin-users">
            <Button variant="outline" size="sm">
              <ArrowLeft size={14} />
              Voltar
            </Button>
          </Link>
        )}
      />

      <form action={createAdminUserAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input name="firstName" required minLength={2} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Sobrenome</span>
            <input name="lastName" required minLength={2} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">E-mail</span>
            <input name="email" type="email" required className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Senha</span>
            <input name="password" type="password" required minLength={6} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Role</span>
            <select name="role" defaultValue="ADMIN" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Telefone (opcional)</span>
            <input name="phone" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Avatar URL (opcional)</span>
            <input name="avatar" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Perfis</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {profiles.map((profile) => (
              <label key={profile.id} className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <input type="checkbox" name="profileIds" value={profile.id} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{profile.label}</span>
                  <span className="block text-xs text-slate-500">{profile.name}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit">Criar usuário</Button>
        </div>
      </form>
    </div>
  );
}
