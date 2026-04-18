'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { assertActionPermission } from '@/lib/authorization';

function getText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function getOptionalNumber(formData: FormData, key: string): number | undefined {
  const value = getText(formData, key);
  if (!value) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function getList(formData: FormData, key: string): string[] {
  const value = getText(formData, key);
  return value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
}

function getBool(formData: FormData, key: string): boolean {
  return String(formData.get(key) ?? '') === 'on';
}

function getPeriodType(formData: FormData): 'weekly' | 'fixed' {
  return getText(formData, 'periodType') === 'weekly' ? 'weekly' : 'fixed';
}

function payload(formData: FormData) {
  return {
    unitId: getText(formData, 'unitId'),
    schoolId: getText(formData, 'schoolId'),
    programName: getText(formData, 'programName'),
    weeklyHours: Number(getText(formData, 'weeklyHours')),
    priceInCents: getOptionalNumber(formData, 'priceInCents'),
    priceUnit: getText(formData, 'priceUnit') || undefined,
    description: getText(formData, 'description'),
    duration: getText(formData, 'duration'),
    visaType: getText(formData, 'visaType'),
    targetAudience: getText(formData, 'targetAudience'),
    image: getText(formData, 'image'),
    images: getList(formData, 'images'),
    badges: getList(formData, 'badges'),
    isActive: getBool(formData, 'isActive'),
    periodType: getPeriodType(formData),
    autoApproveIntent: getBool(formData, 'autoApproveIntent'),
  };
}

export async function createCourseAction(formData: FormData) {
  await assertActionPermission('structure.write');
  await apiFetch('/course', { method: 'POST', body: JSON.stringify(payload(formData)) });
  revalidatePath('/courses');
  redirect('/courses');
}

export async function updateCourseAction(id: string, formData: FormData) {
  await assertActionPermission('structure.write');
  await apiFetch(`/course/${id}`, { method: 'PATCH', body: JSON.stringify(payload(formData)) });
  revalidatePath('/courses');
  revalidatePath(`/courses/${id}`);
}

export async function deleteCourseAction(id: string) {
  await assertActionPermission('structure.write');
  await apiFetch(`/course/${id}`, { method: 'DELETE' });
  revalidatePath('/courses');
  redirect('/courses');
}
