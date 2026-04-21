import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { DataTable, type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { formatDatePtBr } from '@/lib/date';
import type {
  AccommodationAdmin,
  AccommodationPricingAdmin,
  EnrollmentAdmin,
  SalesRowAdmin,
  StudentAdmin,
} from '@/types/catalog.types';
import { createStandaloneAccommodationFinanceItemAction } from '../enrollments/actions';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const ALLOWED_ENROLLMENT_STATUSES = new Set([
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

function money(amount: number, currency: string) {
  return `${Number(amount ?? 0).toFixed(2)} ${currency}`;
}

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toDate(value?: string | null) {
  if (!value) return '-';
  return formatDatePtBr(value);
}

function itemLabel(row: SalesRowAdmin) {
  if (row.itemType === 'accommodation') {
    return row.accommodation?.title ?? 'Acomodação';
  }

  return row.course?.program_name ?? 'Item financeiro';
}

export default async function AccommodationOperationsPage({ searchParams }: Readonly<PageProps>) {
  await requirePermission('users.read');

  const params = (await searchParams) ?? {};
  const institutionId = pickParam(params.institutionId) ?? '';
  const schoolId = pickParam(params.schoolId) ?? '';
  const status = pickParam(params.status) ?? '';
  const enrollmentId = pickParam(params.enrollmentId) ?? '';
  const studentId = pickParam(params.studentId) ?? '';

  const query = new URLSearchParams();
  if (institutionId) query.set('institutionId', institutionId);
  if (schoolId) query.set('schoolId', schoolId);
  if (status) query.set('status', status);
  if (enrollmentId) query.set('enrollmentId', enrollmentId);

  const [salesRows, enrollments, accommodationPricings, accommodations, students] = await Promise.all([
    apiFetch<SalesRowAdmin[]>(`/sales${query.toString() ? `?${query.toString()}` : ''}`).catch(() => []),
    apiFetch<EnrollmentAdmin[]>('/enrollments').catch(() => []),
    apiFetch<AccommodationPricingAdmin[]>('/accommodation-pricing').catch(() => []),
    apiFetch<AccommodationAdmin[]>('/accommodation').catch(() => []),
    apiFetch<StudentAdmin[]>('/users/student').catch(() => []),
  ]);

  const accommodationSales = salesRows.filter((row) => row.itemType === 'accommodation');
  const activeEnrollments = enrollments.filter((enrollment) => ALLOWED_ENROLLMENT_STATUSES.has(enrollment.status));
  const activeAccommodationPricings = accommodationPricings.filter((item) => item.isActive);

  const selectedEnrollment = enrollmentId
    ? enrollments.find((item) => item.id === enrollmentId) ?? null
    : null;
  const selectedStudent = studentId ? students.find((item) => item.id === studentId) ?? null : null;

  const prefillStartDate = selectedEnrollment?.academicPeriod?.startDate
    ? selectedEnrollment.academicPeriod.startDate.slice(0, 10)
    : '';
  const prefillEndDate = selectedEnrollment?.academicPeriod?.endDate
    ? selectedEnrollment.academicPeriod.endDate.slice(0, 10)
    : '';

  const filteredSalesByEnrollment = enrollmentId
    ? accommodationSales.filter((item) => item.enrollmentId === enrollmentId)
    : accommodationSales;

  const filteredSales = studentId
    ? filteredSalesByEnrollment.filter((item) => item.student?.id === studentId)
    : filteredSalesByEnrollment;

  const columns: Column<SalesRowAdmin>[] = [
    {
      key: 'itemTitle',
      label: 'Item',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-900">{itemLabel(row)}</p>
          <p className="text-xs text-slate-500">Tipo: {row.itemType ?? 'item'}</p>
          <p className="text-xs text-slate-500">Origem: {row.quote?.type ?? row.commercialStatus}</p>
          <p className="text-xs text-slate-500">
            Contexto: {row.enrollmentId ? `Matrícula ${row.enrollmentId.slice(0, 8)}` : 'Sem matrícula'}
          </p>
        </div>
      ),
    },
    {
      key: 'student',
      label: 'Aluno',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {row.student ? `${row.student.firstName} ${row.student.lastName}` : 'Sem aluno vinculado'}
          </p>
          <p className="text-xs text-slate-500">{row.student?.email ?? '-'}</p>
          <p className="text-xs text-slate-500">{row.school?.name ?? '-'}</p>
        </div>
      ),
    },
    {
      key: 'context',
      label: 'Contexto',
      render: (row) => (
        <div>
          <p className="text-xs text-slate-600">Curso: {row.course?.program_name ?? '-'}</p>
          <p className="text-xs text-slate-500">{row.accommodation?.title ?? '-'}</p>
          <p className="text-xs text-slate-500">{money(row.accommodationAmount ?? 0, row.currency || 'CAD')} no item</p>
          <p className="text-xs text-slate-500">Status comercial: {row.commercialStatus}</p>
        </div>
      ),
    },
    {
      key: 'totals',
      label: 'Financeiro',
      render: (row) => (
        <div>
          <p className="text-sm text-slate-700">Total: {money(row.totalAmount, row.currency)}</p>
          <p className="text-xs text-slate-500">Emissão: {money(row.downPaymentAmount, row.currency)}</p>
          <p className="text-xs text-slate-500">Transações: {row.transactionsCount ?? 0}</p>
          <p className="text-xs text-slate-500">Saldo: {money(row.remainingAmount, row.currency)}</p>
          <p className="text-xs text-slate-500">Comercial: {row.financialStatus}</p>
        </div>
      ),
    },
  ];

  const groupedPricings = activeAccommodationPricings.reduce<Record<string, AccommodationPricingAdmin[]>>((acc, item) => {
    const key = item.accommodationId ?? item.accommodation?.id ?? 'sem-acomodacao';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const accommodationById = new Map(
    accommodations
      .filter((item) => item.isActive)
      .map((item) => [item.id, item]),
  );

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: 'Operação', href: '/enrollments' },
          { label: 'Acomodação' },
        ]}
      />
      <PageHeader
        title="Operação de Acomodação"
        description="Crie e gerencie itens financeiros de acomodação de forma independente, com emissão e mensagens separadas da matrícula."
        actions={
          <Link href="/finance/sales">
            <Button size="sm" variant="outline">
              <ArrowLeft size={14} />
              Voltar para Vendas / Itens
            </Button>
          </Link>
        }
      />

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Nova venda de acomodação standalone</h2>
        <p className="mt-1 text-xs text-slate-500">
          Escolha o aluno/matrícula (opcional), a acomodação e os parâmetros do período.
        </p>

        <form
          action={createStandaloneAccommodationFinanceItemAction}
          className="mt-3 grid gap-3 md:grid-cols-2"
        >
          <label className="text-xs font-medium text-slate-600">
            Aluno (opcional)
            <select
              name="studentId"
              defaultValue={selectedStudent?.id ?? ''}
              className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
            >
              <option value="">Sem aluno vinculado</option>
              {students.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.firstName} {item.lastName} • {item.email}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-slate-600">
            Matrícula (opcional)
            <select
              name="enrollmentId"
              defaultValue={selectedEnrollment?.id ?? ''}
              className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
            >
              <option value="">Sem vínculo</option>
              {activeEnrollments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.student.firstName} {item.student.lastName} • {item.course?.program_name ?? '-'} ({item.status})
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-slate-600">
            Opção de pricing
            <select
              name="accommodationPricingId"
              required
              className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
            >
              <option value="">Selecione</option>
              {activeAccommodationPricings.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.accommodation?.title ?? 'Acomodação'} • {item.periodOption} • {money(item.basePrice, item.currency)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-medium text-slate-600">
            Observação
            <input
              name="title"
              placeholder="Nome customizado (opcional)"
              className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
          </label>

          <label className="text-xs font-medium text-slate-600">
            Data início
            <input
              required
              name="startDate"
              type="date"
              defaultValue={prefillStartDate}
              className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
          </label>

          <label className="text-xs font-medium text-slate-600">
            Data fim
            <input
              required
              name="endDate"
              type="date"
              defaultValue={prefillEndDate}
              className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
          </label>

          <input type="hidden" name="returnTo" value="/accommodation-operations" />
          <div className="md:col-span-2">
            <Button type="submit" size="sm" disabled={activeAccommodationPricings.length === 0}>
              <Plus size={14} className="mr-2" />
              Gerar venda de acomodação
            </Button>
          </div>
        </form>

        {activeAccommodationPricings.length === 0 ? (
          <p className="mt-2 text-xs text-rose-600">Sem pricing ativo de acomodação no momento.</p>
        ) : null}

        {prefillStartDate && prefillEndDate ? (
          <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Matrícula selecionada encontrada com período padrão {toDate(prefillStartDate)} até {toDate(prefillEndDate)}. Edite manualmente se necessário.
          </p>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Lista de acomodações para apoio à venda</h2>
        <div className="mt-3 grid gap-2">
          {Object.values(groupedPricings).length === 0 ? (
            <p className="text-xs text-slate-500">Nenhuma acomodação ativa no momento.</p>
          ) : (
            Object.entries(groupedPricings).map(([accommodationId, pricings]) => {
              const accommodation = accommodationById.get(accommodationId);
              const rows = pricings
                .slice()
                .sort((a, b) => a.periodOption.localeCompare(b.periodOption));

              return (
                <article key={accommodationId} className="rounded border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">
                    {accommodation?.title ?? 'Acomodação'}
                  </p>
                  <p className="text-xs text-slate-500">{accommodation?.location ?? 'Sem localização'}</p>
                  <ul className="mt-2 text-xs text-slate-700">
                    {rows.map((item) => (
                      <li key={item.id}>
                        {item.periodOption}: {money(item.basePrice, item.currency)} • semana
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Vendas de acomodação</h2>
        <p className="mt-1 text-xs text-slate-500">Acompanhe as operações de itens de acomodação e abra o item para emissão e chat.</p>
        <div className="mt-4">
          <DataTable<SalesRowAdmin>
            columns={columns}
            data={filteredSales}
            keyExtractor={(row) => row.id}
            getRowHref={(row) => `/accommodation-operations/${row.id}`}
            emptyTitle="Nenhuma venda de acomodação"
            emptyDescription="Crie um novo item no formulário acima para começar."
          />
        </div>
      </section>
    </div>
  );
}
