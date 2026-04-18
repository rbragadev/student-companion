export const ENROLLMENT_STATUSES = [
  'application_started',
  'documents_pending',
  'under_review',
  'approved',
  'enrolled',
  'rejected',
  'cancelled',
  // Backward-compatible values used in older data/contracts
  'active',
  'completed',
  'denied',
] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const ACTIVE_ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'application_started',
  'documents_pending',
  'under_review',
  'approved',
  'enrolled',
  'active',
];

export const ENROLLMENT_DOCUMENT_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type EnrollmentDocumentStatus = (typeof ENROLLMENT_DOCUMENT_STATUSES)[number];

export const ENROLLMENT_INTENT_STATUSES = ['pending', 'converted', 'cancelled', 'denied'] as const;
export type EnrollmentIntentStatus = (typeof ENROLLMENT_INTENT_STATUSES)[number];

export const ENROLLMENT_ACCOMMODATION_STATUSES = [
  'not_selected',
  'selected',
  'approved',
  'denied',
  'closed',
] as const;
export type EnrollmentAccommodationStatus = (typeof ENROLLMENT_ACCOMMODATION_STATUSES)[number];

export const ENROLLMENT_MESSAGE_CHANNELS = ['enrollment', 'accommodation'] as const;
export type EnrollmentMessageChannel = (typeof ENROLLMENT_MESSAGE_CHANNELS)[number];

export const COMMISSION_SCOPE_TYPES = [
  'institution',
  'course',
  'accommodation',
  'service',
  'coupon',
] as const;

export type CommissionScopeType = (typeof COMMISSION_SCOPE_TYPES)[number];

export const ENROLLMENT_QUOTE_TYPES = [
  'course_only',
  'course_with_accommodation',
  'accommodation_only',
] as const;

export type EnrollmentQuoteType = (typeof ENROLLMENT_QUOTE_TYPES)[number];
