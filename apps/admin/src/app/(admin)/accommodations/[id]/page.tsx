import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type {
  AccommodationAdmin,
  AccommodationPricingAdmin,
  EnrollmentAdmin,
  SchoolAccommodationRecommendationAdmin,
  SchoolAdmin,
} from '@/types/catalog.types';
import {
  createAccommodationPricingInlineAction,
  updateAccommodationAction,
  updateAccommodationPricingInlineAction,
  updateSchoolAccommodationRecommendationAction,
} from '../actions';

interface PageProps {
  params: Promise<{ id: string }>;
}

function toDateInputValue(value?: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

export default async function AccommodationDetailPage({ params }: Readonly<PageProps>) {
  const { id } = await params;
  const session = await requirePermission('structure.read');
  const canWrite =
    session.permissions.includes('admin.full') || session.permissions.includes('structure.write');

  const [accommodation, pricingRows, schools, linkedEnrollments] = await Promise.all([
    apiFetch<AccommodationAdmin>(`/accommodation/${id}`).catch(() => null),
    apiFetch<AccommodationPricingAdmin[]>(`/accommodation-pricing?accommodationId=${id}`).catch(
      () => [],
    ),
    apiFetch<SchoolAdmin[]>('/school').catch(() => []),
    apiFetch<EnrollmentAdmin[]>(`/enrollments?accommodationId=${id}`).catch(() => []),
  ]);

  if (!accommodation) notFound();
  const linkedStudentsCount = linkedEnrollments.length;
  const linkedRevenue = linkedEnrollments.reduce(
    (total, enrollment) =>
      total + Number(enrollment.pricing?.accommodationAmount ?? 0),
    0,
  );

  const recommendationEntries = await Promise.all(
    schools.map(async (school) => {
      const items = await apiFetch<SchoolAccommodationRecommendationAdmin[]>(
        `/accommodation/recommendations/school/${school.id}`,
      ).catch(() => []);
      const row = items.find((item) => item.id === id) ?? null;
      return [school.id, row] as const;
    }),
  );
  const recommendationsBySchool = new Map<string, SchoolAccommodationRecommendationAdmin | null>(
    recommendationEntries,
  );
  const primarySchoolContext =
    schools.find((school) => recommendationsBySchool.get(school.id)?.isRecommendedBySchool) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: 'Acomodações', href: '/accommodations' },
          ...(primarySchoolContext?.institution?.name ? [{ label: primarySchoolContext.institution.name }] : []),
          ...(primarySchoolContext ? [{ label: primarySchoolContext.name }] : []),
          { label: accommodation.title },
        ]}
      />
      <PageHeader
        title={`Acomodação: ${accommodation.title}`}
        description="Gerencie dados gerais, pricing e recomendação por escola no mesmo contexto da acomodação."
        actions={
          <Link href="/accommodations">
            <Button variant="outline" size="sm">
              <ArrowLeft size={14} />
              Voltar
            </Button>
          </Link>
        }
      />

      <form
        action={updateAccommodationAction.bind(null, accommodation.id)}
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2 className="text-sm font-semibold text-slate-900">Dados gerais</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Título</span>
            <input
              name="title"
              defaultValue={accommodation.title}
              disabled={!canWrite}
              required
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Tipo</span>
            <select
              name="accommodationType"
              defaultValue={accommodation.accommodationType}
              disabled={!canWrite}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            >
              <option value="Homestay">Homestay</option>
              <option value="Shared">Shared</option>
              <option value="Studio">Studio</option>
              <option value="Apartment">Apartment</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Localização</span>
            <input
              name="location"
              defaultValue={accommodation.location}
              disabled={!canWrite}
              required
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Preço base (centavos)</span>
            <input
              name="priceInCents"
              type="number"
              min={0}
              defaultValue={accommodation.priceInCents}
              disabled={!canWrite}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Unidade de preço</span>
            <input
              name="priceUnit"
              defaultValue={accommodation.priceUnit}
              disabled={!canWrite}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Score</span>
            <input
              name="score"
              type="number"
              min={0}
              step="0.1"
              defaultValue={accommodation.score ?? ''}
              disabled={!canWrite}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Good for</span>
            <input
              name="goodFor"
              defaultValue={accommodation.goodFor ?? ''}
              disabled={!canWrite}
              placeholder="intermediate students"
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Imagem principal (URL)</span>
            <input
              name="image"
              defaultValue={accommodation.image ?? ''}
              disabled={!canWrite}
              required
              placeholder="https://..."
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Badges (CSV)</span>
            <input
              name="badges"
              defaultValue={accommodation.badges?.join(', ') ?? ''}
              disabled={!canWrite}
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
            />
          </label>
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Descrição</span>
            <textarea
              name="description"
              defaultValue={accommodation.description ?? ''}
              rows={3}
              disabled={!canWrite}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm disabled:bg-slate-100"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isPartner"
              defaultChecked={accommodation.isPartner ?? false}
              disabled={!canWrite}
            />
            <span className="text-sm text-slate-700">Parceira</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isTopTrip"
              defaultChecked={accommodation.isTopTrip ?? false}
              disabled={!canWrite}
            />
            <span className="text-sm text-slate-700">Top trip</span>
          </label>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" name="isActive" defaultChecked={accommodation.isActive} disabled={!canWrite} />
            <span className="text-sm text-slate-700">Acomodação ativa</span>
          </label>
        </div>
        {canWrite && <Button type="submit">Salvar dados gerais</Button>}
      </form>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Pricing por período</h2>
        <p className="mt-1 text-xs text-slate-500">
          Configure o preço base semanal e, opcionalmente, a regra de diária (mínimo e janela). Sem
          preço por dia, o cálculo é semanal.
        </p>

        <form
          action={createAccommodationPricingInlineAction.bind(null, accommodation.id)}
          className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-8"
        >
          <label className="text-xs text-slate-600">
            Período (texto)
            <input
              name="periodOption"
              required
              placeholder="Fall 2026"
              className="mt-1 h-9 rounded-lg border border-slate-300 px-3 text-sm"
            />
          </label>
          <label className="text-xs text-slate-600">
            Preço base (semanal)
            <input
              name="basePrice"
              type="number"
              min={0}
              step="0.01"
              required
              placeholder="1200"
              className="mt-1 h-9 rounded-lg border border-slate-300 px-3 text-sm"
            />
          </label>
          <label className="text-xs text-slate-600">
            Preço por dia (opcional)
            <input
              name="pricePerDay"
              type="number"
              min={0}
              step="0.01"
              placeholder="Opcional"
              className="mt-1 h-9 rounded-lg border border-slate-300 px-3 text-sm"
            />
          </label>
          <label className="text-xs text-slate-600">
            Mín. permanência (dias)
            <input
              name="minimumStayDays"
              type="number"
              min={1}
              defaultValue={1}
              className="mt-1 h-9 rounded-lg border border-slate-300 px-3 text-sm"
              placeholder="7"
            />
          </label>
          <label className="text-xs text-slate-600">
            Janela início (opcional)
            <input name="windowStartDate" type="date" className="mt-1 h-9 rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="text-xs text-slate-600">
            Janela fim (opcional)
            <input name="windowEndDate" type="date" className="mt-1 h-9 rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="text-xs text-slate-600">
            Moeda
            <input
              name="currency"
              defaultValue="CAD"
              required
              className="mt-1 h-9 rounded-lg border border-slate-300 px-3 text-sm"
            />
          </label>
          <div className="mt-5 sm:mt-0 sm:self-end">
            <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs text-slate-600">
              <input type="checkbox" name="isActive" defaultChecked />
              Ativo
            </label>
          </div>
          <div className="text-xs text-slate-500 sm:col-span-8">
            Regras:
            <ul className="mt-1 list-disc pl-5">
              <li>Se preencher <strong>Preço por dia</strong>, usamos regra de diária + janela + mínimo.</li>
              <li>Sem <strong>Preço por dia</strong>, o cálculo é semanal usando <strong>Preço base</strong>.</li>
            </ul>
          </div>

          <Button type="submit" disabled={!canWrite}>
            Adicionar preço
          </Button>
        </form>

        <div className="mt-4 space-y-2">
          {pricingRows.map((item) => (
            <form
              key={item.id}
              action={updateAccommodationPricingInlineAction}
              className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-8"
            >
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="accommodationId" value={accommodation.id} />
              <input
                name="periodOption"
                defaultValue={item.periodOption}
                className="h-9 rounded-lg border border-slate-300 px-3 text-sm"
                disabled={!canWrite}
              />
              <input
                name="basePrice"
                type="number"
                min={0}
                step="0.01"
                defaultValue={Number(item.basePrice)}
                className="h-9 rounded-lg border border-slate-300 px-3 text-sm"
                disabled={!canWrite}
              />
              <input
                name="pricePerDay"
                type="number"
                min={0}
                step="0.01"
                defaultValue={item.pricePerDay ?? ''}
                placeholder="Opcional"
                className="h-9 rounded-lg border border-slate-300 px-3 text-sm"
                disabled={!canWrite}
              />
              <input
                name="minimumStayDays"
                type="number"
                min={1}
                defaultValue={item.minimumStayDays ?? 1}
                className="h-9 rounded-lg border border-slate-300 px-3 text-sm"
                disabled={!canWrite}
              />
              <input
                name="windowStartDate"
                type="date"
                defaultValue={toDateInputValue(item.windowStartDate)}
                className="h-9 rounded-lg border border-slate-300 px-3 text-sm"
                disabled={!canWrite}
              />
              <input
                name="windowEndDate"
                type="date"
                defaultValue={toDateInputValue(item.windowEndDate)}
                className="h-9 rounded-lg border border-slate-300 px-3 text-sm"
                disabled={!canWrite}
              />
              <input
                name="currency"
                defaultValue={item.currency}
                className="h-9 rounded-lg border border-slate-300 px-3 text-sm"
                disabled={!canWrite}
              />
              <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm">
                <input type="checkbox" name="isActive" defaultChecked={item.isActive} disabled={!canWrite} />
                Ativo
              </label>
              <div className="flex items-center">
                <Badge variant={item.isActive ? 'success' : 'default'}>
                  {item.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <Button type="submit" disabled={!canWrite}>
                Salvar
              </Button>
            </form>
          ))}
          {pricingRows.length === 0 && (
            <p className="text-xs text-slate-500">Nenhum preço cadastrado para esta acomodação.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Recomendação por escola/contexto</h2>
        <p className="mt-1 text-xs text-slate-500">
          Marque em quais escolas esta acomodação é recomendada no upsell (máx. 3 por escola).
        </p>

        <div className="mt-4 space-y-2">
          {schools.map((school) => {
            const recommendation = recommendationsBySchool.get(school.id);
            return (
              <form
                key={`${school.id}-${accommodation.id}`}
                action={updateSchoolAccommodationRecommendationAction}
                className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-6"
              >
                <input type="hidden" name="schoolId" value={school.id} />
                <input type="hidden" name="accommodationId" value={accommodation.id} />
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-slate-900">{school.name}</p>
                  <p className="text-xs text-slate-500">{school.institution?.name ?? '-'}</p>
                </div>
                <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm">
                  <input
                    type="checkbox"
                    name="isRecommended"
                    defaultChecked={recommendation?.isRecommendedBySchool ?? false}
                    disabled={!canWrite}
                  />
                  Recomendada
                </label>
                <input
                  name="priority"
                  type="number"
                  min={0}
                  defaultValue={recommendation?.recommendationPriority ?? 0}
                  className="h-9 rounded-lg border border-slate-300 px-3 text-sm"
                  disabled={!canWrite}
                />
                <input
                  name="badgeLabel"
                  defaultValue={recommendation?.recommendationBadge ?? ''}
                  placeholder="Badge no app"
                  className="h-9 rounded-lg border border-slate-300 px-3 text-sm"
                  disabled={!canWrite}
                />
                <Button type="submit" disabled={!canWrite}>
                  Salvar
                </Button>
              </form>
            );
          })}
          {schools.length === 0 && (
            <p className="text-xs text-slate-500">Cadastre escolas para configurar recomendações.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Matrículas vinculadas</h2>
        <p className="mt-1 text-xs text-slate-500">
          Operação: veja em quais matrículas esta acomodação está no pacote.
        </p>
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p>Alunos vinculados: <strong>{linkedStudentsCount}</strong></p>
          <p>Receita estimada da acomodação: <strong>{linkedRevenue.toFixed(2)} CAD</strong></p>
        </div>
        <div className="mt-3 space-y-2">
          {linkedEnrollments.map((enrollment) => (
            <Link
              key={enrollment.id}
              href={`/enrollments/${enrollment.id}`}
              className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
            >
              <p className="text-sm font-medium text-slate-900">
                {enrollment.student.firstName} {enrollment.student.lastName}
              </p>
              <p className="text-xs text-slate-500">
                {enrollment.course.program_name} • {enrollment.academicPeriod.name} • {enrollment.status}
              </p>
            </Link>
          ))}
          {linkedEnrollments.length === 0 && (
            <p className="text-xs text-slate-500">Nenhuma matrícula vinculada a esta acomodação.</p>
          )}
        </div>
      </section>
    </div>
  );
}
