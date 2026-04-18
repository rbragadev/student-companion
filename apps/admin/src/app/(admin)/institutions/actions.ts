'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { assertActionPermission } from '@/lib/authorization';

function getText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

export async function createInstitutionAction(formData: FormData) {
  await assertActionPermission('structure.write');

  await apiFetch('/institution', {
    method: 'POST',
    body: JSON.stringify({
      name: getText(formData, 'name'),
      description: getText(formData, 'description') || undefined,
    }),
  });

  revalidatePath('/institutions');
  redirect('/institutions');
}

export async function updateInstitutionAction(id: string, formData: FormData) {
  await assertActionPermission('structure.write');

  await apiFetch(`/institution/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: getText(formData, 'name'),
      description: getText(formData, 'description') || undefined,
    }),
  });

  revalidatePath('/institutions');
  revalidatePath(`/institutions/${id}`);
}

export async function deleteInstitutionAction(id: string) {
  await assertActionPermission('structure.write');

  await apiFetch(`/institution/${id}`, { method: 'DELETE' });
  revalidatePath('/institutions');
  redirect('/institutions');
}
