'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import type {
  AccommodationAdmin,
  AccommodationPricingAdmin,
  EnrollmentAdmin,
  StudentAdmin,
} from '@/types/catalog.types';
import { toDateInputFromDate, toDateInputValue } from '@/lib/date';
import { createStandaloneAccommodationOrderAction } from './actions';

interface PricingPreview {
  amount: number;
  currency: string;
}

interface Props {
  students: StudentAdmin[];
  accommodations: AccommodationAdmin[];
  pricingRows: AccommodationPricingAdmin[];
  enrollments: EnrollmentAdmin[];
}

function formatMoney(value: number, currency: string) {
  return `${value.toFixed(2)} ${currency}`;
}

function toIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export function NewAccommodationOrderForm({
  students,
  accommodations,
  pricingRows,
  enrollments,
}: Readonly<Props>) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(students[0]?.id ?? '');
  const [selectedAccommodationId, setSelectedAccommodationId] = useState(accommodations[0]?.id ?? '');
  const [selectedPricingId, setSelectedPricingId] = useState<string>('');
  const [startDate, setStartDate] = useState(toDateInputFromDate());
  const [endDate, setEndDate] = useState(toDateInputFromDate(new Date(Date.now() + 28 * 24 * 60 * 60 * 1000)));
  const [preview, setPreview] = useState<PricingPreview | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [autoDateSyncDateRange, setAutoDateSyncDateRange] = useState<{ start: string; end: string } | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  const accommodationPricing = useMemo(
    () =>
      pricingRows
        .filter((item) => item.accommodationId === selectedAccommodationId && item.isActive)
        .sort((a, b) => a.periodOption.localeCompare(b.periodOption)),
    [pricingRows, selectedAccommodationId],
  );

  const selectedPricing = useMemo(
    () => accommodationPricing.find((item) => item.id === selectedPricingId) ?? accommodationPricing[0] ?? null,
    [accommodationPricing, selectedPricingId],
  );

  const activeEnrollmentForUser = useMemo(() => {
    const activeStatuses = new Set([
      'draft',
      'started',
      'awaiting_school_approval',
      'approved',
      'checkout_available',
      'payment_pending',
      'partially_paid',
      'paid',
      'confirmed',
      'enrolled',
    ]);
    return enrollments.find(
      (item) => item.student.id === selectedUserId && activeStatuses.has(item.status),
    );
  }, [enrollments, selectedUserId]);

  const academicStartDateFromActiveEnrollment = toDateInputValue(activeEnrollmentForUser?.academicPeriod?.startDate ?? '');
  const academicEndDateFromActiveEnrollment = toDateInputValue(activeEnrollmentForUser?.academicPeriod?.endDate ?? '');

  const isDateDifferentFromEnrollment =
    Boolean(autoDateSyncDateRange) &&
    (startDate !== autoDateSyncDateRange.start || endDate !== autoDateSyncDateRange.end);

  useEffect(() => {
    if (!accommodationPricing.length) {
      setSelectedPricingId('');
      return;
    }
    if (!selectedPricingId || !accommodationPricing.some((item) => item.id === selectedPricingId)) {
      setSelectedPricingId(accommodationPricing[0].id);
    }
  }, [accommodationPricing, selectedPricingId]);

  useEffect(() => {
    if (academicStartDateFromActiveEnrollment && academicEndDateFromActiveEnrollment) {
      setStartDate(academicStartDateFromActiveEnrollment);
      setEndDate(academicEndDateFromActiveEnrollment);
      setAutoDateSyncDateRange({
        start: academicStartDateFromActiveEnrollment,
        end: academicEndDateFromActiveEnrollment,
      });
      return;
    }

    setAutoDateSyncDateRange(null);
  }, [academicStartDateFromActiveEnrollment, academicEndDateFromActiveEnrollment]);

  useEffect(() => {
    if (!selectedAccommodationId || !selectedPricing?.periodOption || !startDate || !endDate) {
      setPreview(null);
      setPricingError(null);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const run = async () => {
      try {
        setPricingLoading(true);
        setPricingError(null);

        const params = new URLSearchParams({
          accommodationId: selectedAccommodationId,
          periodOption: selectedPricing.periodOption,
          startDate: toIsoDate(startDate),
          endDate: toIsoDate(endDate),
        });

        const res = await fetch(`${apiUrl}/accommodation-pricing/resolve?${params.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body?.message ?? 'Não foi possível calcular o valor da acomodação.');
        }

        const data = (body?.data ?? body) as { finalPrice?: number; basePrice?: number; currency?: string };
        if (!active) return;
        setPreview({
          amount: Number(data.finalPrice ?? data.basePrice ?? 0),
          currency: data.currency ?? 'CAD',
        });
      } catch (error) {
        if (!active) return;
        setPreview(null);
        setPricingError(error instanceof Error ? error.message : 'Erro ao calcular valor');
      } finally {
        if (active) setPricingLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [apiUrl, endDate, selectedAccommodationId, selectedPricing?.periodOption, startDate]);

  const total = preview?.amount ?? 0;
  const currency = preview?.currency ?? selectedPricing?.currency ?? 'CAD';
  const downPayment = total * 0.3;
  const remaining = total - downPayment;

  return (
    <form
      action={createStandaloneAccommodationOrderAction}
      className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
        <p className="text-sm font-semibold text-slate-900">Nova reserva de acomodação</p>
        <p className="text-xs text-slate-500">
          Cria venda standalone de acomodação para o aluno, com vínculo opcional à matrícula ativa.
        </p>
        </div>
        <Button type="button" size="sm" variant={isOpen ? 'outline' : 'primary'} onClick={() => setIsOpen((value) => !value)}>
          {isOpen ? 'Ocultar seleção' : 'Selecionar acomodação'}
        </Button>
      </div>

      {!isOpen ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Clique em <strong>Selecionar acomodação</strong> para abrir o formulário de criação.
        </div>
      ) : null}

      {isOpen ? (
        <>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Aluno
          <select
            name="userId"
            required
            value={selectedUserId}
            onChange={(event) => setSelectedUserId(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName} • {student.email}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-slate-700">
          Acomodação
          <select
            name="accommodationId"
            required
            value={selectedAccommodationId}
            onChange={(event) => setSelectedAccommodationId(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          >
            {accommodations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} ({item.accommodationType})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Opção de pricing
          <select
            required
            value={selectedPricingId}
            onChange={(event) => setSelectedPricingId(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            disabled={!accommodationPricing.length}
          >
            {!accommodationPricing.length && <option value="">Sem pricing ativo para esta acomodação</option>}
            {accommodationPricing.map((item) => (
              <option key={item.id} value={item.id}>
                {item.periodOption} • base {formatMoney(Number(item.basePrice), item.currency)}
              </option>
            ))}
          </select>
          <input type="hidden" name="periodOption" value={selectedPricing?.periodOption ?? ''} />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Matrícula ativa (opcional)
          <select
            key={selectedUserId}
            name="enrollmentId"
            defaultValue={activeEnrollmentForUser?.id ?? ''}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          >
            <option value="">Sem vínculo acadêmico</option>
            {activeEnrollmentForUser ? (
              <option value={activeEnrollmentForUser.id}>
                {activeEnrollmentForUser.course.program_name} • {activeEnrollmentForUser.status}
              </option>
            ) : null}
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Data início
          <input
            name="startDate"
            type="date"
            required
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Data fim
          <input
            name="endDate"
            type="date"
            required
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
          />
        </label>
      </div>
      {isDateDifferentFromEnrollment ? (
        <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          As datas foram alteradas em relação à matrícula ativa.
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <p className="font-semibold text-slate-800">Prévia da reserva</p>
        {pricingLoading ? <p className="mt-1 text-slate-600">Calculando valores...</p> : null}
        {pricingError ? <p className="mt-1 text-rose-600">{pricingError}</p> : null}
        {!pricingLoading && !pricingError ? (
          <div className="mt-1 grid gap-1">
            <p>Total: {formatMoney(total, currency)}</p>
            <p>Entrada (30%): {formatMoney(downPayment, currency)}</p>
            <p>Saldo: {formatMoney(remaining, currency)}</p>
          </div>
        ) : null}
      </div>

      <div>
        <Button type="submit" size="sm" disabled={!selectedPricing || !!pricingError}>
          Criar reserva de acomodação
        </Button>
      </div>
        </>
      ) : null}
    </form>
  );
}
