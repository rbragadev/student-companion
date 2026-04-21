export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toTwoDigits(value: number) {
  return value.toString().padStart(2, '0');
}

export function normalizeDateOnly(value?: string | null): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (DATE_ONLY_PATTERN.test(trimmed)) {
    return trimmed;
  }

  const [datePart] = trimmed.split('T');
  if (DATE_ONLY_PATTERN.test(datePart)) {
    return datePart;
  }

  const parsedDate = new Date(trimmed);
  if (Number.isNaN(parsedDate.getTime())) return '';

  const year = parsedDate.getUTCFullYear();
  const month = toTwoDigits(parsedDate.getUTCMonth() + 1);
  const day = toTwoDigits(parsedDate.getUTCDate());

  return `${year}-${month}-${day}`;
}

export function toDateInputValue(value?: string | null): string {
  return normalizeDateOnly(value);
}

export function formatDatePtBr(value?: string | null): string {
  const date = normalizeDateOnly(value);
  if (!date) return '-';

  const [year, month, day] = date.split('-');
  if (!year || !month || !day) return '-';

  return `${day}/${month}/${year}`;
}

export function formatDateTimePtBr(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR');
}

export function toDateInputFromDate(value = new Date()): string {
  const localDate = new Date(value);
  const year = localDate.getFullYear();
  const month = toTwoDigits(localDate.getMonth() + 1);
  const day = toTwoDigits(localDate.getDate());

  return `${year}-${month}-${day}`;
}

export function normalizeToDate(value?: string | null): Date | null {
  const date = toDateInputValue(value);
  if (!date) return null;

  const [year, month, day] = date.split('-').map((part) => Number(part));
  if (!year || !month || !day) return null;

  const normalized = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(normalized.getTime()) ? null : normalized;
}
