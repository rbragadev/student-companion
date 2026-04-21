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

function getOptionalText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function toDateOnlyIso(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Data inválida: ${value}`);
  }
  return value;
}

function toIsoDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export async function createStandaloneAccommodationOrderAction(formData: FormData) {
  await assertActionPermission('users.write');
  const userId = getText(formData, 'userId');
  const accommodationId = getText(formData, 'accommodationId');
  const periodOption = getText(formData, 'periodOption');
  const startDate = toDateOnlyIso(getText(formData, 'startDate'));
  const endDate = toDateOnlyIso(getText(formData, 'endDate'));
  const enrollmentId = getOptionalText(formData, 'enrollmentId');

  let createdOrderId: string | null = null;
  try {
    const pricing = await apiFetch<{
      id: string;
      finalPrice?: number;
      calculatedAmount?: number;
      basePrice?: number;
      currency?: string;
    }>(
      `/accommodation-pricing/resolve?${new URLSearchParams({
        accommodationId,
        periodOption,
        startDate: toIsoDate(startDate),
        endDate: toIsoDate(endDate),
      }).toString()}`,
    );

    const amount = Number(pricing.finalPrice ?? pricing.calculatedAmount ?? pricing.basePrice ?? 0);
    const currency = pricing.currency ?? 'CAD';

    const created = await apiFetch<{ id: string }>(`/orders`, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        type: 'accommodation',
        status: 'draft',
        paymentStatus: 'pending',
        currency,
        totalAmount: amount,
        accommodationAmount: amount,
        courseAmount: 0,
        downPaymentPercentage: 30,
        enrollmentId: enrollmentId ?? undefined,
        items: [
          {
            itemType: 'accommodation',
            referenceId: pricing.id,
            accommodationId,
            startDate: toIsoDate(startDate),
            endDate: toIsoDate(endDate),
            amount,
            commissionAmount: 0,
          },
        ],
      }),
    });
    createdOrderId = created.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao criar reserva de acomodação';
    redirect(`/accommodation-operations?error=${encodeURIComponent(message)}`);
  }

  redirect(`/accommodation-operations/${createdOrderId}`);
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
