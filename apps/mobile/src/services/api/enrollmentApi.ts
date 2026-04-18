import type { Enrollment } from '../../types/enrollment.types';
import { apiClient } from './client';

export const enrollmentApi = {
  getActiveEnrollmentByStudent: async (studentId: string): Promise<Enrollment | null> => {
    const { data } = await apiClient.get(`/enrollments?studentId=${studentId}&status=active`);
    if (!Array.isArray(data) || data.length === 0) return null;
    return data[0] as Enrollment;
  },
};
