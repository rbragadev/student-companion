import type {
  AcademicPeriodOption,
  AccommodationPricing,
  ClassGroupOption,
  CoursePricing,
  CreateEnrollmentIntentPayload,
  EnrollmentQuote,
  EnrollmentIntent,
} from '../../types/enrollment.types';
import type { Accommodation } from '../../types/accommodation.types';
import { apiClient } from './client';

const ENROLLMENT_PENDING_STATUSES = new Set([
  'draft',
  'started',
  'awaiting_school_approval',
]);

function mapEnrollmentStatusToIntentStatus(
  status: string,
): EnrollmentIntent['status'] {
  if (status === 'cancelled' || status === 'expired') return 'cancelled';
  if (status === 'rejected') return 'denied';
  if (
    [
      'approved',
      'checkout_available',
      'payment_pending',
      'partially_paid',
      'paid',
      'confirmed',
      'enrolled',
    ].includes(status)
  ) {
    return 'converted';
  }
  return 'pending';
}

function mapEnrollmentToIntentLike(entry: any): EnrollmentIntent {
  return {
    id: entry.id,
    status: mapEnrollmentStatusToIntentStatus(entry.status),
    deniedReason:
      entry.status === 'rejected'
        ? 'Negada na operação'
        : null,
    convertedAt:
      mapEnrollmentStatusToIntentStatus(entry.status) === 'converted'
        ? entry.updatedAt ?? entry.createdAt ?? null
        : null,
    studentId: entry.studentId,
    courseId: entry.courseId,
    classGroupId: entry.classGroupId,
    academicPeriodId: entry.academicPeriodId,
    accommodationId: entry.accommodationId ?? null,
    createdAt: entry.createdAt,
    student: entry.student,
    course: entry.course,
    classGroup: entry.classGroup,
    academicPeriod: entry.academicPeriod,
    accommodation: entry.accommodation ?? null,
    enrollment: {
      id: entry.id,
      status: entry.status,
      createdAt: entry.createdAt ?? null,
    },
  };
}

export const enrollmentIntentApi = {
  getClassGroupsByCourse: async (courseId: string): Promise<ClassGroupOption[]> => {
    const { data } = await apiClient.get(`/class-group?courseId=${courseId}`);
    return Array.isArray(data) ? data : [];
  },

  getAcademicPeriodsByClassGroup: async (classGroupId: string): Promise<AcademicPeriodOption[]> => {
    const { data } = await apiClient.get(`/academic-period?classGroupId=${classGroupId}`);
    return Array.isArray(data) ? data : [];
  },

  createEnrollmentIntent: async (
    payload: CreateEnrollmentIntentPayload,
  ): Promise<EnrollmentIntent> => {
    const explicitQuote = payload.quoteId
      ? await enrollmentIntentApi.getQuoteById(payload.quoteId)
      : null;
    const currentQuote =
      explicitQuote ?? (await enrollmentIntentApi.getCurrentQuoteByStudent(payload.studentId));
    if (!currentQuote?.id) {
      throw new Error(
        'Não foi possível enviar a proposta: quote do pacote não encontrada. Reabra o carrinho e gere o pacote novamente.',
      );
    }

    const { data: startedEnrollment } = await apiClient.post('/enrollments/start', {
      studentId: payload.studentId,
      courseId: payload.courseId,
      classGroupId: payload.classGroupId,
      academicPeriodId: payload.academicPeriodId,
      accommodationId: payload.accommodationId ?? undefined,
    });
    const enrollmentId = startedEnrollment?.id as string | undefined;
    if (!enrollmentId) {
      throw new Error('Não foi possível iniciar a matrícula para envio da proposta.');
    }

    const baseItems =
      currentQuote.items?.map((item) => ({
        itemType: item.itemType,
        referenceId: item.referenceId,
        startDate: item.startDate,
        endDate: item.endDate,
        ...(item.itemType === 'course'
          ? { coursePricingId: item.referenceId }
          : { accommodationPricingId: item.referenceId }),
      })) ?? [];

    await enrollmentIntentApi.recalculateQuote(currentQuote.id, {
      userId: payload.studentId,
      enrollmentId,
      fees: Number(currentQuote.fees ?? 0),
      discounts: Number(currentQuote.discounts ?? 0),
      downPaymentPercentage: Number(currentQuote.downPaymentPercentage ?? 30),
      items: baseItems,
    });

    const { data: course } = await apiClient.get(`/course/${payload.courseId}`);
    const isAutoApprove =
      Boolean(course?.autoApproveIntent) || Boolean(course?.auto_approve_intent);
    const targetStatus = isAutoApprove
      ? 'checkout_available'
      : 'awaiting_school_approval';

    const { data } = await apiClient.patch(
      `/enrollments/${enrollmentId}/status`,
      {
        status: targetStatus,
      },
    );
    return mapEnrollmentToIntentLike(data);
  },

  getOpenIntentByStudent: async (studentId: string): Promise<EnrollmentIntent | null> => {
    const { data } = await apiClient.get(`/enrollments?studentId=${studentId}`);
    if (!Array.isArray(data) || data.length === 0) return null;
    const open = data.find((item: any) =>
      ENROLLMENT_PENDING_STATUSES.has(item.status),
    );
    return open ? mapEnrollmentToIntentLike(open) : null;
  },

  getIntentsByStudent: async (studentId: string): Promise<EnrollmentIntent[]> => {
    const { data } = await apiClient.get(`/enrollments?studentId=${studentId}`);
    return Array.isArray(data)
      ? data.map((item: any) => mapEnrollmentToIntentLike(item))
      : [];
  },

  getRecommendedAccommodationsByCourse: async (courseId: string): Promise<Accommodation[]> => {
    const { data: course } = await apiClient.get(`/course/${courseId}`);
    const schoolId =
      course?.schoolId ?? course?.school_id ?? course?.school?.id ?? null;
    if (!schoolId) return [];
    const { data } = await apiClient.get(
      `/accommodation/recommended/school/${schoolId}`,
    );
    return Array.isArray(data) ? (data as Accommodation[]) : [];
  },

  setIntentAccommodation: async (
    intentId: string,
    accommodationId?: string | null,
  ): Promise<EnrollmentIntent> => {
    const { data } = await apiClient.patch(`/enrollments/${intentId}/accommodation`, {
      accommodationId: accommodationId ?? null,
    });
    return mapEnrollmentToIntentLike(data);
  },

  updateIntentStatus: async (
    intentId: string,
    status: 'pending' | 'cancelled' | 'denied',
    reason?: string,
  ): Promise<EnrollmentIntent> => {
    const enrollmentStatus =
      status === 'pending'
        ? 'awaiting_school_approval'
        : status === 'cancelled'
          ? 'cancelled'
          : 'rejected';
    const { data } = await apiClient.patch(`/enrollments/${intentId}/status`, {
      status: enrollmentStatus,
      ...(reason ? { reason } : {}),
    });
    return mapEnrollmentToIntentLike(data);
  },

  getCoursePricing: async (
    courseId: string,
    academicPeriodId: string,
    options?: { startDate?: string; endDate?: string },
  ): Promise<CoursePricing> => {
    const query = new URLSearchParams({
      courseId,
      academicPeriodId,
      ...(options?.startDate ? { startDate: options.startDate } : {}),
      ...(options?.endDate ? { endDate: options.endDate } : {}),
    });
    const { data } = await apiClient.get(
      `/course-pricing/resolve?${query.toString()}`,
    );
    return data as CoursePricing;
  },

  getAccommodationPricing: async (
    accommodationId: string,
    periodOption?: string,
    options?: { startDate?: string; endDate?: string },
  ): Promise<AccommodationPricing> => {
    const query = new URLSearchParams({
      accommodationId,
      ...(periodOption ? { periodOption } : {}),
      ...(options?.startDate ? { startDate: options.startDate } : {}),
      ...(options?.endDate ? { endDate: options.endDate } : {}),
    });
    const { data } = await apiClient.get(`/accommodation-pricing/resolve?${query.toString()}`);
    return data as AccommodationPricing;
  },

  getAccommodationPricingOptions: async (
    accommodationId: string,
  ): Promise<AccommodationPricing[]> => {
    const { data } = await apiClient.get(`/accommodation-pricing?accommodationId=${accommodationId}`);
    return Array.isArray(data) ? (data as AccommodationPricing[]) : [];
  },

  createQuote: async (payload: {
    userId?: string;
    enrollmentId?: string;
    coursePricingId?: string;
    accommodationPricingId?: string;
    courseId?: string;
    academicPeriodId?: string;
    accommodationId?: string;
    periodOption?: string;
    fees?: number;
    discounts?: number;
    downPaymentPercentage?: number;
    items?: Array<{
      itemType: 'course' | 'accommodation';
      referenceId?: string;
      coursePricingId?: string;
      accommodationPricingId?: string;
      startDate: string;
      endDate: string;
    }>;
  }): Promise<EnrollmentQuote> => {
    const { data } = await apiClient.post('/quotes', payload);
    return data as EnrollmentQuote;
  },

  getQuoteByIntent: async (intentId: string): Promise<EnrollmentQuote | null> => {
    try {
      const { data } = await apiClient.get(`/quotes/by-enrollment/${intentId}`);
      return data as EnrollmentQuote;
    } catch {
      return null;
    }
  },

  getCurrentQuoteByStudent: async (studentId: string): Promise<EnrollmentQuote | null> => {
    const { data } = await apiClient.get(`/quotes/current/${studentId}`);
    return (data ?? null) as EnrollmentQuote | null;
  },

  getQuoteById: async (quoteId: string): Promise<EnrollmentQuote | null> => {
    try {
      const { data } = await apiClient.get(`/quotes/${quoteId}`);
      return (data ?? null) as EnrollmentQuote | null;
    } catch {
      return null;
    }
  },

  recalculateQuote: async (
    quoteId: string,
    payload: {
      userId?: string;
      enrollmentId?: string;
      items?: Array<{
        itemType: 'course' | 'accommodation';
        referenceId?: string;
        coursePricingId?: string;
        accommodationPricingId?: string;
        startDate: string;
        endDate: string;
      }>;
      fees?: number;
      discounts?: number;
      downPaymentPercentage?: number;
    },
  ): Promise<EnrollmentQuote> => {
    const { data } = await apiClient.patch(`/quotes/${quoteId}/recalculate`, payload);
    return data as EnrollmentQuote;
  },

  removeQuoteItem: async (quoteId: string, itemId: string): Promise<EnrollmentQuote> => {
    const { data } = await apiClient.delete(`/quotes/${quoteId}/items/${itemId}`);
    return data as EnrollmentQuote;
  },

  removeQuote: async (quoteId: string): Promise<{ id: string; removed: boolean }> => {
    const { data } = await apiClient.delete(`/quotes/${quoteId}`);
    return data as { id: string; removed: boolean };
  },
};
