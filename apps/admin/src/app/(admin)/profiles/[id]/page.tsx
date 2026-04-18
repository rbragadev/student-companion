import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { deleteProfileAction, updateProfileAction } from '../actions';
import type { AdminProfile, Permission } from '@/types/auth.types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfileDetailPage({ params }: Readonly<PageProps>) {
  const session = await requirePermission('roles.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('roles.write');
  const { id } = await params;

  const [profile, permissions] = await Promise.all([
    apiFetch<AdminProfile>(`/admin-profile/${id}`).catch(() => null),
    apiFetch<Permission[]>('/permission').catch(() => []),
  ]);

  if (!profile) notFound();

  const selectedPermissions = new Set(
    (profile.permissions ?? []).map((item) => item.permission.id),
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Perfil: ${profile.label}`}
        description="Atualize descrição e conjunto de permissões"
        actions={(
          <Link href="/profiles">
            <Button variant="outline" size="sm">
              <ArrowLeft size={14} />
              Voltar
            </Button>
          </Link>
        )}
      />

      <form
        action={updateProfileAction.bind(null, profile.id)}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Slug interno (name)</span>
            <input
              value={profile.name}
              disabled
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 text-sm text-slate-500"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Nome exibido (label)</span>
            <input
              name="label"
              defaultValue={profile.label}
              required
              minLength={2}
              disabled={!canWrite}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Descrição</span>
          <textarea
            name="description"
            defaultValue={profile.description ?? ''}
            rows={3}
            disabled={!canWrite}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm disabled:bg-slate-100"
          />
        </label>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-700">Permissões</p>
            {profile.isSystem && <Badge variant="warning">Perfil de sistema</Badge>}
          </div>
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
                  defaultChecked={selectedPermissions.has(permission.id)}
                  disabled={!canWrite}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 disabled:opacity-50"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900">{permission.key}</span>
                  <span className="block text-xs text-slate-500">{permission.description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {canWrite && (
          <div className="flex items-center justify-between gap-2">
            {!profile.isSystem ? (
              <Button type="submit" variant="danger" formAction={deleteProfileAction.bind(null, profile.id)}>
                Excluir perfil
              </Button>
            ) : <span />}
            <Button type="submit">Salvar alterações</Button>
          </div>
        )}
      </form>
    </div>
  );
}
