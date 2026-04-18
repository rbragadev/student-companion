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

function getOptionalNumber(formData: FormData, key: string): number | undefined {
  const value = formData.get(key);
  if (typeof value !== 'string' || value.trim() === '') return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) throw new Error(`Valor numérico inválido: ${key}`);
  return parsed;
}

export async function createCommissionConfigAction(formData: FormData) {
  await assertActionPermission('users.write');
  const scopeType = getText(formData, 'scopeType');
  const courseIdValue = formData.get('scopeCourseId');
  const institutionIdValue = formData.get('scopeInstitutionId');
  const scopeCourseId = typeof courseIdValue === 'string' ? courseIdValue.trim() : '';
  const scopeInstitutionId = typeof institutionIdValue === 'string' ? institutionIdValue.trim() : '';

  const scopeId =
    scopeType === 'course'
      ? scopeCourseId
      : scopeInstitutionId;
  if (!scopeId) {
    throw new Error('Selecione um escopo válido para configurar comissão.');
  }

  await apiFetch('/commission-config', {
    method: 'POST',
    body: JSON.stringify({
      scopeType,
      scopeId,
      percentage: Number(getText(formData, 'percentage')),
      fixedAmount: getOptionalNumber(formData, 'fixedAmount'),
    }),
  });

  redirect('/commission-config');
}

export async function updateCommissionConfigAction(formData: FormData) {
  await assertActionPermission('users.write');
  const id = getText(formData, 'id');

  await apiFetch(`/commission-config/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      scopeType: getText(formData, 'scopeType'),
      scopeId: getText(formData, 'scopeId'),
      percentage: Number(getText(formData, 'percentage')),
      fixedAmount: getOptionalNumber(formData, 'fixedAmount'),
    }),
  });

  redirect('/commission-config');
}
