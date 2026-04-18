export interface InstitutionAdmin {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolAdmin {
  id: string;
  institutionId: string;
  name: string;
  location: string;
  description: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  logo: string | null;
  isPartner: boolean;
  institution?: { id: string; name: string };
  _count?: { course: number };
}

export interface CourseAdmin {
  id: string;
  unitId: string;
  school_id: string;
  program_name: string;
  weekly_hours: number;
  price_in_cents: number | null;
  price_unit: string | null;
  description: string;
  duration: string;
  period_type?: 'weekly' | 'fixed';
  auto_approve_intent?: boolean;
  visa_type: string;
  target_audience: string;
  image: string;
  images: string[];
  badges: string[];
  is_active: boolean;
  classes?: { id: string; name: string; code: string; status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' }[];
  school?: { id: string; name: string; location: string; institution?: { id: string; name: string } };
  unit?: {
    id: string;
    name: string;
    code: string;
    school?: { id: string; name: string; institution?: { id: string; name: string } };
  };
}

export interface AccommodationAdmin {
  id: string;
  title: string;
  accommodationType: string;
  location: string;
  priceInCents: number;
  priceUnit: string;
  score?: number | null;
  badges?: string[];
  recommendationBadge?: string | null;
  recommendationPriority?: number;
  isRecommendedBySchool?: boolean;
  isActive: boolean;
}

export interface SchoolAccommodationRecommendationAdmin extends AccommodationAdmin {
  isRecommendedBySchool: boolean;
  recommendationPriority: number;
  recommendationBadge: string | null;
}

export interface PlaceAdmin {
  id: string;
  name: string;
  category: string;
  location: string | null;
  rating: number | null;
  isActive: boolean | null;
}

export interface StudentAdmin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'STUDENT';
  studentStatus?: 'lead' | 'application_started' | 'pending_enrollment' | 'enrolled';
  preferences?: {
    destinationCity: string;
    destinationCountry: string;
    purpose: string;
    englishLevel: string | null;
  } | null;
}

export interface EnrollmentIntentAdmin {
  id: string;
  status: 'pending' | 'converted' | 'cancelled' | 'denied';
  deniedReason?: string | null;
  convertedAt: string | null;
  createdAt: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentStatus: 'lead' | 'application_started' | 'pending_enrollment' | 'enrolled';
  };
  course: {
    id: string;
    program_name: string;
    school?: {
      id: string;
      name: string;
      institution?: { id: string; name: string };
    };
  };
  classGroup: {
    id: string;
    name: string;
    code: string;
  };
  academicPeriod: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  };
  accommodation?: {
    id: string;
    title: string;
    accommodationType: string;
    location: string;
    priceInCents: number;
    priceUnit: string;
    score?: number | null;
  } | null;
  enrollment?: {
    id: string;
    status: string;
  } | null;
}

export interface EnrollmentAdmin {
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
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentStatus: 'lead' | 'application_started' | 'pending_enrollment' | 'enrolled';
  };
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
  enrollmentIntent: { id: string; status: string; convertedAt: string | null };
  pricing?: EnrollmentPricingAdmin | null;
  documents?: EnrollmentDocumentAdmin[];
  messages?: EnrollmentMessageAdmin[];
  statusHistory?: EnrollmentStatusHistoryAdmin[];
}

export interface StudentAcademicJourneyAdmin {
  activeIntent: EnrollmentIntentAdmin | null;
  activeEnrollment: EnrollmentAdmin | null;
  intentHistory: EnrollmentIntentAdmin[];
  enrollmentHistory: EnrollmentAdmin[];
}

export interface EnrollmentDocumentAdmin {
  id: string;
  enrollmentId: string;
  type: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentMessageAdmin {
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

export interface EnrollmentStatusHistoryAdmin {
  id: string;
  enrollmentId: string;
  fromStatus?: string | null;
  toStatus: string;
  reason?: string | null;
  changedById?: string | null;
  createdAt: string;
  changedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
  } | null;
}

export interface EnrollmentTimelineEventAdmin {
  id: string;
  type: 'enrollment_created' | 'status_changed' | 'accommodation_status_changed' | 'document' | 'message';
  occurredAt: string;
  title: string;
  description?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  channel?: 'enrollment' | 'accommodation';
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
  };
  changedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
  };
}

export interface EnrollmentPricingAdmin {
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

export interface CommissionConfigAdmin {
  id: string;
  scopeType: 'institution' | 'course' | 'accommodation' | 'service' | 'coupon';
  scopeId: string;
  percentage: number;
  fixedAmount?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CoursePricingAdmin {
  id: string;
  courseId: string;
  academicPeriodId: string;
  duration?: string | null;
  basePrice: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  course?: { id: string; program_name: string };
  academicPeriod?: { id: string; name: string; startDate: string; endDate: string };
}

export interface AccommodationPricingAdmin {
  id: string;
  accommodationId: string;
  periodOption: string;
  basePrice: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  accommodation?: { id: string; title: string; accommodationType: string };
}

export interface EnrollmentQuoteAdmin {
  id: string;
  enrollmentIntentId?: string | null;
  coursePricingId?: string | null;
  accommodationPricingId?: string | null;
  courseAmount: number;
  accommodationAmount: number;
  fees: number;
  discounts: number;
  totalAmount: number;
  currency: string;
  downPaymentPercentage: number;
  downPaymentAmount: number;
  remainingAmount: number;
  commissionPercentage: number;
  commissionAmount: number;
  commissionCourseAmount: number;
  commissionAccommodationAmount: number;
  type: 'course_only' | 'course_with_accommodation' | 'accommodation_only';
  createdAt: string;
  items?: Array<{
    id: string;
    itemType: 'course' | 'accommodation';
    referenceId: string;
    startDate: string;
    endDate: string;
    amount: number;
    commissionAmount: number;
  }>;
  coursePricing?: {
    id: string;
    course?: { id: string; program_name: string };
    academicPeriod?: { id: string; name: string };
  } | null;
  accommodationPricing?: {
    id: string;
    accommodation?: { id: string; title: string; accommodationType: string };
  } | null;
}
