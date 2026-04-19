import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type {
  AccommodationAdmin,
  EnrollmentAdmin,
  EnrollmentQuoteAdmin,
  SchoolAccommodationRecommendationAdmin,
  SchoolAdmin,
} from '@/types/catalog.types';
import { updateSchoolAccommodationRecommendationAction } from './actions';
import { AccommodationsView } from './view';

export default async function AccommodationsPage() {
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');

  const [accommodations, schools, enrollments, standaloneQuotes] = await Promise.all([
    apiFetch<AccommodationAdmin[]>('/accommodation').catch(() => []),
    apiFetch<SchoolAdmin[]>('/school').catch(() => []),
    apiFetch<EnrollmentAdmin[]>('/enrollments').catch(() => []),
    apiFetch<EnrollmentQuoteAdmin[]>('/quotes?type=accommodation_only').catch(() => []),
  ]);

  const recommendationEntries = await Promise.all(
    schools.map(async (school) => {
      const items = await apiFetch<SchoolAccommodationRecommendationAdmin[]>(
        `/accommodation/recommendations/school/${school.id}`,
      ).catch(() => []);
      return [school.id, items] as const;
    }),
  );

  const recommendationsBySchool = new Map<string, SchoolAccommodationRecommendationAdmin[]>(
    recommendationEntries,
  );
  const recommendationScope = recommendationEntries.map(([schoolId, rows]) => ({
    schoolId,
    accommodationIds: rows.filter((item) => item.isRecommendedBySchool).map((item) => item.id),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Acomodações"
        description="Catálogo independente de acomodações e recomendação contextual por escola para upsell da matrícula"
      />

      <AccommodationsView
        accommodations={accommodations}
        schools={schools}
        recommendationScope={recommendationScope}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Recomendação por escola</h2>
        <p className="mt-1 text-xs text-slate-500">
          Configure quais acomodações entram no upsell por escola da matrícula. A acomodação continua independente no catálogo.
        </p>

        <div className="mt-4 flex flex-col gap-6">
          {schools.map((school) => {
            const rows = recommendationsBySchool.get(school.id) ?? [];
            return (
              <div key={school.id} className="rounded-lg border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-900">{school.name}</h3>
                <p className="text-xs text-slate-500">Instituição: {school.institution?.name ?? '-'}</p>

                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-2 py-2">Acomodação</th>
                        <th className="px-2 py-2">Score</th>
                        <th className="px-2 py-2">Recomendada</th>
                        <th className="px-2 py-2">Prioridade</th>
                        <th className="px-2 py-2">Badge</th>
                        <th className="px-2 py-2">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((item) => (
                        <tr key={`${school.id}-${item.id}`} className="border-b border-slate-100 align-top">
                          <td className="px-2 py-2">
                            <p className="font-medium text-slate-900">{item.title}</p>
                            <p className="text-xs text-slate-500">{item.location} • {item.accommodationType}</p>
                          </td>
                          <td className="px-2 py-2">{Number(item.score ?? 0).toFixed(1)}</td>
                          <td className="px-2 py-2">
                            <Badge variant={item.isRecommendedBySchool ? 'success' : 'default'}>
                              {item.isRecommendedBySchool ? 'Sim' : 'Não'}
                            </Badge>
                          </td>
                          <td className="px-2 py-2">{item.recommendationPriority}</td>
                          <td className="px-2 py-2">{item.recommendationBadge ?? '-'}</td>
                          <td className="px-2 py-2">
                            <form action={updateSchoolAccommodationRecommendationAction} className="grid min-w-[320px] grid-cols-1 gap-2 sm:grid-cols-4">
                              <input type="hidden" name="schoolId" value={school.id} />
                              <input type="hidden" name="accommodationId" value={item.id} />
                              <label className="flex items-center gap-2 text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  name="isRecommended"
                                  defaultChecked={item.isRecommendedBySchool}
                                  disabled={!canWrite}
                                />
                                Recomendado
                              </label>
                              <input
                                type="number"
                                name="priority"
                                min={0}
                                defaultValue={item.recommendationPriority}
                                disabled={!canWrite}
                                className="h-8 rounded-lg border border-slate-300 px-2 text-xs disabled:bg-slate-100"
                                placeholder="Prioridade"
                              />
                              <input
                                type="text"
                                name="badgeLabel"
                                defaultValue={item.recommendationBadge ?? ''}
                                disabled={!canWrite}
                                className="h-8 rounded-lg border border-slate-300 px-2 text-xs disabled:bg-slate-100"
                                placeholder="Badge no app"
                              />
                              <Button type="submit" size="sm" disabled={!canWrite}>Salvar</Button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {schools.length === 0 && (
            <p className="text-sm text-slate-500">Cadastre escolas para configurar recomendações de acomodação por contexto acadêmico.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Uso em matrículas</h2>
        <p className="mt-1 text-xs text-slate-500">
          Acompanhe onde as acomodações estão vinculadas dentro do fluxo acadêmico consolidado.
        </p>

        <div className="mt-4">
          <article className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Matrículas com acomodação</h3>
            <div className="mt-3 space-y-2">
              {enrollments.filter((item) => item.accommodation).map((enrollment) => (
                <div key={enrollment.id} className="rounded border border-slate-200 p-2">
                  <p className="text-sm font-medium text-slate-900">
                    {enrollment.student.firstName} {enrollment.student.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{enrollment.course.program_name}</p>
                  <p className="text-xs text-slate-500">{enrollment.accommodation?.title ?? '-'}</p>
                  <p className="text-xs text-slate-500">Escola: {enrollment.school.name}</p>
                </div>
              ))}
              {enrollments.filter((item) => item.accommodation).length === 0 && (
                <p className="text-xs text-slate-500">Nenhuma matrícula com acomodação vinculada.</p>
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">Fechamentos standalone de acomodação</h2>
        <p className="mt-1 text-xs text-slate-500">
          Quotes do tipo <code>accommodation_only</code> para operação comercial sem curso.
        </p>

        <div className="mt-4 space-y-2">
          {standaloneQuotes.map((quote) => {
            const accommodation =
              quote.accommodationPricing?.accommodation ??
              quote.items?.find((item) => item.itemType === 'accommodation');
            return (
              <div key={quote.id} className="rounded border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">
                  {typeof accommodation === 'object' && accommodation && 'title' in accommodation
                    ? accommodation.title
                    : 'Acomodação (standalone)'}
                </p>
                <p className="text-xs text-slate-500">
                  Tipo: {quote.type} • Total: {Number(quote.totalAmount).toFixed(2)} {quote.currency}
                </p>
                <p className="text-xs text-slate-500">
                  Status do pacote: {quote.packageStatus ?? 'draft'}
                </p>
                {quote.nextStep ? (
                  <p className="text-xs text-slate-500">Próximo passo: {quote.nextStep}</p>
                ) : null}
                <p className="text-xs text-slate-500">
                  Entrada: {Number(quote.downPaymentAmount).toFixed(2)} {quote.currency} •
                  Saldo: {Number(quote.remainingAmount).toFixed(2)} {quote.currency}
                </p>
                {(quote.items ?? [])
                  .filter((item) => item.itemType === 'accommodation')
                  .map((item) => (
                    <p key={item.id} className="text-xs text-slate-500">
                      Período: {new Date(item.startDate).toLocaleDateString('pt-BR')} -{' '}
                      {new Date(item.endDate).toLocaleDateString('pt-BR')}
                    </p>
                  ))}
              </div>
            );
          })}
          {standaloneQuotes.length === 0 && (
            <p className="text-xs text-slate-500">
              Nenhum fechamento standalone de acomodação encontrado no momento.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
