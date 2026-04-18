'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { assertActionPermission } from '@/lib/authorization';

function getText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function getOptionalNumber(formData: FormData, key: string): number | undefined {
  const value = getText(formData, key);
  if (!value) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export async function createClassGroupAction(formData: FormData) {
  await assertActionPermission('structure.write');

  await apiFetch('/class-group', {
    method: 'POST',
    body: JSON.stringify({
      courseId: getText(formData, 'courseId'),
      name: getText(formData, 'name'),
      code: getText(formData, 'code'),
      shift: getText(formData, 'shift'),
      status: getText(formData, 'status'),
      capacity: getOptionalNumber(formData, 'capacity'),
    }),
  });

  revalidatePath('/class-groups');
  redirect('/class-groups');
}

export async function updateClassGroupAction(id: string, formData: FormData) {
  await assertActionPermission('structure.write');

  await apiFetch(`/class-group/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      courseId: getText(formData, 'courseId'),
      name: getText(formData, 'name'),
      code: getText(formData, 'code'),
      shift: getText(formData, 'shift'),
      status: getText(formData, 'status'),
      capacity: getOptionalNumber(formData, 'capacity'),
    }),
  });

  revalidatePath('/class-groups');
  revalidatePath(`/class-groups/${id}`);
}

export async function deleteClassGroupAction(id: string) {
  await assertActionPermission('structure.write');

  await apiFetch(`/class-group/${id}`, { method: 'DELETE' });
  revalidatePath('/class-groups');
  redirect('/class-groups');
}
