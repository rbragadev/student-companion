'use server';

import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { assertActionPermission } from '@/lib/authorization';

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Campo obrigatório: ${key}`);
  }
  return value.trim();
}

export async function updateEnrollmentIntentAction(formData: FormData) {
  await assertActionPermission('users.write');
  const intentId = getText(formData, 'intentId');

  await apiFetch(`/enrollment-intents/${intentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      courseId: getText(formData, 'courseId'),
      classGroupId: getText(formData, 'classGroupId'),
      academicPeriodId: getText(formData, 'academicPeriodId'),
    }),
  });

  redirect(`/enrollment-intents/${intentId}`);
}

export async function confirmEnrollmentFromIntentAction(formData: FormData) {
  await assertActionPermission('users.write');
  const intentId = getText(formData, 'intentId');

  const enrollment = await apiFetch<{ id: string }>(`/enrollments/from-intent/${intentId}`, {
    method: 'POST',
  });

  redirect(`/enrollments/${enrollment.id}`);
}
