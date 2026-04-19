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
  description?: string;
  image?: string;
  goodFor?: string | null;
  isPartner?: boolean;
  isTopTrip?: boolean;
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
    interestedInAccommodation?: boolean | null;
    accommodationTypePreference?: string | null;
    budgetPreference?: string | null;
    locationPreference?: string | null;
    notes?: string | null;
    budgetAccommodationMin?: number | null;
    budgetAccommodationMax?: number | null;
    budgetCourseMin?: number | null;
    budgetCourseMax?: number | null;
    maxDistanceToSchool?: number | null;
  } | null;
}

export interface EnrollmentAdmin {
  id: string;
  status:
    | 'draft'
    | 'started'
    | 'awaiting_school_approval'
    | 'approved'
    | 'checkout_available'
    | 'payment_pending'
    | 'partially_paid'
    | 'paid'
    | 'confirmed'
    | 'enrolled'
    | 'expired'
    | 'rejected'
    | 'cancelled'
    ;
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
  course: { id: string; program_name: string; auto_approve_intent?: boolean };
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
  accommodationOrder?: {
    id: string;
    type: string;
    status: string;
    totalAmount: number;
    currency: string;
    paymentStatus: string;
    items: Array<{
      id: string;
      itemType: string;
      startDate: string;
      endDate: string;
      amount: number;
      accommodation?: {
        id: string;
        title: string;
        accommodationType: string;
        location: string;
        priceInCents: number;
        priceUnit: string;
        score?: number | null;
      } | null;
    }>;
  } | null;
  pricing?: EnrollmentPricingAdmin | null;
  documents?: EnrollmentDocumentAdmin[];
  messages?: EnrollmentMessageAdmin[];
  statusHistory?: EnrollmentStatusHistoryAdmin[];
}

export interface StudentAcademicJourneyAdmin {
  activeEnrollment: EnrollmentAdmin | null;
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
  type:
    | 'enrollment_created'
    | 'status_changed'
    | 'accommodation_status_changed'
    | 'document'
    | 'message'
    | 'payment';
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

export interface EnrollmentCheckoutAdmin {
  enrollmentId: string;
  state:
    | 'available'
    | 'blocked_waiting_approval'
    | 'blocked_rejected'
    | 'blocked_missing_quote'
    | 'paid';
  reason?: string | null;
  autoApproveIntent: boolean;
  enrollmentStatus: EnrollmentAdmin['status'];
  financial: {
    currency: string;
    totalAmount: number;
    downPaymentAmount: number;
    remainingAmount: number;
  };
}

export interface PaymentAdmin {
  id: string;
  enrollmentId?: string | null;
  enrollmentQuoteId?: string | null;
  invoiceId?: string | null;
  type: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  provider: string;
  providerReference?: string | null;
  paidAt?: string | null;
  createdAt: string;
  enrollment?: {
    id: string;
    status: string;
    student: EnrollmentAdmin['student'];
    institution: EnrollmentAdmin['institution'];
    school: EnrollmentAdmin['school'];
    course: EnrollmentAdmin['course'];
  } | null;
  enrollmentQuote?: {
    id: string;
    type: string;
    totalAmount: number;
    downPaymentAmount: number;
    currency: string;
    coursePricing?: {
      id: string;
      course?: { id: string; program_name: string } | null;
    } | null;
    accommodationPricing?: {
      id: string;
      accommodation?: { id: string; title: string; accommodationType: string } | null;
    } | null;
  } | null;
  invoice?: {
    id: string;
    number: string;
    status: string;
    dueDate: string;
  } | null;
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
  academicPeriod?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    classGroupId?: string;
    classGroup?: { id: string; name: string; code: string };
  };
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
  enrollmentId?: string | null;
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
  enrollment?: {
    id: string;
    status: string;
  } | null;
  packageStatus?:
    | 'draft'
    | 'proposal_sent'
    | 'awaiting_approval'
    | 'approved'
    | 'checkout_available'
    | 'payment_pending'
    | 'paid'
    | 'cancelled';
  nextStep?: string;
  payments?: Array<{
    id: string;
    type: string;
    status: string;
    amount: number;
    currency: string;
    paidAt?: string | null;
    createdAt: string;
  }>;
}

export interface OrderAdmin {
  id: string;
  userId: string;
  enrollmentId?: string | null;
  enrollmentQuoteId?: string | null;
  type: 'course' | 'accommodation' | 'package' | string;
  status: string;
  totalAmount: number;
  currency: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  enrollment?: {
    id: string;
    status: string;
    school?: { id: string; name: string };
    institution?: { id: string; name: string };
  } | null;
  items: Array<{
    id: string;
    itemType: 'course' | 'accommodation' | string;
    referenceId: string;
    startDate: string;
    endDate: string;
    amount: number;
    course?: { id: string; program_name: string } | null;
    accommodation?: {
      id: string;
      title: string;
      accommodationType: string;
      location?: string | null;
    } | null;
  }>;
}

export interface FinancialOverviewAdmin {
  totals: {
    totalSold: number;
    totalInvoiced: number;
    totalReceived: number;
    totalPending: number;
    totalCommission: number;
    overdueInvoices: number;
  };
  revenueByMonth: Array<{
    month: string;
    received: number;
  }>;
  currency: string;
}

export interface SalesRowAdmin {
  id: string;
  student: EnrollmentAdmin['student'];
  institution: EnrollmentAdmin['institution'];
  school: EnrollmentAdmin['school'];
  course: EnrollmentAdmin['course'];
  accommodation: EnrollmentAdmin['accommodation'];
  commercialStatus: string;
  financialStatus: string;
  totalAmount: number;
  downPaymentAmount: number;
  remainingAmount: number;
  paidAmount: number;
  commissionAmount: number;
  commissionPercentage: number;
  currency: string;
  quote?: {
    id: string;
    type: string;
  } | null;
  invoice?: {
    id: string;
    number: string;
    status: string;
    totalAmount: number;
    dueDate: string;
  } | null;
}

export interface InvoiceAdmin {
  id: string;
  number: string;
  enrollmentId?: string | null;
  enrollmentQuoteId?: string | null;
  totalAmount: number;
  dueDate: string;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  currency: string;
  createdAt: string;
  updatedAt: string;
  enrollment?: {
    id: string;
    status: string;
    student: EnrollmentAdmin['student'];
    institution: EnrollmentAdmin['institution'];
    school: EnrollmentAdmin['school'];
    course: EnrollmentAdmin['course'];
    accommodation?: EnrollmentAdmin['accommodation'];
  } | null;
  enrollmentQuote?: {
    id: string;
    type: string;
    downPaymentAmount: number;
    remainingAmount: number;
    coursePricing?: {
      id: string;
      course?: { id: string; program_name: string } | null;
    } | null;
    accommodationPricing?: {
      id: string;
      accommodation?: { id: string; title: string; accommodationType: string } | null;
    } | null;
  } | null;
  items?: Array<{
    id: string;
    description: string;
    type: string;
    amount: number;
  }>;
  payments?: Array<{
    id: string;
    amount: number;
    status: string;
    type: string;
    paidAt?: string | null;
    createdAt: string;
  }>;
}

export interface CommissionEntryAdmin {
  enrollmentId: string;
  student: EnrollmentAdmin['student'];
  institution: EnrollmentAdmin['institution'];
  school: EnrollmentAdmin['school'];
  course: EnrollmentAdmin['course'];
  accommodation: EnrollmentAdmin['accommodation'];
  commissionTotal: number;
  commissionCourse: number;
  commissionAccommodation: number;
  commissionPercentage: number;
  source: string;
  currency: string;
  createdAt: string;
}

export interface FinancialReportsAdmin {
  revenue: {
    totalSold: number;
    totalReceived: number;
    totalPending: number;
  };
  revenueByInstitution: Array<{
    institutionId: string;
    institution: string;
    total: number;
  }>;
  revenueByCourse: Array<{
    courseId: string;
    course: string;
    total: number;
  }>;
  revenueByAccommodation: Array<{
    accommodationId: string;
    accommodation: string;
    total: number;
  }>;
  invoices: {
    pending: number;
    paid: number;
    overdue: number;
    cancelled: number;
    draft: number;
  };
  commissions: {
    total: number;
    byInstitution: Array<{
      institutionId: string;
      institution: string;
      total: number;
    }>;
    byCourse: Array<{
      courseId: string;
      course: string;
      total: number;
    }>;
  };
  currency: string;
}
