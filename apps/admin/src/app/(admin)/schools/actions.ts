'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { assertActionPermission } from '@/lib/authorization';

function getText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function getOptional(formData: FormData, key: string): string | undefined {
  const value = getText(formData, key);
  return value || undefined;
}

function getBool(formData: FormData, key: string): boolean {
  return String(formData.get(key) ?? '') === 'on';
}

export async function createSchoolAction(formData: FormData) {
  await assertActionPermission('structure.write');

  await apiFetch('/school', {
    method: 'POST',
    body: JSON.stringify({
      institutionId: getText(formData, 'institutionId'),
      name: getText(formData, 'name'),
      location: getText(formData, 'location'),
      description: getOptional(formData, 'description'),
      website: getOptional(formData, 'website'),
      phone: getOptional(formData, 'phone'),
      email: getOptional(formData, 'email'),
      logo: getOptional(formData, 'logo'),
      isPartner: getBool(formData, 'isPartner'),
    }),
  });

  revalidatePath('/schools');
  redirect('/schools');
}

export async function updateSchoolAction(id: string, formData: FormData) {
  await assertActionPermission('structure.write');

  await apiFetch(`/school/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      institutionId: getText(formData, 'institutionId'),
      name: getText(formData, 'name'),
      location: getText(formData, 'location'),
      description: getOptional(formData, 'description'),
      website: getOptional(formData, 'website'),
      phone: getOptional(formData, 'phone'),
      email: getOptional(formData, 'email'),
      logo: getOptional(formData, 'logo'),
      isPartner: getBool(formData, 'isPartner'),
    }),
  });

  revalidatePath('/schools');
  revalidatePath(`/schools/${id}`);
}

export async function deleteSchoolAction(id: string) {
  await assertActionPermission('structure.write');
  await apiFetch(`/school/${id}`, { method: 'DELETE' });
  revalidatePath('/schools');
  redirect('/schools');
}
