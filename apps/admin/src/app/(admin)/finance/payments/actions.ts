'use server';

import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export async function createPaymentAction(formData: FormData) {
  const invoiceId = String(formData.get('invoiceId') ?? '').trim();
  const enrollmentId = String(formData.get('enrollmentId') ?? '').trim();
  const enrollmentQuoteId = String(formData.get('enrollmentQuoteId') ?? '').trim();
  const amount = Number(formData.get('amount') ?? 0);
  const currency = String(formData.get('currency') ?? '').trim();
  const type = String(formData.get('type') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();
  const provider = String(formData.get('provider') ?? '').trim();

  await apiFetch('/payments', {
    method: 'POST',
    body: JSON.stringify({
      invoiceId: invoiceId || undefined,
      enrollmentId: enrollmentId || undefined,
      enrollmentQuoteId: enrollmentQuoteId || undefined,
      amount,
      currency: currency || undefined,
      type: type || undefined,
      status: status || undefined,
      provider: provider || undefined,
    }),
  });

  redirect('/finance/payments');
}

export async function updatePaymentStatusAction(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();

  if (!id || !status) {
    redirect('/finance/payments');
  }

  await apiFetch(`/payments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

  redirect('/finance/payments');
}
