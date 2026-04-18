export interface ClassGroupOption {
  id: string;
  courseId: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export interface AcademicPeriodOption {
  id: string;
  classGroupId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export interface EnrollmentIntent {
  id: string;
  status: 'pending' | 'converted' | 'cancelled' | 'denied';
  deniedReason?: string | null;
  convertedAt?: string | null;
  studentId: string;
  courseId: string;
  classGroupId: string;
  academicPeriodId: string;
  createdAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentStatus: string;
  };
  course?: {
    id: string;
    program_name: string;
  };
  classGroup?: {
    id: string;
    name: string;
    code: string;
  };
  academicPeriod?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
}

export interface CreateEnrollmentIntentPayload {
  studentId: string;
  courseId: string;
  classGroupId: string;
  academicPeriodId: string;
}

export interface Enrollment {
  id: string;
  status:
    | 'application_started'
    | 'documents_pending'
    | 'under_review'
    | 'approved'
    | 'enrolled'
    | 'rejected'
    | 'cancelled'
    | 'active'
    | 'completed'
    | 'denied';
  createdAt: string;
  institution: { id: string; name: string };
  school: { id: string; name: string };
  unit: { id: string; name: string; code: string };
  course: { id: string; program_name: string };
  classGroup: { id: string; name: string; code: string };
  academicPeriod: { id: string; name: string; startDate: string; endDate: string };
  enrollmentIntent?: { id: string; status: string; convertedAt?: string | null };
  pricing?: EnrollmentPricing | null;
  documents?: EnrollmentDocument[];
  messages?: EnrollmentMessage[];
}

export interface StudentAcademicJourney {
  activeIntent: EnrollmentIntent | null;
  activeEnrollment: Enrollment | null;
  intentHistory: EnrollmentIntent[];
  enrollmentHistory: Enrollment[];
}

export interface EnrollmentDocument {
  id: string;
  enrollmentId: string;
  type: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string | null;
  createdAt: string;
}

export interface EnrollmentMessage {
  id: string;
  enrollmentId: string;
  senderId: string;
  message: string;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
  };
}

export interface EnrollmentPricing {
  id: string;
  enrollmentId: string;
  basePrice: number;
  fees: number;
  discounts: number;
  totalAmount: number;
  currency: string;
  commissionAmount: number;
  commissionPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentTimelineEvent {
  id: string;
  type: 'enrollment_created' | 'status_changed' | 'document' | 'message';
  occurredAt: string;
  title: string;
  description?: string | null;
}
