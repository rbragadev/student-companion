'use server';

import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { assertActionPermission } from '@/lib/authorization';
import { requireSession } from '@/lib/session';

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Campo obrigatório: ${key}`);
  }
  return value.trim();
}

function getOptionalNumber(formData: FormData, key: string): number | undefined {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) throw new Error(`Valor numérico inválido: ${key}`);
  return parsed;
}

export async function updateEnrollmentWorkflowAction(formData: FormData) {
  await assertActionPermission('users.write');
  const enrollmentId = getText(formData, 'enrollmentId');
  const status = getText(formData, 'status');
  const reasonValue = formData.get('reason');
  const reason = typeof reasonValue === 'string' ? reasonValue.trim() : '';

  await apiFetch(`/enrollments/${enrollmentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason: reason || undefined }),
  });

  redirect(`/enrollments/${enrollmentId}`);
}

export async function updateEnrollmentPricingAction(formData: FormData) {
  await assertActionPermission('users.write');
  const enrollmentId = getText(formData, 'enrollmentId');
  const basePrice = getOptionalNumber(formData, 'basePrice');
  const fees = getOptionalNumber(formData, 'fees');
  const discounts = getOptionalNumber(formData, 'discounts');
  const currencyValue = formData.get('currency');
  const currency = typeof currencyValue === 'string' ? currencyValue.trim() : '';

  await apiFetch(`/enrollments/${enrollmentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      basePrice,
      fees,
      discounts,
      currency: currency || undefined,
    }),
  });

  redirect(`/enrollments/${enrollmentId}`);
}

export async function createEnrollmentDocumentAction(formData: FormData) {
  await assertActionPermission('users.write');
  const enrollmentId = getText(formData, 'enrollmentId');

  await apiFetch('/enrollment-documents', {
    method: 'POST',
    body: JSON.stringify({
      enrollmentId,
      type: getText(formData, 'type'),
      fileUrl: getText(formData, 'fileUrl'),
    }),
  });

  redirect(`/enrollments/${enrollmentId}`);
}

export async function updateEnrollmentDocumentAction(formData: FormData) {
  await assertActionPermission('users.write');
  const enrollmentId = getText(formData, 'enrollmentId');
  const documentId = getText(formData, 'documentId');
  const status = getText(formData, 'status');
  const adminNoteValue = formData.get('adminNote');
  const adminNote = typeof adminNoteValue === 'string' ? adminNoteValue.trim() : '';

  await apiFetch(`/enrollment-documents/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminNote: adminNote || undefined }),
  });

  redirect(`/enrollments/${enrollmentId}`);
}

export async function createEnrollmentMessageAction(formData: FormData) {
  await assertActionPermission('users.write');
  const session = await requireSession();
  const enrollmentId = getText(formData, 'enrollmentId');
  const message = getText(formData, 'message');

  await apiFetch('/enrollment-messages', {
    method: 'POST',
    body: JSON.stringify({
      enrollmentId,
      senderId: session.sub,
      message,
    }),
  });

  redirect(`/enrollments/${enrollmentId}`);
}
