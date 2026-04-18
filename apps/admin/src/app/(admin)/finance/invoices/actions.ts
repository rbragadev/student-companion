'use server';

import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export async function createInvoiceAction(formData: FormData) {
  const enrollmentId = String(formData.get('enrollmentId') ?? '').trim();
  const enrollmentQuoteId = String(formData.get('enrollmentQuoteId') ?? '').trim();
  const dueDate = String(formData.get('dueDate') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();

  await apiFetch('/invoices', {
    method: 'POST',
    body: JSON.stringify({
      enrollmentId: enrollmentId || undefined,
      enrollmentQuoteId: enrollmentQuoteId || undefined,
      dueDate: dueDate || undefined,
      status: status || undefined,
    }),
  });

  redirect('/finance/invoices');
}

export async function updateInvoiceStatusAction(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();

  if (!id || !status) {
    redirect('/finance/invoices');
  }

  await apiFetch(`/invoices/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

  redirect('/finance/invoices');
}
