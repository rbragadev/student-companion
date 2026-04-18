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
  accommodationId?: string | null;
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
  accommodation?: {
    id: string;
    title: string;
    accommodationType: string;
    location: string;
    priceInCents: number;
    priceUnit: string;
    score?: number | null;
    recommendationBadge?: string | null;
  } | null;
}

export interface CreateEnrollmentIntentPayload {
  studentId: string;
  courseId: string;
  classGroupId: string;
  academicPeriodId: string;
  accommodationId?: string;
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
  accommodationStatus: 'not_selected' | 'selected' | 'approved' | 'denied' | 'closed';
  accommodationClosedAt?: string | null;
  institution: { id: string; name: string };
  school: { id: string; name: string };
  unit: { id: string; name: string; code: string };
  course: { id: string; program_name: string };
  classGroup: { id: string; name: string; code: string };
  academicPeriod: { id: string; name: string; startDate: string; endDate: string };
  accommodation?: {
    id: string;
    title: string;
    accommodationType: string;
    location: string;
    priceInCents: number;
    priceUnit: string;
    score?: number | null;
  } | null;
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
  channel?: 'enrollment' | 'accommodation';
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
  enrollmentAmount?: number;
  accommodationAmount?: number;
  packageTotalAmount?: number;
  currency: string;
  commissionAmount: number;
  commissionPercentage: number;
  enrollmentCommissionAmount?: number;
  enrollmentCommissionPercentage?: number;
  accommodationCommissionAmount?: number;
  accommodationCommissionPercentage?: number;
  totalCommissionAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentPackageSummary {
  enrollmentId: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentStatus: string;
  };
  institution: { id: string; name: string };
  school: { id: string; name: string };
  course: { id: string; program_name: string };
  accommodation?: {
    id: string;
    title: string;
    accommodationType: string;
    location: string;
    priceInCents: number;
    priceUnit: string;
    score?: number | null;
  } | null;
  pricing?: {
    currency: string;
    enrollmentAmount: number;
    accommodationAmount: number;
    packageTotalAmount: number;
    enrollmentCommissionAmount: number;
    accommodationCommissionAmount: number;
    totalCommissionAmount: number;
    commissionPercentage: number;
  } | null;
}

export interface EnrollmentTimelineEvent {
  id: string;
  type: 'enrollment_created' | 'status_changed' | 'accommodation_status_changed' | 'document' | 'message';
  occurredAt: string;
  title: string;
  description?: string | null;
  channel?: 'enrollment' | 'accommodation';
}
