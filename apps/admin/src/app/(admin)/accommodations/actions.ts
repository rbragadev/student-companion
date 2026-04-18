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
}
