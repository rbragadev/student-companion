import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { deleteAdminUserAction, updateAdminUserAction } from '../actions';
import type { AdminProfile, AdminUser } from '@/types/auth.types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({ params }: Readonly<PageProps>) {
  const { id } = await params;
  const session = await requirePermission('users.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('users.write');

  const [user, profiles] = await Promise.all([
    apiFetch<AdminUser>(`/users/admin/${id}`).catch(() => null),
    apiFetch<AdminProfile[]>('/admin-profile').catch(() => []),
  ]);

  if (!user) notFound();

  const selectedProfiles = new Set(user.adminProfiles.map((item) => item.profile.id));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Editar usuário: ${user.firstName} ${user.lastName}`}
        description="Atualize dados, role e perfis administrativos"
        actions={(
          <Link href="/admin-users">
            <Button variant="outline" size="sm">
              <ArrowLeft size={14} />
              Voltar
            </Button>
          </Link>
        )}
      />

      <form
        action={updateAdminUserAction.bind(null, user.id)}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Nome</span>
            <input
              name="firstName"
              required
              minLength={2}
              defaultValue={user.firstName}
              disabled={!canWrite}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Sobrenome</span>
            <input
              name="lastName"
              required
              minLength={2}
              defaultValue={user.lastName}
              disabled={!canWrite}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">E-mail</span>
            <input
              name="email"
              type="email"
              required
              defaultValue={user.email}
              disabled={!canWrite}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Nova senha (opcional)</span>
            <input
              name="password"
              type="password"
              minLength={6}
              disabled={!canWrite}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Role</span>
            <select
              name="role"
              defaultValue={user.role}
              disabled={!canWrite}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Perfis</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {profiles.map((profile) => (
              <label key={profile.id} className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2">
                <input
                  type="checkbox"
                  name="profileIds"
                  value={profile.id}
                  defaultChecked={selectedProfiles.has(profile.id)}
                  disabled={!canWrite}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 disabled:opacity-50"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{profile.label}</span>
                  <span className="block text-xs text-slate-500">{profile.name}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {canWrite && (
          <div className="flex items-center justify-between gap-2">
            <Button formAction={deleteAdminUserAction.bind(null, user.id)} type="submit" variant="danger">
              Excluir usuário
            </Button>
            <Button type="submit">Salvar alterações</Button>
          </div>
        )}
      </form>
    </div>
  );
}
