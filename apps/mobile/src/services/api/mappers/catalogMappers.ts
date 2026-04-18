import type { Course } from '../../../types/course.types';
import type { School } from '../../../types/school.types';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return (value && typeof value === 'object' ? value : {}) as UnknownRecord;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function asOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  return asNumber(value, 0);
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function mapSchoolPayload(payload: unknown): School {
  const school = asRecord(payload);

  return {
    id: asString(school.id),
    institutionId: asOptionalString(school.institutionId ?? school.institution_id),
    name: asString(school.name),
    location: asString(school.location),
    description: asOptionalString(school.description),
    website: asOptionalString(school.website),
    phone: asOptionalString(school.phone),
    email: asOptionalString(school.email),
    logo: asOptionalString(school.logo),
    isPartner: asBoolean(school.isPartner ?? school.is_partner, false),
    badges: asStringArray(school.badges),
    rating: asOptionalNumber(school.rating),
    ratingCount: asOptionalNumber(school.ratingCount ?? school.rating_count),
    createdAt: asString(school.createdAt ?? school.created_at),
    updatedAt: asString(school.updatedAt ?? school.updated_at),
  };
}

export function mapCoursePayload(payload: unknown): Course {
  const course = asRecord(payload);

  const schoolPayload = course.school;
  const mappedSchool = schoolPayload ? mapSchoolPayload(schoolPayload) : undefined;

  const primaryImage = asString(course.image);
  const images = asStringArray(course.images);
  const resolvedImages = images.length > 0 ? images : (primaryImage ? [primaryImage] : []);

  return {
    id: asString(course.id),
    schoolId: asString(course.schoolId ?? course.school_id),
    programName: asString(course.programName ?? course.program_name),
    weeklyHours: asNumber(course.weeklyHours ?? course.weekly_hours, 0),
    priceInCents: asOptionalNumber(course.priceInCents ?? course.price_in_cents),
    priceUnit: asOptionalString(course.priceUnit ?? course.price_unit),
    description: asString(course.description),
    duration: asString(course.duration),
    visaType: asString(course.visaType ?? course.visa_type),
    targetAudience: asString(course.targetAudience ?? course.target_audience),
    image: primaryImage,
    images: resolvedImages,
    badges: asStringArray(course.badges),
    rating: asOptionalNumber(course.rating),
    ratingCount: asOptionalNumber(course.ratingCount ?? course.rating_count),
    isActive: asBoolean(course.isActive ?? course.is_active, true),
    createdAt: asString(course.createdAt ?? course.created_at),
    updatedAt: asString(course.updatedAt ?? course.updated_at),
    school: mappedSchool,
  };
}
