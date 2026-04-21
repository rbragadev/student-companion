import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { AccommodationAdmin, AccommodationPricingAdmin } from '@/types/catalog.types';
import {
  createAccommodationPricingAction,
  updateAccommodationPricingAction,
} from './actions';

function money(value: number, currency: string) {
  return `${Number(value).toFixed(2)} ${currency}`;
}

function toDate(value?: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 10);
}

function toDateInputValue(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

export default async function AccommodationPricingPage() {
  await requirePermission('structure.read');

  const [rows, accommodations] = await Promise.all([
    apiFetch<AccommodationPricingAdmin[]>('/accommodation-pricing').catch(() => []),
    apiFetch<AccommodationAdmin[]>('/accommodation').catch(() => []),
  ]);

  const columns: Column<AccommodationPricingAdmin>[] = [
    {
      key: 'accommodation',
      label: 'Acomodação',
      render: (item) =>
        item.accommodation
          ? `${item.accommodation.title} (${item.accommodation.accommodationType})`
          : '-',
    },
    {
      key: 'periodOption',
      label: 'Período',
      render: (item) => item.periodOption,
    },
    {
      key: 'price',
      label: 'Preço',
      render: (item) => `${money(item.basePrice, item.currency)} (base/semana)`,
    },
    {
      key: 'pricePerDay',
      label: 'Preço por dia',
      render: (item) => (item.pricePerDay && item.pricePerDay > 0 ? money(item.pricePerDay, item.currency) : '—'),
    },
    {
      key: 'mode',
      label: 'Modo',
      render: (item) =>
        item.pricePerDay && item.pricePerDay > 0
          ? `Por dia • mínimo ${item.minimumStayDays ?? 1} dias`
          : 'Semanal',
    },
    {
      key: 'window',
      label: 'Janela',
      render: (item) => {
        const start = toDate(item.windowStartDate);
        const end = toDate(item.windowEndDate);
        return `${start} → ${end}`;
      },
    },
    {
      key: 'minimumStayDays',
      label: 'Mín. dias',
      render: (item) => String(item.minimumStayDays ?? 1),
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (item.isActive ? 'Ativo' : 'Inativo'),
    },
    {
      key: 'actions',
      label: 'Atualizar',
      render: (item) => (
        <form action={updateAccommodationPricingAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={item.id} />
          <input
            name="periodOption"
            defaultValue={item.periodOption}
            className="h-8 w-28 rounded border border-slate-300 px-2 text-xs"
          />
          <input
            name="basePrice"
            type="number"
            step="0.01"
            min={0}
            defaultValue={item.basePrice}
            className="h-8 w-24 rounded border border-slate-300 px-2 text-xs"
          />
          <input
            name="pricePerDay"
            type="number"
            step="0.01"
            min={0}
            defaultValue={item.pricePerDay ?? ''}
            placeholder="Opcional"
            className="h-8 w-24 rounded border border-slate-300 px-2 text-xs"
          />
          <input
            name="minimumStayDays"
            type="number"
            min={1}
            defaultValue={item.minimumStayDays ?? 1}
            className="h-8 w-20 rounded border border-slate-300 px-2 text-xs"
          />
            <input
              name="windowStartDate"
              type="date"
              defaultValue={toDateInputValue(item.windowStartDate)}
              className="h-8 w-32 rounded border border-slate-300 px-2 text-xs"
            />
            <input
              name="windowEndDate"
              type="date"
              defaultValue={toDateInputValue(item.windowEndDate)}
              className="h-8 w-32 rounded border border-slate-300 px-2 text-xs"
            />
          <input
            name="currency"
            defaultValue={item.currency}
            className="h-8 w-16 rounded border border-slate-300 px-2 text-xs"
          />
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input name="isActive" type="checkbox" defaultChecked={item.isActive} />
            ativo
          </label>
          <button type="submit" className="rounded bg-slate-900 px-2 py-1 text-xs text-white">
            Salvar
          </button>
        </form>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Preço de Acomodação por Período"
        description="Preencha preço base por semana e, opcionalmente, preço por dia (com mínimo + janela) para cálculo diário."
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Novo preço</h2>
        <form action={createAccommodationPricingAction} className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs text-slate-600">
            Acomodação
            <select name="accommodationId" className="mt-1 h-9 w-full rounded border border-slate-300 px-3 text-sm">
              {accommodations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-600">
            Período (texto)
            <input name="periodOption" placeholder="Fall 2026" className="mt-1 h-9 w-full rounded border border-slate-300 px-3 text-sm" />
          </label>
          <label className="text-xs text-slate-600">
            Preço base
            <input name="basePrice" type="number" step="0.01" min={0} className="mt-1 h-9 w-full rounded border border-slate-300 px-3 text-sm" />
          </label>
          <label className="text-xs text-slate-600">
            Preço por dia
            <input name="pricePerDay" type="number" step="0.01" min={0} className="mt-1 h-9 w-full rounded border border-slate-300 px-3 text-sm" />
          </label>
          <label className="text-xs text-slate-600">
            Mín. permanência (dias)
            <input name="minimumStayDays" type="number" min={1} defaultValue={1} className="mt-1 h-9 w-full rounded border border-slate-300 px-3 text-sm" />
          </label>
          <label className="text-xs text-slate-600">
            Janela início (opcional)
            <input name="windowStartDate" type="date" className="mt-1 h-9 w-full rounded border border-slate-300 px-3 text-sm" />
          </label>
          <label className="text-xs text-slate-600">
            Janela fim (opcional)
            <input name="windowEndDate" type="date" className="mt-1 h-9 w-full rounded border border-slate-300 px-3 text-sm" />
          </label>
          <label className="text-xs text-slate-500 md:col-span-2">
            Regra da janela
            <p className="mt-1 text-[11px]">
              Se preencher valor por dia, o sistema soma por diária e valida permanência mínima + janela. Se não preencher,
              o cálculo será por semana (domingo a domingo).
            </p>
          </label>
          <label className="text-xs text-slate-600">
            Moeda
            <input name="currency" defaultValue="CAD" className="mt-1 h-9 w-full rounded border border-slate-300 px-3 text-sm" />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-600 md:col-span-2">
            <input name="isActive" type="checkbox" defaultChecked />
            Preço ativo
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-sm text-white">
              Criar preço
            </button>
          </div>
        </form>
      </section>

      <DataTable<AccommodationPricingAdmin>
        columns={columns}
        data={rows}
        keyExtractor={(item) => item.id}
        emptyTitle="Nenhum preço de acomodação cadastrado"
        emptyDescription="Cadastre preços para habilitar quote com acomodação."
      />
    </div>
  );
}
