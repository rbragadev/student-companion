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

export async function createUnitAction(formData: FormData) {
  await assertActionPermission('structure.write');

  await apiFetch('/unit', {
    method: 'POST',
    body: JSON.stringify({
      schoolId: getText(formData, 'schoolId'),
      name: getText(formData, 'name'),
      code: getText(formData, 'code'),
      address: getOptional(formData, 'address'),
      city: getOptional(formData, 'city'),
      state: getOptional(formData, 'state'),
      country: getOptional(formData, 'country'),
    }),
  });

  revalidatePath('/units');
  redirect('/units');
}

export async function updateUnitAction(id: string, formData: FormData) {
  await assertActionPermission('structure.write');

  await apiFetch(`/unit/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      schoolId: getText(formData, 'schoolId'),
      name: getText(formData, 'name'),
      code: getText(formData, 'code'),
      address: getOptional(formData, 'address'),
      city: getOptional(formData, 'city'),
      state: getOptional(formData, 'state'),
      country: getOptional(formData, 'country'),
    }),
  });

  revalidatePath('/units');
  revalidatePath(`/units/${id}`);
}

export async function deleteUnitAction(id: string) {
  await assertActionPermission('structure.write');

  await apiFetch(`/unit/${id}`, { method: 'DELETE' });
  revalidatePath('/units');
  redirect('/units');
}
