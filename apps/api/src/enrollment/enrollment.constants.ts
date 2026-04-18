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

export const COMMISSION_SCOPE_TYPES = [
  'institution',
  'course',
  'accommodation',
  'service',
  'coupon',
] as const;

export type CommissionScopeType = (typeof COMMISSION_SCOPE_TYPES)[number];
