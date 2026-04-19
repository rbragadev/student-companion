'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';

export async function updateStudentPreferencesAction(studentId: string, formData: FormData) {
  const destinationCity = String(formData.get('destinationCity') ?? '').trim();
  const destinationCountry = String(formData.get('destinationCountry') ?? '').trim();
  const purpose = String(formData.get('purpose') ?? '').trim();
  const englishLevelRaw = String(formData.get('englishLevel') ?? '').trim();
  const accommodationTypePreferenceRaw = String(formData.get('accommodationTypePreference') ?? '').trim();
  const budgetPreferenceRaw = String(formData.get('budgetPreference') ?? '').trim();
  const locationPreferenceRaw = String(formData.get('locationPreference') ?? '').trim();
  const notesRaw = String(formData.get('notes') ?? '').trim();
  const interestedInAccommodation = formData.get('interestedInAccommodation') === 'on';

  const toOptionalNumber = (value: FormDataEntryValue | null) => {
    const parsed = Number(String(value ?? '').trim());
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  };

  await apiFetch(`/user-preferences?userId=${studentId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      destinationCity,
      destinationCountry,
      purpose,
      englishLevel: englishLevelRaw || undefined,
      interestedInAccommodation,
      accommodationTypePreference: accommodationTypePreferenceRaw || undefined,
      preferredAccommodationTypes: accommodationTypePreferenceRaw
        ? [accommodationTypePreferenceRaw]
        : [],
      budgetPreference: budgetPreferenceRaw || undefined,
      locationPreference: locationPreferenceRaw || undefined,
      notes: notesRaw || undefined,
      budgetAccommodationMin: toOptionalNumber(formData.get('budgetAccommodationMin')),
      budgetAccommodationMax: toOptionalNumber(formData.get('budgetAccommodationMax')),
      budgetCourseMin: toOptionalNumber(formData.get('budgetCourseMin')),
      budgetCourseMax: toOptionalNumber(formData.get('budgetCourseMax')),
      maxDistanceToSchool: toOptionalNumber(formData.get('maxDistanceToSchool')),
    }),
  });

  revalidatePath(`/students/${studentId}`);
}
