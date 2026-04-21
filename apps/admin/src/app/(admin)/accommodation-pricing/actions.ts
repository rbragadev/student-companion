'use server';

import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { assertActionPermission } from '@/lib/authorization';

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Campo obrigatório: ${key}`);
  }
  return value.trim();
}

function getNumber(formData: FormData, key: string): number {
  const value = Number(getText(formData, key));
  if (Number.isNaN(value)) throw new Error(`Número inválido: ${key}`);
  return value;
}

function getOptionalNumber(formData: FormData, key: string): number | undefined {
  const raw = formData.get(key);
  if (raw === null || String(raw).trim() === '') return undefined;
  const value = Number(String(raw));
  if (Number.isNaN(value)) throw new Error(`Número inválido: ${key}`);
  return value;
}

function getOptionalText(formData: FormData, key: string): string | undefined {
  const raw = formData.get(key);
  if (raw === null || String(raw).trim() === '') return undefined;
  return String(raw).trim();
}

export async function createAccommodationPricingAction(formData: FormData) {
  await assertActionPermission('structure.write');

  await apiFetch('/accommodation-pricing', {
    method: 'POST',
    body: JSON.stringify({
      accommodationId: getText(formData, 'accommodationId'),
      periodOption: getText(formData, 'periodOption'),
      basePrice: getNumber(formData, 'basePrice'),
      pricePerDay: getOptionalNumber(formData, 'pricePerDay'),
      minimumStayDays: getOptionalNumber(formData, 'minimumStayDays'),
      windowStartDate: getOptionalText(formData, 'windowStartDate'),
      windowEndDate: getOptionalText(formData, 'windowEndDate'),
      currency: getText(formData, 'currency'),
      isActive: (formData.get('isActive') as string | null) === 'on',
    }),
  });

  redirect('/accommodation-pricing');
}

export async function updateAccommodationPricingAction(formData: FormData) {
  await assertActionPermission('structure.write');
  const id = getText(formData, 'id');

  await apiFetch(`/accommodation-pricing/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      periodOption: getText(formData, 'periodOption'),
      basePrice: getNumber(formData, 'basePrice'),
      pricePerDay: getOptionalNumber(formData, 'pricePerDay'),
      minimumStayDays: getOptionalNumber(formData, 'minimumStayDays'),
      windowStartDate: getOptionalText(formData, 'windowStartDate'),
      windowEndDate: getOptionalText(formData, 'windowEndDate'),
      currency: getText(formData, 'currency'),
      isActive: (formData.get('isActive') as string | null) === 'on',
    }),
  });

  redirect('/accommodation-pricing');
}
