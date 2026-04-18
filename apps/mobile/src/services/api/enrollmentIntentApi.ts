import type {
  AcademicPeriodOption,
  ClassGroupOption,
  CreateEnrollmentIntentPayload,
  EnrollmentIntent,
} from '../../types/enrollment.types';
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
};
