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

function getOptionalText(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function getInt(formData: FormData, key: string): number {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Campo obrigatório: ${key}`);
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || !Number.isInteger(parsed)) {
    throw new Error(`Valor inteiro inválido: ${key}`);
  }
  return parsed;
}

function getOptionalBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  if (typeof value !== 'string') return false;
  const normalized = value.toLowerCase().trim();
  return normalized === 'on' || normalized === 'true' || normalized === '1';
}

function toDateOnlyIso(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Data inválida: ${value}`);
  }
  return value;
}

export async function createEnrollmentFromAdminAction(formData: FormData) {
  await assertActionPermission('users.write');

  const studentId = getText(formData, 'studentId');
  const courseId = getText(formData, 'courseId');
  const classGroupId = getText(formData, 'classGroupId');
  const academicPeriodId = getText(formData, 'academicPeriodId');
  const academicPeriodName = getText(formData, 'academicPeriodName');
  const courseStartDate = toDateOnlyIso(getText(formData, 'courseStartDate'));
  const courseEndDate = toDateOnlyIso(getText(formData, 'courseEndDate'));
  const accommodationId = getOptionalText(formData, 'accommodationId');
  const accommodationStartDate = getOptionalText(formData, 'accommodationStartDate');
  const accommodationEndDate = getOptionalText(formData, 'accommodationEndDate');
  const isPackage = getOptionalBoolean(formData, 'isPackage');
  const submitMode = getOptionalText(formData, 'submitMode') ?? 'draft';

  const isNextRedirectError = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    String((error as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT');

  try {
    const enrollment = await apiFetch<{ id: string }>(`/enrollments/start`, {
      method: 'POST',
      body: JSON.stringify({
        studentId,
        courseId,
        classGroupId,
        academicPeriodId,
        ...(accommodationId ? { accommodationId } : {}),
      }),
    });

    const coursePricing = await apiFetch<{ id: string }>(
      `/course-pricing/resolve?${new URLSearchParams({
        courseId,
        academicPeriodId,
        startDate: courseStartDate,
        endDate: courseEndDate,
      }).toString()}`,
    );

    let accommodationPricing: { id: string } | null = null;
    if (accommodationId && accommodationStartDate && accommodationEndDate) {
      accommodationPricing = await apiFetch<{ id: string }>(
        `/accommodation-pricing/resolve?${new URLSearchParams({
          accommodationId,
          periodOption: academicPeriodName,
          startDate: toDateOnlyIso(accommodationStartDate),
          endDate: toDateOnlyIso(accommodationEndDate),
        }).toString()}`,
      );
    }

    const commonCourseItem = {
      itemType: 'course' as const,
      referenceId: coursePricing.id,
      coursePricingId: coursePricing.id,
      startDate: courseStartDate,
      endDate: courseEndDate,
    };

    const quoteItems = [
      commonCourseItem,
      ...(isPackage && accommodationPricing && accommodationStartDate && accommodationEndDate
        ? [
            {
              itemType: 'accommodation' as const,
              referenceId: accommodationPricing.id,
              accommodationPricingId: accommodationPricing.id,
              startDate: toDateOnlyIso(accommodationStartDate),
              endDate: toDateOnlyIso(accommodationEndDate),
            },
          ]
        : []),
    ];

    await apiFetch(`/quotes`, {
      method: 'POST',
      body: JSON.stringify({
        userId: studentId,
        enrollmentId: enrollment.id,
        downPaymentPercentage: 30,
        items: quoteItems,
      }),
    });

    if (!isPackage && accommodationPricing && accommodationStartDate && accommodationEndDate) {
      await apiFetch(`/quotes`, {
        method: 'POST',
        body: JSON.stringify({
          userId: studentId,
          enrollmentId: enrollment.id,
          downPaymentPercentage: 30,
          items: [
            {
              itemType: 'accommodation',
              referenceId: accommodationPricing.id,
              accommodationPricingId: accommodationPricing.id,
              startDate: toDateOnlyIso(accommodationStartDate),
              endDate: toDateOnlyIso(accommodationEndDate),
            },
          ],
        }),
      });
    }

    if (submitMode === 'send') {
      const course = await apiFetch<{ autoApproveIntent?: boolean; auto_approve_intent?: boolean }>(
        `/course/${courseId}`,
      );
      const targetStatus =
        course.autoApproveIntent || course.auto_approve_intent
          ? 'checkout_available'
          : 'awaiting_school_approval';

      await apiFetch(`/enrollments/${enrollment.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus }),
      });
    }

    redirect(`/enrollments/${enrollment.id}`);
  } catch (error) {
    if (isNextRedirectError(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Falha ao criar matrícula';
    redirect(`/enrollments/new?error=${encodeURIComponent(message)}`);
  }
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

export async function createEnrollmentInvoiceAction(formData: FormData) {
  await assertActionPermission('users.write');
  const enrollmentId = getText(formData, 'enrollmentId');

  await apiFetch('/invoices', {
    method: 'POST',
    body: JSON.stringify({
      enrollmentId,
      status: 'pending',
    }),
  });

  redirect(`/enrollments/${enrollmentId}`);
}

export async function createEnrollmentInvoiceFromQuoteAction(formData: FormData) {
  await assertActionPermission('users.write');
  const enrollmentId = getText(formData, 'enrollmentId');
  const quoteId = getOptionalText(formData, 'quoteId');
  if (!quoteId) {
    throw new Error('Selecione uma quote para gerar a invoice.');
  }

  await apiFetch('/invoices', {
    method: 'POST',
    body: JSON.stringify({
      enrollmentId,
      enrollmentQuoteId: quoteId,
      status: 'pending',
    }),
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

  const [enrollment, quote] = await Promise.all([
    apiFetch<{
      pricing?: {
        basePrice?: number;
        fees?: number;
        discounts?: number;
        currency?: string;
      };
    }>(`/enrollments/${enrollmentId}`).catch(() => null),
    apiFetch<{
      courseAmount: number;
      fees: number;
      discounts: number;
      currency: string;
    }>(`/quotes/by-enrollment/${enrollmentId}`).catch(() => null),
  ]);

  const finalBasePrice =
    basePrice ?? enrollment?.pricing?.basePrice ?? quote?.courseAmount;
  const finalFees = fees ?? enrollment?.pricing?.fees ?? quote?.fees;
  const finalDiscounts =
    discounts ?? enrollment?.pricing?.discounts ?? quote?.discounts;
  const finalCurrency =
    currency || enrollment?.pricing?.currency || quote?.currency || 'CAD';

  if (
    finalBasePrice === undefined ||
    finalFees === undefined ||
    finalDiscounts === undefined
  ) {
    throw new Error('Não foi possível recuperar os valores de pricing para salvar.');
  }

  await apiFetch(`/enrollments/${enrollmentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      basePrice: finalBasePrice,
      fees: finalFees,
      discounts: finalDiscounts,
      currency: finalCurrency,
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
  const channelValue = formData.get('channel');
  const channel =
    typeof channelValue === 'string' && channelValue.trim() !== ''
      ? channelValue.trim()
      : 'enrollment';

  await apiFetch('/enrollment-messages', {
    method: 'POST',
    body: JSON.stringify({
      enrollmentId,
      senderId: session.sub,
      message,
      channel,
    }),
  });

  redirect(`/enrollments/${enrollmentId}`);
}

export async function createFinanceTransactionAction(formData: FormData) {
  await assertActionPermission('users.write');
  const enrollmentId = getText(formData, 'enrollmentId');
  const financeItemId = getText(formData, 'financeItemId');
  const installmentAmount = getOptionalNumber(formData, 'installmentAmount');
  const installments = getInt(formData, 'installments');
  const returnTo = getOptionalText(formData, 'returnTo');

  if (installmentAmount === undefined || installmentAmount <= 0) {
    throw new Error('Valor da parcela inválido.');
  }

  const dueDateOffsetDays = getOptionalNumber(formData, 'dueDateOffsetDays');

  await apiFetch(`/finance-items/${financeItemId}/transactions`, {
    method: 'POST',
    body: JSON.stringify({
      installmentAmount,
      installments,
      dueDateOffsetDays: dueDateOffsetDays ?? undefined,
    }),
  });

  redirect(returnTo?.trim() || `/enrollments/${enrollmentId}`);
}

export async function updateFinanceTransactionStatusAction(formData: FormData) {
  await assertActionPermission('users.write');
  const enrollmentId = getText(formData, 'enrollmentId');
  const transactionId = getText(formData, 'transactionId');
  const status = getText(formData, 'status');
  const returnTo = getOptionalText(formData, 'returnTo');

  await apiFetch(`/finance-transactions/${transactionId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

  redirect(returnTo?.trim() || `/enrollments/${enrollmentId}`);
}

export async function updateEnrollmentAccommodationAction(formData: FormData) {
  await assertActionPermission('users.write');
  const enrollmentId = getText(formData, 'enrollmentId');
  const accommodationValue = formData.get('accommodationId');
  const accommodationId =
    typeof accommodationValue === 'string' && accommodationValue.trim() !== ''
      ? accommodationValue.trim()
      : null;

  await apiFetch(`/enrollments/${enrollmentId}/accommodation`, {
    method: 'PATCH',
    body: JSON.stringify({
      accommodationId,
    }),
  });

  redirect(`/enrollments/${enrollmentId}`);
}

export async function updateEnrollmentAccommodationWorkflowAction(formData: FormData) {
  await assertActionPermission('users.write');
  const session = await requireSession();
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

  redirect(`/enrollments/${enrollmentId}`);
}

export async function confirmEnrollmentFakePaymentAction(formData: FormData) {
  await assertActionPermission('users.write');
  const enrollmentId = getText(formData, 'enrollmentId');

  await apiFetch(`/enrollments/${enrollmentId}/checkout/pay-fake`, {
    method: 'POST',
  });

  redirect(`/enrollments/${enrollmentId}`);
}
