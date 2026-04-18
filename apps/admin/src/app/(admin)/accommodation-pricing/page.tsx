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
      render: (item) => money(item.basePrice, item.currency),
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
        description="Configura preço de acomodação por opção de período (ex.: Fall 2026)."
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
