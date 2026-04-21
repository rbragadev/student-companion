'use client';

import { useMemo, useState } from 'react';

type PeriodType = 'fixed' | 'weekly';

interface CoursePricingPeriodFieldsProps {
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  duration: string;
  canWrite: boolean;
  startDateFieldClassName?: string;
  endDateFieldClassName?: string;
  durationFieldClassName?: string;
  startDateName?: string;
  endDateName?: string;
  durationName?: string;
  startDateClassName?: string;
  endDateClassName?: string;
  durationClassName?: string;
  required?: boolean;
}

function toDate(value: string) {
  const [datePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map((part) => Number(part));
  if (!year || !month || !day) return new Date(NaN);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

function getWeeklyWeeks(startDate: string, endDate: string) {
  if (!startDate || !endDate) return { isValid: false as const, weeks: 0, label: '' };
  const start = toDate(startDate);
  const end = toDate(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { isValid: false as const, weeks: 0, label: '' };
  }

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const isValidSundayToSunday = start.getUTCDay() === 0 && end.getUTCDay() === 0;
  if (diffDays <= 0 || diffDays % 7 !== 0 || !isValidSundayToSunday) {
    return { isValid: false as const, weeks: 0, label: '' };
  }

  const weeks = diffDays / 7;
  return {
    isValid: true,
    weeks,
    label: weeks === 1 ? '1 week' : `1-${weeks} weeks`,
  };
}

function isSunday(value: string) {
  if (!value) return false;
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getUTCDay() === 0;
}

export function CoursePricingPeriodFields({
  periodType,
  startDate: initialStartDate,
  endDate: initialEndDate,
  duration: initialDuration,
  canWrite,
  startDateName = 'startDate',
  endDateName = 'endDate',
  durationName = 'duration',
  startDateFieldClassName = 'sm:col-span-1',
  endDateFieldClassName = 'sm:col-span-1',
  durationFieldClassName = 'sm:col-span-1',
  startDateClassName = 'h-9 rounded-lg border border-slate-300 px-3 text-sm',
  endDateClassName = 'h-9 rounded-lg border border-slate-300 px-3 text-sm',
  durationClassName = 'h-9 rounded-lg border border-slate-300 px-3 text-sm',
  required = true,
}: CoursePricingPeriodFieldsProps) {
  const isWeekly = periodType === 'weekly';
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [manualDuration, setManualDuration] = useState(initialDuration);

  const weeklyInfo = useMemo(() => (isWeekly ? getWeeklyWeeks(startDate, endDate) : null), [isWeekly, startDate, endDate]);
  const finalDuration = isWeekly ? (weeklyInfo?.label ?? '') : manualDuration;
  const isStartSunday = isWeekly ? isSunday(startDate) : true;
  const isEndSunday = isWeekly ? isSunday(endDate) : true;
  const hasWrongWeekday = isWeekly && (!isStartSunday || !isEndSunday);

  const disabledClass = 'disabled:bg-slate-100';
  const finalDurationClass = `${durationClassName} ${canWrite ? '' : disabledClass}`;
  const baseDateClass = `${startDateClassName} ${canWrite ? '' : disabledClass}`;
  const baseEndDateClass = `${endDateClassName} ${canWrite ? '' : disabledClass}`;

  if (isWeekly) {
    return (
      <>
        <div className={`space-y-1 ${startDateFieldClassName}`}>
          <span className="text-xs font-medium text-slate-700">Início (domingo)</span>
          <input
            name={startDateName}
            type="date"
            required={required}
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            disabled={!canWrite}
            className={`${baseDateClass} ${hasWrongWeekday && !isStartSunday ? 'border-red-300' : ''}`}
          />
        </div>
        <div className={`space-y-1 ${endDateFieldClassName}`}>
          <span className="text-xs font-medium text-slate-700">Fim (domingo)</span>
          <input
            name={endDateName}
            type="date"
            required={required}
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            disabled={!canWrite}
            className={`${baseEndDateClass} ${hasWrongWeekday && !isEndSunday ? 'border-red-300' : ''}`}
          />
        </div>
        <div className={`space-y-1 ${durationFieldClassName}`}>
          <span className="text-xs font-medium text-slate-700">Duração em semanas</span>
          <input
            name={durationName}
            value={finalDuration}
            readOnly
            required={required}
            className={finalDurationClass}
            aria-label="Duração em semanas"
            title="Duração calculada pela janela semanal selecionada"
          />
          <p className="text-xs text-slate-500">
            {weeklyInfo && weeklyInfo.isValid
              ? `Janela válida: domingo a domingo (${weeklyInfo.label}).`
              : 'Selecione janelas semanais (domingo a domingo, múltiplos de 7 dias).'}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={`space-y-1 ${startDateFieldClassName}`}>
        <span className="text-xs font-medium text-slate-700">Início</span>
        <input
          name={startDateName}
          type="date"
          required={required}
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          disabled={!canWrite}
          className={baseDateClass}
        />
      </div>
      <div className={`space-y-1 ${endDateFieldClassName}`}>
        <span className="text-xs font-medium text-slate-700">Fim</span>
        <input
          name={endDateName}
          type="date"
          required={required}
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          disabled={!canWrite}
          className={baseEndDateClass}
        />
      </div>
      <div className={`space-y-1 ${durationFieldClassName}`}>
        <span className="text-xs font-medium text-slate-700">Duração</span>
        <input
          name={durationName}
          required={required}
          value={manualDuration}
          onChange={(event) => setManualDuration(event.target.value)}
          disabled={!canWrite}
          className={`${durationClassName} ${canWrite ? '' : disabledClass}`}
          placeholder="ex: 16 weeks"
        />
      </div>
    </>
  );
}
