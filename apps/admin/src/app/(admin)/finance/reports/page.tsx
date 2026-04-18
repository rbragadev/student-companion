import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { FinancialReportsAdmin } from '@/types/catalog.types';

function money(amount: number, currency: string) {
  return `${Number(amount ?? 0).toFixed(2)} ${currency}`;
}

export default async function FinanceReportsPage() {
  await requirePermission('users.read');

  const report = await apiFetch<FinancialReportsAdmin>('/reports').catch(() => ({
    revenue: {
      totalSold: 0,
      totalReceived: 0,
      totalPending: 0,
    },
    revenueByInstitution: [],
    revenueByCourse: [],
    revenueByAccommodation: [],
    invoices: {
      pending: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
      draft: 0,
    },
    commissions: {
      total: 0,
      byInstitution: [],
      byCourse: [],
    },
    currency: 'CAD',
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Relatórios"
        description="Visão consolidada de receita, invoices e comissões para operação diária."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total vendido</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{money(report.revenue.totalSold, report.currency)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total recebido</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{money(report.revenue.totalReceived, report.currency)}</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total pendente</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{money(report.revenue.totalPending, report.currency)}</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">Receita por instituição</h2>
          <div className="mt-3 space-y-2">
            {report.revenueByInstitution.map((row) => (
              <div key={row.institutionId} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{row.institution}</span>
                <span className="font-medium text-slate-900">{money(row.total, report.currency)}</span>
              </div>
            ))}
            {report.revenueByInstitution.length === 0 && (
              <p className="text-sm text-slate-500">Sem dados.</p>
            )}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">Receita por curso</h2>
          <div className="mt-3 space-y-2">
            {report.revenueByCourse.map((row) => (
              <div key={row.courseId} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{row.course}</span>
                <span className="font-medium text-slate-900">{money(row.total, report.currency)}</span>
              </div>
            ))}
            {report.revenueByCourse.length === 0 && (
              <p className="text-sm text-slate-500">Sem dados.</p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">Invoices</h2>
          <div className="mt-3 space-y-1 text-sm text-slate-700">
            <p>Draft: {report.invoices.draft}</p>
            <p>Pending: {report.invoices.pending}</p>
            <p>Paid: {report.invoices.paid}</p>
            <p>Overdue: {report.invoices.overdue}</p>
            <p>Cancelled: {report.invoices.cancelled}</p>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">Comissões</h2>
          <p className="mt-2 text-sm text-slate-700">Total: {money(report.commissions.total, report.currency)}</p>
          <div className="mt-3 space-y-2">
            {report.commissions.byInstitution.map((row) => (
              <div key={row.institutionId} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{row.institution}</span>
                <span className="font-medium text-slate-900">{money(row.total, report.currency)}</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
