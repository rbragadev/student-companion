'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';
import { assertActionPermission } from '@/lib/authorization';

function getText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function getOptionalNumber(formData: FormData, key: string): number | undefined {
  const raw = getText(formData, key);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getOptionalText(formData: FormData, key: string): string | undefined {
  const raw = String(formData.get(key) ?? '').trim();
  return raw ? raw : undefined;
}

function getBoolean(formData: FormData, key: string): boolean {
  return String(formData.get(key) ?? '') === 'on';
}

function parseCsv(value?: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function updateSchoolAccommodationRecommendationAction(formData: FormData) {
  await assertActionPermission('structure.write');

  const schoolId = getText(formData, 'schoolId');
  const accommodationId = getText(formData, 'accommodationId');
  const isRecommended = getText(formData, 'isRecommended') === 'on';
  const priority = getOptionalNumber(formData, 'priority') ?? 0;
  const badgeLabel = getText(formData, 'badgeLabel');

  await apiFetch(`/accommodation/recommendations/school/${schoolId}/${accommodationId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      isRecommended,
      priority,
      badgeLabel,
    }),
  });

  revalidatePath('/accommodations');
  revalidatePath(`/accommodations/${accommodationId}`);
}

export async function updateAccommodationAction(accommodationId: string, formData: FormData) {
  await assertActionPermission('structure.write');

  await apiFetch(`/accommodation/${accommodationId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      title: getText(formData, 'title'),
      accommodationType: getText(formData, 'accommodationType'),
      location: getText(formData, 'location'),
      description: getText(formData, 'description'),
      image: getText(formData, 'image'),
      priceInCents: getOptionalNumber(formData, 'priceInCents'),
      priceUnit: getOptionalText(formData, 'priceUnit'),
      score: getOptionalNumber(formData, 'score'),
      goodFor: getOptionalText(formData, 'goodFor'),
      badges: parseCsv(getOptionalText(formData, 'badges')),
      isPartner: getBoolean(formData, 'isPartner'),
      isTopTrip: getBoolean(formData, 'isTopTrip'),
      isActive: getBoolean(formData, 'isActive'),
    }),
  });

  revalidatePath('/accommodations');
  revalidatePath(`/accommodations/${accommodationId}`);
}

export async function createAccommodationPricingInlineAction(
  accommodationId: string,
  formData: FormData,
) {
  await assertActionPermission('structure.write');

  await apiFetch('/accommodation-pricing', {
    method: 'POST',
    body: JSON.stringify({
      accommodationId,
      periodOption: getText(formData, 'periodOption'),
      basePrice: getOptionalNumber(formData, 'basePrice') ?? 0,
      pricePerDay: getOptionalNumber(formData, 'pricePerDay'),
      minimumStayDays: getOptionalNumber(formData, 'minimumStayDays'),
      windowStartDate: getOptionalText(formData, 'windowStartDate'),
      windowEndDate: getOptionalText(formData, 'windowEndDate'),
      currency: getText(formData, 'currency'),
      isActive: getBoolean(formData, 'isActive'),
    }),
  });

  revalidatePath(`/accommodations/${accommodationId}`);
}

export async function updateAccommodationPricingInlineAction(formData: FormData) {
  await assertActionPermission('structure.write');
  const id = getText(formData, 'id');
  const accommodationId = getText(formData, 'accommodationId');

  await apiFetch(`/accommodation-pricing/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      periodOption: getText(formData, 'periodOption'),
      basePrice: getOptionalNumber(formData, 'basePrice') ?? 0,
      pricePerDay: getOptionalNumber(formData, 'pricePerDay'),
      minimumStayDays: getOptionalNumber(formData, 'minimumStayDays'),
      windowStartDate: getOptionalText(formData, 'windowStartDate'),
      windowEndDate: getOptionalText(formData, 'windowEndDate'),
      currency: getText(formData, 'currency'),
      isActive: getBoolean(formData, 'isActive'),
    }),
  });

  revalidatePath(`/accommodations/${accommodationId}`);
}
