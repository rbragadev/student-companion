import type { Enrollment, StudentAcademicJourney } from '../../types/enrollment.types';
import { apiClient } from './client';

export const enrollmentApi = {
  getActiveEnrollmentByStudent: async (studentId: string): Promise<Enrollment | null> => {
    const { data } = await apiClient.get(`/enrollments/active?studentId=${studentId}`);
    return (data ?? null) as Enrollment | null;
  },

  getEnrollmentsByStudent: async (studentId: string): Promise<Enrollment[]> => {
    const { data } = await apiClient.get(`/enrollments?studentId=${studentId}`);
    return Array.isArray(data) ? (data as Enrollment[]) : [];
  },

  getStudentJourney: async (studentId: string): Promise<StudentAcademicJourney> => {
    const { data } = await apiClient.get(`/enrollments/journey/${studentId}`);
    return data as StudentAcademicJourney;
  },
};
