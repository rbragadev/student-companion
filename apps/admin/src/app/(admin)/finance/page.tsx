import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { FinancialOverviewAdmin } from '@/types/catalog.types';

function money(amount: number, currency: string) {
  return `${Number(amount ?? 0).toFixed(2)} ${currency}`;
}

const metricCards: Array<{ key: keyof FinancialOverviewAdmin['totals']; label: string }> = [
  { key: 'totalSold', label: 'Total vendido' },
  { key: 'totalInvoiced', label: 'Total faturado' },
  { key: 'totalReceived', label: 'Total recebido' },
  { key: 'totalPending', label: 'Total pendente' },
  { key: 'totalCommission', label: 'Comissão total' },
];

export default async function FinanceOverviewPage() {
  await requirePermission('users.read');

  const overview = await apiFetch<FinancialOverviewAdmin>('/financial-overview').catch(() => ({
    totals: {
      totalSold: 0,
      totalInvoiced: 0,
      totalReceived: 0,
      totalPending: 0,
      totalCommission: 0,
      overdueInvoices: 0,
    },
    revenueByMonth: [],
    currency: 'CAD',
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Financeiro"
        description="Overview comercial e financeiro com base em vendas, invoices, pagamentos e comissões."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((card) => (
          <article key={card.key} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {money(overview.totals[card.key], overview.currency)}
            </p>
          </article>
        ))}
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Invoices vencidas</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{overview.totals.overdueInvoices}</p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Receita recebida por período (mensal)</h2>
        <p className="mt-1 text-xs text-slate-500">Valores consolidados por mês com base em pagamentos pagos.</p>

        {overview.revenueByMonth.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Sem pagamentos confirmados no período.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {overview.revenueByMonth.map((row) => {
              const max = Math.max(...overview.revenueByMonth.map((item) => item.received), 1);
              const width = Math.max(6, (row.received / max) * 100);
              return (
                <div key={row.month}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{row.month}</span>
                    <span className="text-slate-600">{money(row.received, overview.currency)}</span>
                  </div>
                  <div className="h-2 rounded bg-slate-100">
                    <div className="h-2 rounded bg-blue-600" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
