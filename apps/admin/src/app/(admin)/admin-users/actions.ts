'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { assertActionPermission } from '@/lib/authorization';

export async function setUserProfilesAction(userId: string, profileIds: string[]) {
  await assertActionPermission('users.write');
  await apiFetch(`/users/${userId}/admin-profiles`, {
    method: 'PUT',
    body: JSON.stringify({ profileIds }),
  });
  revalidatePath('/admin-users');
  revalidatePath(`/admin-users/${userId}`);
}

export async function setUserProfilesFromFormAction(userId: string, formData: FormData) {
  const profileIds = formData
    .getAll('profileIds')
    .map((value) => String(value))
    .filter(Boolean);

  await setUserProfilesAction(userId, profileIds);
}

function getText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function getOptionalText(formData: FormData, key: string): string | undefined {
  const value = getText(formData, key);
  return value || undefined;
}

function getProfileIds(formData: FormData): string[] {
  return formData
    .getAll('profileIds')
    .map((value) => String(value))
    .filter(Boolean);
}

export async function createAdminUserAction(formData: FormData) {
  await assertActionPermission('users.write');

  await apiFetch('/users/admin', {
    method: 'POST',
    body: JSON.stringify({
      firstName: getText(formData, 'firstName'),
      lastName: getText(formData, 'lastName'),
      email: getText(formData, 'email'),
      password: getText(formData, 'password'),
      role: getText(formData, 'role') || 'ADMIN',
      phone: getOptionalText(formData, 'phone'),
      avatar: getOptionalText(formData, 'avatar'),
      profileIds: getProfileIds(formData),
    }),
  });

  revalidatePath('/admin-users');
  redirect('/admin-users');
}

export async function updateAdminUserAction(userId: string, formData: FormData) {
  await assertActionPermission('users.write');

  const password = getOptionalText(formData, 'password');
  await apiFetch(`/users/admin/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      firstName: getText(formData, 'firstName'),
      lastName: getText(formData, 'lastName'),
      email: getText(formData, 'email'),
      role: getText(formData, 'role') || 'ADMIN',
      phone: getOptionalText(formData, 'phone'),
      avatar: getOptionalText(formData, 'avatar'),
      profileIds: getProfileIds(formData),
      ...(password ? { password } : {}),
    }),
  });

  revalidatePath('/admin-users');
  revalidatePath(`/admin-users/${userId}`);
}

export async function deleteAdminUserAction(userId: string) {
  await assertActionPermission('users.write');
  await apiFetch(`/users/admin/${userId}`, { method: 'DELETE' });
  revalidatePath('/admin-users');
  redirect('/admin-users');
}
