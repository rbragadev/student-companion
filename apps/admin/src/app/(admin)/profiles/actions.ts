'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { assertActionPermission } from '@/lib/authorization';

interface UpsertProfilePayload {
  name: string;
  label: string;
  description?: string;
}

function extractPermissionIds(formData: FormData): string[] {
  return formData
    .getAll('permissionIds')
    .map((value) => String(value))
    .filter(Boolean);
}

function getText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

export async function createProfileAction(formData: FormData) {
  await assertActionPermission('roles.write');

  const payload: UpsertProfilePayload = {
    name: getText(formData, 'name'),
    label: getText(formData, 'label'),
    description: getText(formData, 'description') || undefined,
  };

  const profile = await apiFetch<{ id: string }>('/admin-profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const permissionIds = extractPermissionIds(formData);
  await apiFetch(`/admin-profile/${profile.id}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissionIds }),
  });

  revalidatePath('/profiles');
  revalidatePath('/permissions');
  redirect(`/profiles/${profile.id}`);
}

export async function updateProfileAction(profileId: string, formData: FormData) {
  await assertActionPermission('roles.write');

  const payload = {
    label: getText(formData, 'label'),
    description: getText(formData, 'description') || undefined,
  };

  await apiFetch(`/admin-profile/${profileId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  const permissionIds = extractPermissionIds(formData);
  await apiFetch(`/admin-profile/${profileId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissionIds }),
  });

  revalidatePath('/profiles');
  revalidatePath(`/profiles/${profileId}`);
  revalidatePath('/permissions');
}

export async function deleteProfileAction(profileId: string) {
  await assertActionPermission('roles.write');
  await apiFetch(`/admin-profile/${profileId}`, { method: 'DELETE' });
  revalidatePath('/profiles');
  redirect('/profiles');
}
