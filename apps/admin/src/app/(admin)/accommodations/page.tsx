import { PageHeader } from '@/components/ui/page-header';
import { DataTable, type Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type {
  AccommodationAdmin,
  EnrollmentAdmin,
  EnrollmentIntentAdmin,
  SchoolAccommodationRecommendationAdmin,
  SchoolAdmin,
} from '@/types/catalog.types';
import { updateSchoolAccommodationRecommendationAction } from './actions';

const catalogColumns: Column<AccommodationAdmin>[] = [
  {
    key: 'title',
    label: 'Acomodação',
    render: (item) => (
      <div>
        <p className="font-medium text-slate-900">{item.title}</p>
        <p className="text-xs text-slate-500">{item.location} • {item.accommodationType}</p>
      </div>
    ),
  },
  {
    key: 'price',
    label: 'Preço',
    render: (item) => `$${(item.priceInCents / 100).toFixed(0)}/${item.priceUnit}`,
  },
  {
    key: 'score',
    label: 'Score',
    render: (item) => Number(item.score ?? 0).toFixed(1),
  },
  {
    key: 'status',
    label: 'Status',
    render: (item) => <Badge variant={item.isActive ? 'success' : 'default'}>{item.isActive ? 'Ativa' : 'Inativa'}</Badge>,
  },
];

export default async function AccommodationsPage() {
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');

  const [accommodations, schools, intents, enrollments] = await Promise.all([
    apiFetch<AccommodationAdmin[]>('/accommodation').catch(() => []),
    apiFetch<SchoolAdmin[]>('/school').catch(() => []),
    apiFetch<EnrollmentIntentAdmin[]>('/enrollment-intents').catch(() => []),
    apiFetch<EnrollmentAdmin[]>('/enrollments').catch(() => []),
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Acomodações"
        description="Catálogo independente de acomodações e recomendação contextual por escola para upsell da matrícula"
      />

      <DataTable<AccommodationAdmin>
        columns={catalogColumns}
        data={accommodations}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/accommodations/${item.id}`}
        emptyTitle="Nenhuma acomodação cadastrada"
        emptyDescription="O catálogo de acomodações está vazio."
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
        <h2 className="text-base font-semibold text-slate-900">Uso em intenções e matrículas</h2>
        <p className="mt-1 text-xs text-slate-500">
          Acompanhe onde as acomodações estão vinculadas dentro do fluxo acadêmico.
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <article className="rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Intenções com acomodação</h3>
            <div className="mt-3 space-y-2">
              {intents.filter((item) => item.accommodation).map((intent) => (
                <div key={intent.id} className="rounded border border-slate-200 p-2">
                  <p className="text-sm font-medium text-slate-900">
                    {intent.student.firstName} {intent.student.lastName}
                  </p>
                  <p className="text-xs text-slate-500">{intent.course.program_name}</p>
                  <p className="text-xs text-slate-500">{intent.accommodation?.title ?? '-'}</p>
                  <p className="text-xs text-slate-500">Status: {intent.status}</p>
                </div>
              ))}
              {intents.filter((item) => item.accommodation).length === 0 && (
                <p className="text-xs text-slate-500">Nenhuma intenção com acomodação no momento.</p>
              )}
            </div>
          </article>

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
    </div>
  );
}
