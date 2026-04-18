import type {
  Enrollment,
  EnrollmentDocument,
  EnrollmentMessage,
  EnrollmentTimelineEvent,
  StudentAcademicJourney,
} from '../../types/enrollment.types';
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

  getEnrollmentById: async (enrollmentId: string): Promise<Enrollment> => {
    const { data } = await apiClient.get(`/enrollments/${enrollmentId}`);
    return data as Enrollment;
  },

  getStudentJourney: async (studentId: string): Promise<StudentAcademicJourney> => {
    const { data } = await apiClient.get(`/enrollments/journey/${studentId}`);
    return data as StudentAcademicJourney;
  },

  getEnrollmentTimeline: async (enrollmentId: string): Promise<EnrollmentTimelineEvent[]> => {
    const { data } = await apiClient.get(`/enrollments/${enrollmentId}/timeline`);
    return Array.isArray(data) ? (data as EnrollmentTimelineEvent[]) : [];
  },

  getEnrollmentMessages: async (enrollmentId: string): Promise<EnrollmentMessage[]> => {
    const { data } = await apiClient.get(`/enrollment-messages?enrollmentId=${enrollmentId}`);
    return Array.isArray(data) ? (data as EnrollmentMessage[]) : [];
  },

  sendEnrollmentMessage: async (payload: {
    enrollmentId: string;
    senderId: string;
    message: string;
  }): Promise<EnrollmentMessage> => {
    const { data } = await apiClient.post('/enrollment-messages', payload);
    return data as EnrollmentMessage;
  },

  getUnreadMessagesCount: async (studentId: string): Promise<number> => {
    const { data } = await apiClient.get(`/enrollment-messages/unread-count?studentId=${studentId}`);
    return typeof data?.count === 'number' ? data.count : 0;
  },

  markEnrollmentMessagesAsRead: async (payload: {
    enrollmentId: string;
    userId: string;
  }): Promise<void> => {
    await apiClient.patch(`/enrollment-messages/read?enrollmentId=${payload.enrollmentId}&userId=${payload.userId}`);
  },

  getEnrollmentDocuments: async (enrollmentId: string): Promise<EnrollmentDocument[]> => {
    const { data } = await apiClient.get(`/enrollment-documents?enrollmentId=${enrollmentId}`);
    return Array.isArray(data) ? (data as EnrollmentDocument[]) : [];
  },

  uploadEnrollmentDocument: async (payload: {
    enrollmentId: string;
    type: string;
    fileUrl: string;
  }): Promise<EnrollmentDocument> => {
    const { data } = await apiClient.post('/enrollment-documents', payload);
    return data as EnrollmentDocument;
  },
};
