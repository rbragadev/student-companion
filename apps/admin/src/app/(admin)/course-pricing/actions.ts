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

function getNumber(formData: FormData, key: string): number {
  const value = Number(getText(formData, key));
  if (Number.isNaN(value)) throw new Error(`Número inválido: ${key}`);
  return value;
}

export async function createCoursePricingAction(formData: FormData) {
  await assertActionPermission('structure.write');

  await apiFetch('/course-pricing', {
    method: 'POST',
    body: JSON.stringify({
      courseId: getText(formData, 'courseId'),
      academicPeriodId: getText(formData, 'academicPeriodId'),
      duration: (formData.get('duration') as string | null)?.trim() || undefined,
      basePrice: getNumber(formData, 'basePrice'),
      currency: getText(formData, 'currency'),
      isActive: (formData.get('isActive') as string | null) === 'on',
    }),
  });

  redirect('/course-pricing');
}

export async function updateCoursePricingAction(formData: FormData) {
  await assertActionPermission('structure.write');
  const id = getText(formData, 'id');

  await apiFetch(`/course-pricing/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      basePrice: getNumber(formData, 'basePrice'),
      currency: getText(formData, 'currency'),
      isActive: (formData.get('isActive') as string | null) === 'on',
      duration: (formData.get('duration') as string | null)?.trim() || undefined,
    }),
  });

  redirect('/course-pricing');
}
