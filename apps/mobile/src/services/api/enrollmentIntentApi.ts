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
  ): Promise<CoursePricing> => {
    const { data } = await apiClient.get(
      `/course-pricing/resolve?courseId=${courseId}&academicPeriodId=${academicPeriodId}`,
    );
    return data as CoursePricing;
  },

  getAccommodationPricing: async (
    accommodationId: string,
    periodOption?: string,
  ): Promise<AccommodationPricing> => {
    const query = periodOption
      ? `accommodationId=${accommodationId}&periodOption=${encodeURIComponent(periodOption)}`
      : `accommodationId=${accommodationId}`;
    const { data } = await apiClient.get(`/accommodation-pricing/resolve?${query}`);
    return data as AccommodationPricing;
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
};
