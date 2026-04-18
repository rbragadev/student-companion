import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { AccommodationAdmin, CommissionConfigAdmin, CourseAdmin, InstitutionAdmin } from '@/types/catalog.types';
import { createCommissionConfigAction, updateCommissionConfigAction } from './actions';

function scopeLabel(scopeType: CommissionConfigAdmin['scopeType']) {
  if (scopeType === 'institution') return 'Instituição';
  if (scopeType === 'course') return 'Curso';
  if (scopeType === 'accommodation') return 'Acomodação';
  if (scopeType === 'service') return 'Serviço';
  return 'Cupom';
}

export default async function CommissionConfigPage() {
  await requirePermission('users.read');

  const [configs, institutions, courses, schools, accommodations] = await Promise.all([
    apiFetch<CommissionConfigAdmin[]>('/commission-config').catch(() => []),
    apiFetch<InstitutionAdmin[]>('/institution').catch(() => []),
    apiFetch<CourseAdmin[]>('/course').catch(() => []),
    apiFetch<{ id: string; name: string }[]>('/school').catch(() => []),
    apiFetch<AccommodationAdmin[]>('/accommodation').catch(() => []),
  ]);

  const institutionById = new Map(institutions.map((item) => [item.id, item.name]));
  const schoolById = new Map(schools.map((item) => [item.id, item.name]));
  const courseById = new Map(courses.map((item) => [item.id, item]));
  const accommodationById = new Map(accommodations.map((item) => [item.id, item]));

  const institutionOptions = institutions.map((item) => ({ label: item.name, value: item.id }));
  const courseOptions = courses.map((item) => ({
    label: `${item.program_name} (${schoolById.get(item.school_id) ?? 'Escola'})`,
    value: item.id,
  }));
  const accommodationOptions = accommodations.map((item) => ({
    label: `${item.title} (${item.accommodationType})`,
    value: item.id,
  }));

  function resolveScopeName(config: CommissionConfigAdmin) {
    if (config.scopeType === 'institution') {
      return institutionById.get(config.scopeId) ?? config.scopeId;
    }
    if (config.scopeType === 'course') {
      const course = courseById.get(config.scopeId);
      if (!course) return config.scopeId;
      const schoolName = schoolById.get(course.school_id) ?? 'Escola';
      return `${course.program_name} (${schoolName})`;
    }
    if (config.scopeType === 'accommodation') {
      const accommodation = accommodationById.get(config.scopeId);
      if (!accommodation) return config.scopeId;
      return `${accommodation.title} (${accommodation.accommodationType})`;
    }
    return config.scopeId;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Configuração de Comissão"
        description="Defina a comissão padrão por instituição. Curso e acomodação usam essa base automaticamente quando não houver override."
      />

      <article className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Nova Configuração</h2>
        <form action={createCommissionConfigAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            Tipo de regra
            <select name="scopeType" defaultValue="institution" className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
              <option value="institution">Padrão da instituição</option>
              <option value="course">Override de curso</option>
              <option value="accommodation">Override de acomodação</option>
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Instituição
            <select name="scopeInstitutionId" className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
              {institutionOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Curso (override opcional)
            <select name="scopeCourseId" className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
              <option value="">Sem override de curso</option>
              {courseOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Acomodação (quando for override)
            <select name="scopeAccommodationId" className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
              <option value="">Selecione a acomodação</option>
              {accommodationOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">
            Percentual (%)
            <input name="percentage" type="number" min={0} max={100} step="0.01" className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <label className="text-xs font-medium text-slate-600">
            Valor Fixo (opcional)
            <input name="fixedAmount" type="number" min={0} step="0.01" className="mt-1 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="inline-flex h-9 items-center rounded-lg bg-slate-900 px-4 text-sm font-medium text-white">
              Criar Configuração
            </button>
          </div>
        </form>
        {institutionOptions.length > 0 && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-700">Como funciona a prioridade</p>
            <ul className="mt-2 space-y-1">
              <li>1. Curso usa override de curso, senão usa comissão da instituição.</li>
              <li>2. Acomodação usa override de acomodação, senão usa comissão da instituição.</li>
              <li>3. Cadastre pelo menos a regra padrão da instituição para evitar comissão zerada.</li>
            </ul>
          </div>
        )}
      </article>

      <article className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Configurações Atuais</h2>
        <div className="mt-4 space-y-3">
          {configs.length === 0 && <p className="text-xs text-slate-500">Nenhuma configuração cadastrada.</p>}
          {configs.map((config) => (
            <form
              key={config.id}
              action={updateCommissionConfigAction}
              className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-5"
            >
              <input type="hidden" name="id" value={config.id} />
              <label className="text-xs font-medium text-slate-600">
                Escopo
                <select name="scopeType" defaultValue={config.scopeType} className="mt-1 h-8 w-full rounded border border-slate-300 px-2 text-xs">
                  <option value="institution">Instituição</option>
                  <option value="course">Curso</option>
                  <option value="accommodation">Acomodação</option>
                </select>
              </label>
              <input type="hidden" name="scopeId" value={config.scopeId} />
              <label className="text-xs font-medium text-slate-600">
                %
                <input name="percentage" type="number" min={0} max={100} step="0.01" defaultValue={config.percentage} className="mt-1 h-8 w-full rounded border border-slate-300 px-2 text-xs" />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Fixo
                <input name="fixedAmount" type="number" min={0} step="0.01" defaultValue={config.fixedAmount ?? ''} className="mt-1 h-8 w-full rounded border border-slate-300 px-2 text-xs" />
              </label>
              <div className="flex items-end gap-2">
                <button type="submit" className="inline-flex h-8 items-center rounded border border-slate-300 px-3 text-xs font-medium text-slate-700">
                  Salvar
                </button>
                <span className="text-xs text-slate-500">{scopeLabel(config.scopeType)}</span>
              </div>
              <p className="md:col-span-5 text-xs text-slate-500">
                Escopo: {resolveScopeName(config)}
              </p>
            </form>
          ))}
        </div>
      </article>
    </div>
  );
}
