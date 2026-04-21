'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AccommodationAdmin, CourseAdmin, StudentAdmin } from '@/types/catalog.types';
import { formatDatePtBr, toDateInputValue } from '@/lib/date';
import { createEnrollmentFromAdminAction } from '../actions';

interface CourseOffer {
  id: string;
  courseId: string;
  classGroupId: string;
  classGroupName: string;
  classGroupCode: string;
  academicPeriodId: string;
  academicPeriodName: string;
  startDate: string;
  endDate: string;
}

interface PricingPreview {
  id: string;
  amount: number;
  currency: string;
  itemType?: 'course' | 'accommodation';
  minimumStayDays?: number;
  windowStartDate?: string;
  windowEndDate?: string;
  basePrice?: number;
  basePriceMode?: 'per_day' | 'weekly';
  pricingLabel?: string;
}

interface AccommodationRulePreview {
  id: string;
  periodOption: string;
  basePrice: number;
  pricePerDay?: number | null;
  minimumStayDays?: number | null;
  windowStartDate?: string | null;
  windowEndDate?: string | null;
  currency?: string | null;
  isActive: boolean;
}

function pickBestAccommodationRule(
  rules: AccommodationRulePreview[],
  opts: {
    periodOption?: string;
    offerStartDate?: string;
    offerEndDate?: string;
    startDate?: string;
    endDate?: string;
  },
) {
  const normalizedPeriod = normalizePeriodOption(opts.periodOption);
  const startDate = opts.startDate || '';
  const endDate = opts.endDate || '';
  const offerStartDate = opts.offerStartDate || '';
  const offerEndDate = opts.offerEndDate || '';

  const isInWindow = (rule: AccommodationRulePreview) => {
    if (!startDate || !endDate) return false;
    if (rule.windowStartDate && startDate < toDateOnly(rule.windowStartDate)) return false;
    if (rule.windowEndDate && endDate > toDateOnly(rule.windowEndDate)) return false;
    return true;
  };

  if (!rules.length) return null;
  if (normalizedPeriod) {
    const exact = rules.find((rule) => normalizePeriodOption(rule.periodOption) === normalizedPeriod);
    if (exact) return exact;

    const fuzzy = rules.find((rule) => {
      const normalizedRule = normalizePeriodOption(rule.periodOption);
      return (
        normalizedRule.includes(normalizedPeriod) ||
        normalizedPeriod.includes(normalizedRule) ||
        normalizedPeriod.includes(normalizedRule.split(' ').join(''))
      );
    });
    if (fuzzy) return fuzzy;
  }

  const withWindowMatch = rules.find(isInWindow);
  if (withWindowMatch) return withWindowMatch;

  const withPeriodDates = rules.find((rule) => {
    if (!offerStartDate || !offerEndDate) return false;
    if (rule.windowStartDate && offerStartDate < toDateOnly(rule.windowStartDate)) return false;
    if (rule.windowEndDate && offerEndDate > toDateOnly(rule.windowEndDate)) return false;
    return true;
  });
  if (withPeriodDates) return withPeriodDates;

  return rules.find((rule) => rule.basePrice !== null && rule.basePrice !== undefined) || rules[0];
}

interface Props {
  students: StudentAdmin[];
  courses: CourseAdmin[];
  accommodations: AccommodationAdmin[];
  offersByCourse: Record<string, CourseOffer[]>;
  mode?: 'enrollment' | 'package';
  showProposalActions?: boolean;
}

function toDateOnly(value: string) {
  return toDateInputValue(value);
}

function toIsoDate(value: string) {
  return value;
}

function formatMoney(
  value: number | string | null | undefined,
  currency: string,
) {
  const numericValue =
    typeof value === 'number' ? value : Number.parseFloat(String(value ?? '0').replace(',', '.'));
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  return `${safeValue.toFixed(2)} ${currency}`;
}

function normalizePeriodOption(value?: string) {
  return (value ?? '').trim().toLowerCase();
}

function calculateWeeks(startDate: string, endDate: string) {
  const start = parseDateOnlyUtcMidday(startDate);
  const end = parseDateOnlyUtcMidday(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0 || diffDays % 7 !== 0) return null;
  return diffDays / 7;
}

function calculateDays(startDate: string, endDate: string) {
  const start = parseDateOnlyUtcMidday(startDate);
  const end = parseDateOnlyUtcMidday(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(value: string) {
  return formatDatePtBr(value) === '-' ? 'não definida' : formatDatePtBr(value);
}

function parseDateOnlyUtcMidday(value: string) {
  const [datePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map((part) => Number(part));
  if (!year || !month || !day) return new Date(NaN);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
}

export function NewEnrollmentForm({
  students,
  courses,
  accommodations,
  offersByCourse,
  mode = 'enrollment',
  showProposalActions = true,
}: Readonly<Props>) {
  const isPackageMode = mode === 'package';
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id ?? '');
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<string>('');
  const [createPackage, setCreatePackage] = useState<boolean>(true);
  const [courseStartDate, setCourseStartDate] = useState<string>('');
  const [courseEndDate, setCourseEndDate] = useState<string>('');
  const [accommodationStartDate, setAccommodationStartDate] = useState<string>('');
  const [accommodationEndDate, setAccommodationEndDate] = useState<string>('');
  const [coursePreview, setCoursePreview] = useState<PricingPreview | null>(null);
  const [accommodationPreview, setAccommodationPreview] = useState<PricingPreview | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [accommodationRuleError, setAccommodationRuleError] = useState<string | null>(null);
  const [accommodationRules, setAccommodationRules] = useState<AccommodationRulePreview[]>([]);
  const [isAccommodationRulesLoading, setIsAccommodationRulesLoading] = useState(false);
  const [accommodationRulesError, setAccommodationRulesError] = useState<string | null>(null);
  const [showAccommodationRulesModal, setShowAccommodationRulesModal] = useState(false);

  const offers = useMemo(() => offersByCourse[selectedCourseId] ?? [], [offersByCourse, selectedCourseId]);
  const selectedCourse = useMemo(
    () => courses.find((item) => item.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );
  const isFixedPeriod = selectedCourse?.period_type !== 'weekly';
  const selectedOffer = useMemo(
    () => offers.find((offer) => offer.id === selectedOfferId) ?? offers[0] ?? null,
    [offers, selectedOfferId],
  );
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  const accommodationMinimumStayDays = accommodationPreview?.minimumStayDays ?? 0;
  const accommodationWindowStart = accommodationPreview?.windowStartDate
    ? toDateOnly(accommodationPreview.windowStartDate)
    : '';
  const accommodationWindowEnd = accommodationPreview?.windowEndDate
    ? toDateOnly(accommodationPreview.windowEndDate)
    : '';
  const selectedAccommodation = useMemo(
    () => accommodations.find((item) => item.id === selectedAccommodationId) ?? null,
    [accommodations, selectedAccommodationId],
  );
  const selectedAccommodationRule = useMemo(() => {
    return pickBestAccommodationRule(accommodationRules, {
      periodOption: selectedOffer?.academicPeriodName,
      offerStartDate: selectedOffer?.startDate,
      offerEndDate: selectedOffer?.endDate,
      startDate: accommodationStartDate || selectedOffer?.startDate,
      endDate: accommodationEndDate || selectedOffer?.endDate,
    });
  }, [accommodationRules, accommodationEndDate, accommodationStartDate, selectedOffer?.academicPeriodName, selectedOffer?.endDate, selectedOffer?.startDate]);
  const activeAccommodationWindowStart =
    accommodationWindowStart ||
    toDateOnly(selectedAccommodationRule?.windowStartDate ?? '') ||
    toDateOnly(selectedOffer?.startDate ?? '');
  const activeAccommodationWindowEnd =
    accommodationWindowEnd ||
    toDateOnly(selectedAccommodationRule?.windowEndDate ?? '') ||
    toDateOnly(selectedOffer?.endDate ?? '');
  const effectiveAccommodationMinimumStayDays =
    accommodationMinimumStayDays || selectedAccommodationRule?.minimumStayDays || 1;
  const selectedAccommodationDatesAreAligned =
    selectedAccommodationId && accommodationStartDate && accommodationEndDate
      ? accommodationStartDate === courseStartDate && accommodationEndDate === courseEndDate
      : true;
  const accommodationDateRangeDays = calculateDays(accommodationStartDate, accommodationEndDate);
  const isAccommodationDateOutOfWindow =
    !!activeAccommodationWindowStart &&
    !!activeAccommodationWindowEnd &&
    !!accommodationStartDate &&
    !!accommodationEndDate &&
    (accommodationStartDate < activeAccommodationWindowStart || accommodationEndDate > activeAccommodationWindowEnd);
  const isAccommodationDateShorterThanMinimum =
    !!accommodationDateRangeDays &&
    effectiveAccommodationMinimumStayDays > 0 &&
    accommodationDateRangeDays < effectiveAccommodationMinimumStayDays;

  useEffect(() => {
    if (!selectedAccommodationId) {
      setAccommodationRules([]);
      setAccommodationRulesError(null);
      setShowAccommodationRulesModal(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const run = async () => {
      try {
        setIsAccommodationRulesLoading(true);
        setAccommodationRulesError(null);
        const rulesRes = await fetch(
          `${apiUrl}/accommodation-pricing?accommodationId=${encodeURIComponent(selectedAccommodationId)}&isActive=true`,
          {
            signal: controller.signal,
            cache: 'no-store',
          },
        );
        const rulesBody = await rulesRes.json().catch(() => ({}));
        if (!rulesRes.ok) {
          throw new Error(rulesBody?.message ?? 'Não foi possível carregar regras da acomodação.');
        }
        const rows = (rulesBody?.data ?? rulesBody) as AccommodationRulePreview[];
        if (!active) return;
        setAccommodationRules(Array.isArray(rows) ? rows : []);
      } catch (error) {
        if (!active) return;
        setAccommodationRules([]);
        setAccommodationRulesError(error instanceof Error ? error.message : 'Falha ao carregar regras da acomodação.');
      } finally {
        if (active) setIsAccommodationRulesLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [apiUrl, selectedAccommodationId]);

  useEffect(() => {
    if (!selectedOffer && offers.length === 0) {
      setSelectedOfferId('');
      setCourseStartDate('');
      setCourseEndDate('');
      return;
    }
    const nextOffer = selectedOffer ?? offers[0];
    if (!nextOffer) return;
    setSelectedOfferId(nextOffer.id);
    setCourseStartDate(toDateOnly(nextOffer.startDate));
    setCourseEndDate(toDateOnly(nextOffer.endDate));
    setAccommodationStartDate(toDateOnly(nextOffer.startDate));
    setAccommodationEndDate(toDateOnly(nextOffer.endDate));
  }, [selectedCourseId, selectedOffer?.id, offers]);

  useEffect(() => {
    if (isPackageMode) {
      setCreatePackage(true);
      return;
    }

    if (!selectedAccommodationId) {
      setCreatePackage(true);
    }
  }, [isPackageMode, selectedAccommodationId]);

  useEffect(() => {
    if (!selectedCourseId || !selectedOffer?.academicPeriodId || !courseStartDate || !courseEndDate) {
      setCoursePreview(null);
      setAccommodationPreview(null);
      setPricingError(null);
      setAccommodationRuleError(null);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const run = async () => {
      try {
        setPricingLoading(true);
        setPricingError(null);

        const courseParams = new URLSearchParams({
          courseId: selectedCourseId,
          academicPeriodId: selectedOffer.academicPeriodId,
          startDate: toIsoDate(courseStartDate),
          endDate: toIsoDate(courseEndDate),
        });

        const courseRes = await fetch(`${apiUrl}/course-pricing/resolve?${courseParams.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        const courseBody = await courseRes.json().catch(() => ({}));
        if (!courseRes.ok) {
          throw new Error(courseBody?.message ?? 'Não foi possível resolver pricing do curso.');
        }
        const courseData = (courseBody?.data ?? courseBody) as {
          id: string;
          finalPrice?: number;
          calculatedAmount?: number;
          basePrice?: number;
          currency?: string;
        };
        const fallbackWeeklyWeeks = isFixedPeriod ? null : calculateWeeks(courseStartDate, courseEndDate);
        const fallbackCourseAmount = isFixedPeriod
          ? courseData.basePrice ?? 0
          : Number(courseData.basePrice ?? 0) * (fallbackWeeklyWeeks ?? 0);
        const nextCourse: PricingPreview = {
          id: courseData.id,
          amount: Number(courseData.finalPrice ?? courseData.calculatedAmount ?? fallbackCourseAmount ?? 0),
          currency: courseData.currency ?? 'CAD',
        };

        let nextAccommodation: PricingPreview | null = null;
        if (selectedAccommodationId && accommodationStartDate && accommodationEndDate) {
          const accommodationParams = new URLSearchParams({
            accommodationId: selectedAccommodationId,
            periodOption: selectedOffer.academicPeriodName,
            startDate: toIsoDate(accommodationStartDate),
            endDate: toIsoDate(accommodationEndDate),
          });
          const accommodationRes = await fetch(
            `${apiUrl}/accommodation-pricing/resolve?${accommodationParams.toString()}`,
            {
              signal: controller.signal,
              cache: 'no-store',
            },
          );
          const accommodationBody = await accommodationRes.json().catch(() => ({}));
          if (!accommodationRes.ok) {
            throw new Error(accommodationBody?.message ?? 'Não foi possível resolver pricing da acomodação.');
          }
        const accommodationData = (accommodationBody?.data ?? accommodationBody) as {
          id: string;
          finalPrice?: number;
          calculatedAmount?: number;
          basePrice?: number;
          currency?: string;
          basePriceMode?: 'per_day' | 'weekly';
          pricingLabel?: string;
          minimumStayDays?: number;
          windowStartDate?: string;
          windowEndDate?: string;
        };
        nextAccommodation = {
          id: accommodationData.id,
          amount: Number(
            accommodationData.finalPrice ??
              accommodationData.calculatedAmount ??
                accommodationData.basePrice ??
                0,
          ),
          currency: accommodationData.currency ?? nextCourse.currency,
          basePrice: accommodationData.basePrice,
          basePriceMode: accommodationData.basePriceMode,
          pricingLabel: accommodationData.pricingLabel,
          minimumStayDays: accommodationData.minimumStayDays,
          windowStartDate: accommodationData.windowStartDate,
          windowEndDate: accommodationData.windowEndDate,
        };
        }

        if (!active) return;
        setCoursePreview(nextCourse);
        setAccommodationPreview(nextAccommodation);
        setAccommodationRuleError(null);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Erro ao calcular valores';
        setPricingError(message);
        setAccommodationRuleError(message);
        setAccommodationPreview(null);
      } finally {
        if (active) setPricingLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [
    accommodationEndDate,
    accommodationStartDate,
    apiUrl,
    courseEndDate,
    courseStartDate,
    selectedAccommodationId,
    selectedCourseId,
    selectedOffer?.academicPeriodId,
    selectedOffer?.academicPeriodName,
  ]);

  useEffect(() => {
    if (!selectedAccommodationId) {
      setAccommodationRuleError(null);
      return;
    }

    const messages: string[] = [];
    if (pricingError && accommodationPreview === null && accommodationRules.length > 0) {
      messages.push('A janela da acomodação foi carregada da regra selecionada. Ajuste o período para continuar.');
    }
    if (accommodationRulesError) {
      messages.push(accommodationRulesError);
    }

    if (!selectedAccommodationDatesAreAligned) {
      messages.push('As datas de acomodação foram alteradas em relação ao curso.');
    }

    if (isAccommodationDateOutOfWindow) {
      messages.push('As datas escolhidas estão fora da janela da acomodação selecionada.');
    }

    if (isAccommodationDateShorterThanMinimum) {
      messages.push(`A permanência mínima é de ${effectiveAccommodationMinimumStayDays} dias.`);
    }

    if (messages.length === 0) {
      setAccommodationRuleError(null);
      return;
    }

    setAccommodationRuleError(messages.join(' '));
  }, [
    accommodationPreview,
    accommodationRulesError,
    effectiveAccommodationMinimumStayDays,
    accommodationStartDate,
    accommodationEndDate,
    pricingError,
    isAccommodationDateOutOfWindow,
    isAccommodationDateShorterThanMinimum,
    selectedAccommodationDatesAreAligned,
    selectedAccommodationId,
  ]);

  const previewCurrency = coursePreview?.currency ?? accommodationPreview?.currency ?? 'CAD';
  const courseAmount = coursePreview?.amount ?? 0;
  const accommodationAmount = accommodationPreview?.amount ?? 0;
  const totalAmount = courseAmount + accommodationAmount;
  const downPayment = totalAmount * 0.3;
  const remaining = totalAmount - downPayment;
  const packageItemsLabel = isPackageMode
    ? ' (contexto de pacote)'
      : createPackage
        ? ' (vínculo único)'
        : ' (itens separados)';
  const accommodationPriceSummary = accommodationPreview
    ? `${formatMoney(
        accommodationPreview.basePrice ?? accommodationPreview.amount,
        accommodationPreview.currency,
      )} ${accommodationPreview.basePriceMode === 'per_day' || accommodationPreview.pricingLabel === 'per day' ? '/dia' : '/semana'}`
    : selectedAccommodationRule
      ? `${formatMoney(
          selectedAccommodationRule.pricePerDay ??
            selectedAccommodationRule.basePrice ??
            0,
          selectedAccommodationRule.currency || coursePreview?.currency || 'CAD',
        )} ${selectedAccommodationRule.pricePerDay ? '/dia' : '/semana'}`
      : '';
  const selectedAccommodationRuleWindowLabel = [
    selectedAccommodationRule?.periodOption || 'padrão',
    selectedAccommodationRule?.minimumStayDays
      ? `${selectedAccommodationRule.minimumStayDays} dias`
      : null,
  ]
    .filter(Boolean)
    .join(' • ');
  const accommodationDateFieldStartLimit =
    activeAccommodationWindowStart || toDateOnly(selectedOffer?.startDate ?? '');
  const accommodationDateFieldEndLimit =
    activeAccommodationWindowEnd || toDateOnly(selectedOffer?.endDate ?? '');
  const applyAccommodationWindow = (rule: AccommodationRulePreview) => {
    if (rule.windowStartDate) setAccommodationStartDate(toDateOnly(rule.windowStartDate));
    if (rule.windowEndDate) setAccommodationEndDate(toDateOnly(rule.windowEndDate));
  };

  return (
    <form action={createEnrollmentFromAdminAction} className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Aluno
          <select
            name="studentId"
            required
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            defaultValue={students[0]?.id ?? ''}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName} • {student.email}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Curso
          <select
            name="courseId"
            required
            value={selectedCourseId}
            onChange={(event) => {
              setSelectedCourseId(event.target.value);
              setSelectedOfferId('');
            }}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.program_name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Oferta (Turma + Período)
          <select
            required
            value={selectedOfferId}
            onChange={(event) => {
              const nextOffer = offers.find((item) => item.id === event.target.value);
              if (!nextOffer) return;
              setSelectedOfferId(nextOffer.id);
              setCourseStartDate(toDateOnly(nextOffer.startDate));
              setCourseEndDate(toDateOnly(nextOffer.endDate));
              setAccommodationStartDate(toDateOnly(nextOffer.startDate));
              setAccommodationEndDate(toDateOnly(nextOffer.endDate));
            }}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          >
            {offers.length === 0 && <option value="">Sem ofertas com pricing ativo</option>}
            {offers.map((offer) => (
              <option key={offer.id} value={offer.id}>
                {offer.classGroupName} ({offer.classGroupCode}) • {offer.academicPeriodName}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Resumo da oferta</p>
          {selectedOffer ? (
            <>
              <p className="mt-1">Turma: {selectedOffer.classGroupName} ({selectedOffer.classGroupCode})</p>
              <p>Período: {selectedOffer.academicPeriodName}</p>
              <p>Janela: {toDateOnly(selectedOffer.startDate)} até {toDateOnly(selectedOffer.endDate)}</p>
              {isFixedPeriod ? <p>Período fixo: datas não editáveis.</p> : null}
            </>
          ) : (
            <p className="mt-1">Selecione um curso com oferta ativa.</p>
          )}
        </div>
      </div>

      <input type="hidden" name="classGroupId" value={selectedOffer?.classGroupId ?? ''} />
      <input type="hidden" name="academicPeriodId" value={selectedOffer?.academicPeriodId ?? ''} />
      <input type="hidden" name="academicPeriodName" value={selectedOffer?.academicPeriodName ?? ''} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Data início (curso)
          <input
            name="courseStartDate"
            type="date"
            required
            value={courseStartDate}
            readOnly={isFixedPeriod}
            title={isFixedPeriod ? 'Curso com período fixo: data não editável.' : undefined}
            onChange={(event) => setCourseStartDate(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Data fim (curso)
          <input
            name="courseEndDate"
            type="date"
            required
            value={courseEndDate}
            readOnly={isFixedPeriod}
            title={isFixedPeriod ? 'Curso com período fixo: data não editável.' : undefined}
            onChange={(event) => setCourseEndDate(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-slate-700 md:col-span-3">
          Acomodação (opcional)
          <div className="mt-1 flex items-start gap-2">
            <select
              name="accommodationId"
              value={selectedAccommodationId}
              onChange={(event) => {
                const nextAccommodationId = event.target.value;
                setSelectedAccommodationId(nextAccommodationId);
                if (nextAccommodationId) {
                  if (selectedOffer?.startDate) {
                    setAccommodationStartDate(toDateOnly(selectedOffer.startDate));
                  }
                  if (selectedOffer?.endDate) {
                    setAccommodationEndDate(toDateOnly(selectedOffer.endDate));
                  }
                } else {
                  setAccommodationStartDate('');
                  setAccommodationEndDate('');
                }
              }}
              className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm"
            >
              <option value="">Sem acomodação</option>
              {accommodations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.accommodationType})
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowAccommodationRulesModal(true)}
              disabled={!selectedAccommodationId}
            >
              Ver regras
            </Button>
          </div>
        </label>
        {selectedAccommodation ? (
          <div className="md:col-span-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-700">Janela e regra da acomodação</p>
            <p>
              Janela:
              {formatDate(activeAccommodationWindowStart) || 'não definida'} até{' '}
              {formatDate(activeAccommodationWindowEnd) || 'não definida'}
            </p>
            <p>Permanência mínima: {effectiveAccommodationMinimumStayDays || 0} dias</p>
            {selectedAccommodationRule ? <p>Regra: {selectedAccommodationRuleWindowLabel}</p> : null}
            <p>
              Cobrança:{' '}
              {accommodationPriceSummary ||
                'Aguardando datas para calcular a regra da acomodação selecionada.'}
            </p>
            {isAccommodationRulesLoading ? (
              <p className="mt-2 text-xs text-slate-500">Carregando regras da acomodação...</p>
            ) : null}
            {accommodationRulesError ? (
              <p className="mt-2 text-xs text-amber-700">{accommodationRulesError}</p>
            ) : null}
          </div>
        ) : null}
        {showAccommodationRulesModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
            <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Regras da acomodação</h3>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowAccommodationRulesModal(false)}>
                  Fechar
                </Button>
              </div>
              {accommodationRules.length === 0 ? (
                <p className="text-sm text-rose-600">
                  {accommodationRulesError ??
                    'Sem regras ativas para esta acomodação. Use os limites de curso para cadastro temporário.'}
                </p>
              ) : (
                <div className="grid gap-4">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold text-slate-700">
                      Ajuste rápido do período (clicável)
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className="text-xs text-slate-700">
                        Início
                        <input
                          type="date"
                          min={accommodationDateFieldStartLimit || undefined}
                          max={accommodationDateFieldEndLimit || undefined}
                          value={accommodationStartDate}
                          onChange={(event) => setAccommodationStartDate(event.target.value)}
                          className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-xs"
                        />
                      </label>
                      <label className="text-xs text-slate-700">
                        Fim
                        <input
                          type="date"
                          min={accommodationDateFieldStartLimit || undefined}
                          max={accommodationDateFieldEndLimit || undefined}
                          value={accommodationEndDate}
                          onChange={(event) => setAccommodationEndDate(event.target.value)}
                          className="mt-1 h-9 w-full rounded-md border border-slate-300 px-2 text-xs"
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500">
                      Janela ativa:{' '}
                      <span className="font-medium">
                        {formatDate(accommodationDateFieldStartLimit)} até {formatDate(accommodationDateFieldEndLimit)}
                      </span>
                    </p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {accommodationRules.map((rule) => {
                      const ruleStart = rule.windowStartDate ? toDateOnly(rule.windowStartDate) : '';
                      const ruleEnd = rule.windowEndDate ? toDateOnly(rule.windowEndDate) : '';
                      const isCurrentRule = selectedAccommodationRule?.id === rule.id;
                      return (
                        <article
                          key={rule.id}
                          className={`rounded-lg border p-3 text-xs ${
                            isCurrentRule ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50'
                          }`}
                        >
                          <p className="font-semibold text-slate-700">{rule.periodOption}</p>
                          <p>
                            Janela:{' '}
                            {ruleStart ? `${formatDate(ruleStart)} até ${formatDate(ruleEnd)}` : 'Sem janela definida'}
                          </p>
                          <p>
                            Cobrança:{' '}
                            {formatMoney(rule.pricePerDay ?? rule.basePrice ?? 0, rule.currency || 'CAD')}
                            {rule.pricePerDay ? '/dia' : '/semana'}
                          </p>
                          <p>Mínimo: {rule.minimumStayDays || 1} dias</p>
                          <p>Tipo: {rule.pricePerDay ? 'diária' : 'semanal'}</p>
                          <Button
                            type="button"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              applyAccommodationWindow(rule);
                              setShowAccommodationRulesModal(false);
                            }}
                          >
                            Usar janela deste período
                          </Button>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <label className="text-sm font-medium text-slate-700 md:col-span-3">
          {isPackageMode ? (
            <input type="hidden" name="isPackage" value="on" />
          ) : (
            <>
              <input
                type="checkbox"
                name="isPackage"
                checked={createPackage}
                onChange={(event) => setCreatePackage(event.target.checked)}
                disabled={!selectedAccommodationId}
                className="mr-2"
                value="on"
              />
              Juntar curso + acomodação no mesmo vínculo de venda
            </>
          )}
        </label>

        <label className="text-sm font-medium text-slate-700">
          Data início (acomodação)
          <input
            name="accommodationStartDate"
            type="date"
            min={accommodationDateFieldStartLimit || undefined}
            max={accommodationDateFieldEndLimit || undefined}
            value={accommodationStartDate}
            onChange={(event) => setAccommodationStartDate(event.target.value)}
            disabled={!selectedAccommodationId}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Data fim (acomodação)
          <input
            name="accommodationEndDate"
            type="date"
            min={accommodationDateFieldStartLimit || undefined}
            max={accommodationDateFieldEndLimit || undefined}
            value={accommodationEndDate}
            onChange={(event) => setAccommodationEndDate(event.target.value)}
            disabled={!selectedAccommodationId}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
          />
        </label>
        {accommodationRuleError ? (
          <p className="text-xs text-amber-700 md:col-span-3">{accommodationRuleError}</p>
        ) : null}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          {isPackageMode
            ? selectedAccommodationId
              ? 'Acomodação agregada no pacote: o curso e a acomodação têm rastreamento financeiro independente.'
              : 'Sem acomodação selecionada: pacote criado apenas com curso.'
            : selectedAccommodationId
              ? createPackage
                ? 'Acomodação usa janela própria e será emitida junto do curso no mesmo vínculo comercial.'
                : 'Acomodação é item comercial separado: curso e acomodação seguem com orçamentos independentes.'
              : 'Acomodação não selecionada.'}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-800">
          Itens de venda
          {selectedAccommodationId ? packageItemsLabel : ''}
        </p>
        {pricingLoading ? (
          <p className="mt-2 text-slate-600">Calculando valores...</p>
        ) : pricingError ? (
          <p className="mt-2 text-rose-600">{pricingError}</p>
        ) : (
          <div className="mt-2 grid gap-1">
            <p className="font-medium">
              Total consolidado: {formatMoney(totalAmount, previewCurrency)}
            </p>
            <p className="font-semibold">Item curso: {formatMoney(courseAmount, previewCurrency)}</p>
            <p className={accommodationAmount > 0 ? 'font-semibold' : 'text-slate-500'}>
              Item acomodação: {formatMoney(accommodationAmount, previewCurrency)}
            </p>
            <p className="text-xs text-slate-500">
              {isPackageMode
                ? selectedAccommodationId
                  ? 'Curso + acomodação no contexto de pacote.'
                  : 'Somente curso no pacote.'
                : coursePreview && accommodationPreview
                  ? createPackage
                    ? 'Curso e acomodação no mesmo vínculo de pacote.'
                    : 'Curso e acomodação como itens independentes.'
                  : coursePreview
                    ? 'Somente item curso incluído.'
                    : accommodationPreview
                      ? 'Somente item acomodação incluído.'
                    : 'Nenhum item selecionado.'}
            </p>
            <p>Entrada (30%): {formatMoney(downPayment, previewCurrency)}</p>
            <p>Saldo: {formatMoney(remaining, previewCurrency)}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" name="submitMode" value="draft">
          {isPackageMode ? 'Criar pacote (matrícula)' : 'Criar matrícula (rascunho)'}
        </Button>
        {showProposalActions ? (
          <Button type="submit" size="sm" variant="outline" name="submitMode" value="send">
            {isPackageMode ? 'Criar pacote e enviar proposta' : 'Criar e enviar proposta'}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
