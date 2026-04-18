'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { assertActionPermission } from '@/lib/authorization';

function getText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

export async function createAcademicPeriodAction(formData: FormData) {
  await assertActionPermission('structure.write');

  await apiFetch('/academic-period', {
    method: 'POST',
    body: JSON.stringify({
      name: getText(formData, 'name'),
      startDate: getText(formData, 'startDate'),
      endDate: getText(formData, 'endDate'),
      status: getText(formData, 'status'),
    }),
  });

  revalidatePath('/academic-periods');
  redirect('/academic-periods');
}

export async function updateAcademicPeriodAction(id: string, formData: FormData) {
  await assertActionPermission('structure.write');

  await apiFetch(`/academic-period/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: getText(formData, 'name'),
      startDate: getText(formData, 'startDate'),
      endDate: getText(formData, 'endDate'),
      status: getText(formData, 'status'),
    }),
  });

  revalidatePath('/academic-periods');
  revalidatePath(`/academic-periods/${id}`);
}

export async function deleteAcademicPeriodAction(id: string) {
  await assertActionPermission('structure.write');

  await apiFetch(`/academic-period/${id}`, { method: 'DELETE' });
  revalidatePath('/academic-periods');
  redirect('/academic-periods');
}
