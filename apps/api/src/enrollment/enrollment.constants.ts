export const ENROLLMENT_STATUSES = [
  'draft',
  'started',
  'awaiting_school_approval',
  'approved',
  'checkout_available',
  'payment_pending',
  'partially_paid',
  'paid',
  'confirmed',
  'enrolled',
  'rejected',
  'cancelled',
  'expired',
] as const;

export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const ACTIVE_ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'draft',
  'started',
  'awaiting_school_approval',
  'approved',
  'checkout_available',
  'payment_pending',
  'partially_paid',
  'paid',
  'confirmed',
  'enrolled',
];

export const ENROLLMENT_TERMINAL_STATUSES: EnrollmentStatus[] = [
  'rejected',
  'cancelled',
  'expired',
];

export const ENROLLMENT_ALLOWED_TRANSITIONS: Record<
  EnrollmentStatus,
  EnrollmentStatus[]
> = {
  draft: ['started', 'cancelled', 'expired'],
  started: ['awaiting_school_approval', 'checkout_available', 'cancelled', 'expired'],
  awaiting_school_approval: ['approved', 'rejected', 'cancelled', 'expired'],
  approved: ['checkout_available', 'cancelled', 'expired'],
  checkout_available: ['payment_pending', 'cancelled', 'expired'],
  payment_pending: ['partially_paid', 'paid', 'cancelled', 'expired'],
  partially_paid: ['paid', 'cancelled', 'expired'],
  paid: ['confirmed', 'cancelled', 'expired'],
  confirmed: ['enrolled', 'cancelled', 'expired'],
  enrolled: ['cancelled', 'expired'],
  rejected: [],
  cancelled: [],
  expired: [],
};

export function getAllowedEnrollmentTransitions(
  currentStatus: EnrollmentStatus,
): EnrollmentStatus[] {
  return ENROLLMENT_ALLOWED_TRANSITIONS[currentStatus] ?? [];
}

export function validateEnrollmentTransition(
  currentStatus: EnrollmentStatus,
  nextStatus: EnrollmentStatus,
): boolean {
  if (currentStatus === nextStatus) return true;
  return getAllowedEnrollmentTransitions(currentStatus).includes(nextStatus);
}

export const validateTransition = validateEnrollmentTransition;

export const ENROLLMENT_DOCUMENT_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type EnrollmentDocumentStatus = (typeof ENROLLMENT_DOCUMENT_STATUSES)[number];

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
