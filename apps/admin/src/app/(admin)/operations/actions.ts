'use server';

import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { assertActionPermission } from '@/lib/authorization';

type OrderType = 'course' | 'accommodation' | 'package';

type OperationContext = OrderType;
type QuoteType = 'course_only' | 'course_with_accommodation' | 'accommodation_only';

type QuoteItem = {
  id: string;
  itemType: 'course' | 'accommodation';
  referenceId: string;
  startDate: string;
  endDate: string;
  amount: number;
  commissionAmount?: number;
  coursePricing?: {
    id: string;
    course?: { id: string; program_name: string };
  } | null;
  accommodationPricing?: {
    id: string;
    accommodation?: { id: string; title: string; accommodationType: string };
  } | null;
};

type QuoteFromApi = {
  id: string;
  type: QuoteType;
  enrollmentId?: string | null;
  enrollment?: {
    id: string;
    status: string;
    student?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  } | null;
  courseAmount: number;
  accommodationAmount: number;
  fees: number;
  discounts: number;
  totalAmount: number;
  currency: string;
  downPaymentPercentage: number;
  downPaymentAmount: number;
  remainingAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  commissionCourseAmount: number;
  commissionAccommodationAmount: number;
  items?: QuoteItem[] | null;
  userId?: string;
};

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Campo obrigatório: ${key}`);
  }
  return value.trim();
}

function getOptionalText(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function operationBasePath(orderType: OrderType) {
  if (orderType === 'course') return '/course-operations';
  if (orderType === 'accommodation') return '/accommodation-operations';
  return '/package-operations';
}

function formatContextLabel(context: OperationContext) {
  if (context === 'course') return 'curso';
  if (context === 'accommodation') return 'acomodação';
  return 'pacote';
}

function toIsoDate(value: string) {
  return value;
}

export async function createOrderFromQuoteAction(formData: FormData) {
  await assertActionPermission('users.write');
  const expectedOrderType = getOptionalText(formData, 'expectedOrderType');
  const quoteId = getText(formData, 'quoteId');
  if (!expectedOrderType || !['course', 'accommodation', 'package'].includes(expectedOrderType)) {
    const message = 'Tipo de operação inválido para este contexto.';
    redirect(`/course-operations?error=${encodeURIComponent(message)}`);
  }

  const orderType = expectedOrderType as OrderType;
  const listPath = operationBasePath(orderType);
  const contextLabel = formatContextLabel(orderType);

  let createdOrderId: string | null = null;
  try {
    const quote = await apiFetch<QuoteFromApi>(`/quotes/${quoteId}`);

    const items = Array.isArray(quote.items) ? quote.items : [];
    const hasCourseItem = items.some((item) => item.itemType === 'course');
    const hasAccommodationItem = items.some((item) => item.itemType === 'accommodation');

    if (orderType === 'course' && !hasCourseItem) {
      throw new Error('A cotação não tem item de curso para esta operação de curso.');
    }
    if (orderType === 'accommodation' && !hasAccommodationItem) {
      throw new Error('A cotação não tem item de acomodação para esta operação de acomodação.');
    }
    if (orderType === 'package' && (!hasCourseItem || !hasAccommodationItem)) {
      throw new Error('A cotação não possui itens de curso e acomodação para operação de pacote.');
    }

    const userId = quote.enrollment?.student?.id || quote.userId;
    if (!userId) {
      throw new Error('A cotação não possui aluno vinculado para gerar a operação.');
    }

    const selectedItems =
      orderType === 'course'
        ? items.filter((item) => item.itemType === 'course')
        : orderType === 'accommodation'
          ? items.filter((item) => item.itemType === 'accommodation')
          : items;

    if (!selectedItems.length) {
      throw new Error(`A cotação não possui itens suficientes para gerar uma operação de ${contextLabel}.`);
    }

    const parsedItems = selectedItems
      .map((item) => {
        const referenceId = item.referenceId || item.coursePricing?.id || item.accommodationPricing?.id;
        if (!referenceId) {
          throw new Error('Item da cotação sem referência válida.');
        }

        return {
          itemType: item.itemType,
          referenceId,
          startDate: toIsoDate(item.startDate),
          endDate: toIsoDate(item.endDate),
          amount: Number(item.amount ?? 0),
          commissionAmount: Number(item.commissionAmount ?? 0),
          courseId: item.coursePricing?.course?.id,
          accommodationId: item.accommodationPricing?.accommodation?.id,
        } as const;
      });

    const courseAmount = Number(
      (orderType === 'course' || orderType === 'package')
        ? parsedItems
            .filter((item) => item.itemType === 'course')
            .reduce((acc, item) => acc + Number(item.amount), 0)
        : 0,
    );
    const accommodationAmount = Number(
      (orderType === 'accommodation' || orderType === 'package')
        ? parsedItems
            .filter((item) => item.itemType === 'accommodation')
            .reduce((acc, item) => acc + Number(item.amount), 0)
        : 0,
    );
    const totalAmount = Number(
      orderType === 'package' || orderType === 'course' || orderType === 'accommodation'
        ? parsedItems.reduce((acc, item) => acc + Number(item.amount), 0)
        : 0,
    );

    const created = await apiFetch<{ id: string }>(`/orders`, {
      method: 'POST',
      body: JSON.stringify({
        userId,
        enrollmentId: quote.enrollmentId ?? undefined,
        enrollmentQuoteId: quote.id,
        type: orderType,
        status: 'draft',
        paymentStatus: 'pending',
        currency: quote.currency ?? 'CAD',
        totalAmount: Number(totalAmount ?? 0),
        courseAmount,
        accommodationAmount,
        fees: Number(quote.fees ?? 0),
        discounts: Number(quote.discounts ?? 0),
        downPaymentPercentage: Number(quote.downPaymentPercentage ?? 30),
        downPaymentAmount: Number(quote.downPaymentAmount ?? 0),
        remainingAmount: Number(quote.remainingAmount ?? 0),
        commissionPercentage: Number(quote.commissionPercentage ?? 0),
        commissionAmount: Number(quote.commissionAmount ?? 0),
        commissionCourseAmount: Number(quote.commissionCourseAmount ?? 0),
        commissionAccommodationAmount: Number(quote.commissionAccommodationAmount ?? 0),
        items: parsedItems,
      }),
    });
    createdOrderId = created.id;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao gerar operação';
    redirect(`${listPath}?error=${encodeURIComponent(message)}`);
  }

  redirect(`${listPath}/${createdOrderId}`);
}
