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

function getOptionalText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized ? normalized : undefined;
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
      accommodationId: getOptionalText(formData, 'accommodationId'),
    }),
  });

  redirect(`/enrollment-intents/${intentId}`);
}

export async function confirmEnrollmentFromIntentAction(formData: FormData) {
  await assertActionPermission('users.write');
  const intentId = getText(formData, 'intentId');
  const accommodationValue = formData.get('accommodationId');
  const accommodationId =
    typeof accommodationValue === 'string' && accommodationValue.trim() !== ''
      ? accommodationValue.trim()
      : null;

  if (accommodationValue !== null) {
    await apiFetch(`/enrollment-intents/${intentId}/accommodation`, {
      method: 'PATCH',
      body: JSON.stringify({ accommodationId }),
    });
  }

  const enrollment = await apiFetch<{ id: string }>(`/enrollments/from-intent/${intentId}`, {
    method: 'POST',
  });

  redirect(`/enrollments/${enrollment.id}`);
}

export async function updateEnrollmentIntentStatusAction(formData: FormData) {
  await assertActionPermission('users.write');
  const intentId = getText(formData, 'intentId');
  const status = getText(formData, 'status');
  const reasonValue = formData.get('reason');
  const reason = typeof reasonValue === 'string' ? reasonValue.trim() : '';

  await apiFetch(`/enrollment-intents/${intentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason: reason || undefined }),
  });

  redirect(`/enrollment-intents/${intentId}`);
}

export async function updateEnrollmentStatusAction(formData: FormData) {
  await assertActionPermission('users.write');
  const enrollmentId = getText(formData, 'enrollmentId');
  const status = getText(formData, 'status');

  await apiFetch(`/enrollments/${enrollmentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

  redirect(`/enrollments/${enrollmentId}`);
}

export async function updateEnrollmentIntentAccommodationAction(formData: FormData) {
  await assertActionPermission('users.write');
  const intentId = getText(formData, 'intentId');
  const accommodationValue = formData.get('accommodationId');
  const accommodationId =
    typeof accommodationValue === 'string' && accommodationValue.trim() !== ''
      ? accommodationValue.trim()
      : null;

  await apiFetch(`/enrollment-intents/${intentId}/accommodation`, {
    method: 'PATCH',
    body: JSON.stringify({
      accommodationId,
    }),
  });

  redirect(`/enrollment-intents/${intentId}`);
}
