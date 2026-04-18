import type {
  Enrollment,
  EnrollmentDocument,
  EnrollmentCheckoutState,
  EnrollmentMessage,
  EnrollmentPackageSummary,
  CheckoutPayment,
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

  getEnrollmentPackageSummary: async (enrollmentId: string): Promise<EnrollmentPackageSummary> => {
    const { data } = await apiClient.get(`/enrollments/${enrollmentId}/package-summary`);
    return data as EnrollmentPackageSummary;
  },

  getStudentJourney: async (studentId: string): Promise<StudentAcademicJourney> => {
    const { data } = await apiClient.get(`/enrollments/journey/${studentId}`);
    return data as StudentAcademicJourney;
  },

  getEnrollmentTimeline: async (enrollmentId: string): Promise<EnrollmentTimelineEvent[]> => {
    const { data } = await apiClient.get(`/enrollments/${enrollmentId}/timeline`);
    return Array.isArray(data) ? (data as EnrollmentTimelineEvent[]) : [];
  },

  getEnrollmentMessages: async (
    enrollmentId: string,
    channel?: 'enrollment' | 'accommodation',
  ): Promise<EnrollmentMessage[]> => {
    const query = channel ? `&channel=${channel}` : '';
    const { data } = await apiClient.get(`/enrollment-messages?enrollmentId=${enrollmentId}${query}`);
    return Array.isArray(data) ? (data as EnrollmentMessage[]) : [];
  },

  sendEnrollmentMessage: async (payload: {
    enrollmentId: string;
    senderId: string;
    message: string;
    channel?: 'enrollment' | 'accommodation';
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

  setEnrollmentAccommodation: async (
    enrollmentId: string,
    accommodationId?: string | null,
  ): Promise<Enrollment> => {
    const { data } = await apiClient.patch(`/enrollments/${enrollmentId}/accommodation`, {
      accommodationId: accommodationId ?? null,
    });
    return data as Enrollment;
  },

  updateEnrollmentAccommodationWorkflow: async (
    enrollmentId: string,
    payload: {
      status: 'not_selected' | 'selected' | 'approved' | 'denied' | 'closed';
      reason?: string;
      changedById?: string;
    },
  ): Promise<Enrollment> => {
    const { data } = await apiClient.patch(`/enrollments/${enrollmentId}/accommodation-workflow`, payload);
    return data as Enrollment;
  },

  getEnrollmentCheckout: async (enrollmentId: string): Promise<EnrollmentCheckoutState> => {
    const { data } = await apiClient.get(`/enrollments/${enrollmentId}/checkout`);
    return data as EnrollmentCheckoutState;
  },

  initializeEnrollmentCheckout: async (enrollmentId: string): Promise<EnrollmentCheckoutState> => {
    const { data } = await apiClient.post(`/enrollments/${enrollmentId}/checkout`);
    return data as EnrollmentCheckoutState;
  },

  payEnrollmentDownPaymentFake: async (enrollmentId: string): Promise<{
    payment: CheckoutPayment;
    checkout: EnrollmentCheckoutState;
  }> => {
    const { data } = await apiClient.post(`/enrollments/${enrollmentId}/checkout/pay-fake`);
    return data as { payment: CheckoutPayment; checkout: EnrollmentCheckoutState };
  },
};
