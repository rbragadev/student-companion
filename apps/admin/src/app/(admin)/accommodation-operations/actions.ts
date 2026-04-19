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

export async function updateAccommodationOrderWorkflowAction(formData: FormData) {
  await assertActionPermission('users.write');
  const session = await requireSession();
  const orderId = getText(formData, 'orderId');
  const enrollmentId = getText(formData, 'enrollmentId');
  const status = getText(formData, 'status');
  const reasonValue = formData.get('reason');
  const reason = typeof reasonValue === 'string' ? reasonValue.trim() : '';

  await apiFetch(`/enrollments/${enrollmentId}/accommodation-workflow`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      reason: reason || undefined,
      changedById: session.sub,
    }),
  });

  redirect(`/accommodation-operations/${orderId}`);
}

export async function sendAccommodationOrderMessageAction(formData: FormData) {
  await assertActionPermission('users.write');
  const session = await requireSession();
  const orderId = getText(formData, 'orderId');
  const enrollmentId = getText(formData, 'enrollmentId');
  const message = getText(formData, 'message');

  await apiFetch('/enrollment-messages', {
    method: 'POST',
    body: JSON.stringify({
      enrollmentId,
      senderId: session.sub,
      message,
      channel: 'accommodation',
    }),
  });

  redirect(`/accommodation-operations/${orderId}`);
}

export async function updateStandaloneAccommodationOrderStatusAction(formData: FormData) {
  await assertActionPermission('users.write');
  const orderId = getText(formData, 'orderId');
  const status = getText(formData, 'status');
  const paymentStatus = getText(formData, 'paymentStatus');

  await apiFetch(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
      paymentStatus,
    }),
  });

  redirect(`/accommodation-operations/${orderId}`);
}

