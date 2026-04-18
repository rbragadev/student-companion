import type { RecordStatus, Shift } from '@/types/structure.types';

export const RECORD_STATUS_OPTIONS: RecordStatus[] = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];
export const SHIFT_OPTIONS: Shift[] = ['MORNING', 'AFTERNOON', 'EVENING', 'FULL_TIME'];

export const RECORD_STATUS_LABEL: Record<RecordStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  ARCHIVED: 'Arquivado',
};

export const SHIFT_LABEL: Record<Shift, string> = {
  MORNING: 'Manhã',
  AFTERNOON: 'Tarde',
  EVENING: 'Noite',
  FULL_TIME: 'Integral',
};
