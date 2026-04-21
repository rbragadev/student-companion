'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AccommodationAdmin, CourseAdmin, StudentAdmin } from '@/types/catalog.types';
import { toDateInputValue } from '@/lib/date';
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

function formatMoney(value: number, currency: string) {
  return `${value.toFixed(2)} ${currency}`;
}

function calculateWeeks(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0 || diffDays % 7 !== 0) return null;
  return diffDays / 7;
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
          };
        }

        if (!active) return;
        setCoursePreview(nextCourse);
        setAccommodationPreview(nextAccommodation);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : 'Erro ao calcular valores';
        setPricingError(message);
        setCoursePreview(null);
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
          <select
            name="accommodationId"
            value={selectedAccommodationId}
            onChange={(event) => setSelectedAccommodationId(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          >
            <option value="">Sem acomodação</option>
            {accommodations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.accommodationType}) • {(item.priceInCents / 100).toFixed(0)}/{item.priceUnit}
              </option>
            ))}
          </select>
        </label>

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
            value={accommodationEndDate}
            onChange={(event) => setAccommodationEndDate(event.target.value)}
            disabled={!selectedAccommodationId}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
          />
        </label>
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
