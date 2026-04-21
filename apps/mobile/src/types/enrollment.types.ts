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

export interface CoursePricing {
  id: string;
  courseId: string;
  academicPeriodId: string;
  duration?: string | null;
  basePrice: number;
  calculatedAmount?: number;
  weeks?: number;
  pricingLabel?: 'per week' | 'total price' | string;
  currency: string;
  isActive: boolean;
  academicPeriod?: { id: string; name: string };
}

export interface AccommodationPricing {
  id: string;
  accommodationId: string;
  periodOption: string;
  basePrice: number;
  pricePerDay?: number;
  basePriceMode?: 'per_day' | 'weekly';
  minimumStayDays?: number;
  windowStartDate?: string | null;
  windowEndDate?: string | null;
  calculatedAmount?: number;
  weeks?: number;
  durationDays?: number;
  selectedStartDate?: string | null;
  selectedEndDate?: string | null;
  breakdown?: {
    basePrice: number;
    priceUnit: string;
    weeks: number;
    durationDays: number;
    totalAmount: number;
  };
  pricingLabel?: 'per week' | string;
  currency: string;
  isActive: boolean;
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
  enrollment?: {
    id: string;
    status: string;
    createdAt?: string;
  } | null;
}

export interface CreateEnrollmentIntentPayload {
  studentId: string;
  courseId: string;
  classGroupId: string;
  academicPeriodId: string;
  accommodationId?: string;
  quoteId?: string;
}

export interface Enrollment {
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
  pricing?: EnrollmentPricing | null;
  documents?: EnrollmentDocument[];
  messages?: EnrollmentMessage[];
}

export interface StudentAcademicJourney {
  activeEnrollment: Enrollment | null;
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
  quote?: {
    id: string;
    type: 'course_only' | 'course_with_accommodation' | 'accommodation_only';
    downPaymentPercentage: number;
    downPaymentAmount: number;
    remainingAmount: number;
  } | null;
}

export interface EnrollmentTimelineEvent {
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
  channel?: 'enrollment' | 'accommodation';
}

export interface CheckoutPayment {
  id: string;
  enrollmentId?: string | null;
  enrollmentQuoteId?: string | null;
  type: 'down_payment' | string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  provider: string;
  providerReference?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface EnrollmentCheckoutState {
  enrollmentId: string;
  state:
    | 'available'
    | 'blocked_waiting_approval'
    | 'blocked_rejected'
    | 'blocked_missing_quote'
    | 'paid';
  reason?: string | null;
  autoApproveIntent: boolean;
  enrollmentStatus: Enrollment['status'];
  institution?: { id: string; name: string };
  school?: { id: string; name: string };
  unit?: { id: string; name: string };
  course?: { id: string; program_name: string };
  classGroup?: { id: string; name: string; code: string };
  academicPeriod?: { id: string; name: string };
  accommodation?: { id: string; title: string } | null;
  quote?: EnrollmentQuote | null;
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
  financial: {
    currency: string;
    totalAmount: number;
    downPaymentAmount: number;
    remainingAmount: number;
  };
  financialBreakdown?: {
    base: {
      courseAmount: number;
      accommodationAmount: number;
      totalAmount: number;
    };
    downPayment: {
      total: number;
      course: number;
      accommodation: number;
    };
    remaining: {
      total: number;
      course: number;
      accommodation: number;
    };
  };
  financeOperations?: {
    totalAmount: number;
    emittedAmount: number;
    paidAmount: number;
    pendingAmount: number;
    remainingAmount: number;
    pendingTransactionsCount: number;
    pendingTransactions: Array<{
      id: string;
      financeItemId: string;
      financeItemTitle: string;
      itemType: string;
      amount: number;
      currency: string;
      dueDate?: string | null;
      createdAt: string;
    }>;
  };
  canPayPendingInstallments?: boolean;
  payments: CheckoutPayment[];
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: {
    enrollmentId?: string;
    paymentId?: string;
    amount?: number;
    currency?: string;
    status?: string;
    [key: string]: unknown;
  } | null;
  readAt?: string | null;
  createdAt: string;
}

export interface EnrollmentQuote {
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
  enrollment?: { id: string; status: string } | null;
  payments?: Array<{
    id: string;
    type: string;
    status: string;
    amount: number;
    currency: string;
    paidAt?: string | null;
    createdAt: string;
  }>;
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
