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
    const { data } = await apiClient.post('/enrollment-intents', payload);
    return data;
  },

  getOpenIntentByStudent: async (studentId: string): Promise<EnrollmentIntent | null> => {
    const { data } = await apiClient.get(`/enrollment-intents?studentId=${studentId}&status=pending`);
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[0] as EnrollmentIntent;
  },

  getIntentsByStudent: async (studentId: string): Promise<EnrollmentIntent[]> => {
    const { data } = await apiClient.get(`/enrollment-intents?studentId=${studentId}`);
    return Array.isArray(data) ? (data as EnrollmentIntent[]) : [];
  },

  getRecommendedAccommodationsByCourse: async (courseId: string): Promise<Accommodation[]> => {
    const { data } = await apiClient.get(
      `/enrollment-intents/recommended-accommodations?courseId=${courseId}`,
    );
    return Array.isArray(data) ? (data as Accommodation[]) : [];
  },

  setIntentAccommodation: async (
    intentId: string,
    accommodationId?: string | null,
  ): Promise<EnrollmentIntent> => {
    const { data } = await apiClient.patch(`/enrollment-intents/${intentId}/accommodation`, {
      accommodationId: accommodationId ?? null,
    });
    return data as EnrollmentIntent;
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
    enrollmentIntentId?: string;
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
      const { data } = await apiClient.get(`/quotes/by-intent/${intentId}`);
      return data as EnrollmentQuote;
    } catch {
      return null;
    }
  },

  getCurrentQuoteByStudent: async (studentId: string): Promise<EnrollmentQuote | null> => {
    const { data } = await apiClient.get(`/quotes/current/${studentId}`);
    return (data ?? null) as EnrollmentQuote | null;
  },

  recalculateQuote: async (
    quoteId: string,
    payload: {
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
};
