import { PageHeader } from '@/components/ui/page-header';
import { ErrorState } from '@/components/ui/error-state';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { Institution, Unit, AcademicPeriod, ClassGroup } from '@/types/structure.types';
import type { SchoolAdmin, CourseAdmin } from '@/types/catalog.types';
import { AcademicStructureView } from './view';

async function fetchStructureData() {
  const labels = [
    { key: 'institutions', path: '/institution' },
    { key: 'schools', path: '/school' },
    { key: 'units', path: '/unit' },
    { key: 'courses', path: '/course' },
    { key: 'classes', path: '/class-group' },
    { key: 'periods', path: '/academic-period' },
  ] as const;

  const responses = await Promise.allSettled(labels.map((item) => apiFetch(item.path)));

  const fetchErrors: string[] = [];
  const data = {
    institutions: [] as Institution[],
    schools: [] as SchoolAdmin[],
    units: [] as Unit[],
    courses: [] as CourseAdmin[],
    classes: [] as ClassGroup[],
    periods: [] as AcademicPeriod[],
  };

  responses.forEach((result, index) => {
    const key = labels[index].key;
    if (result.status === 'fulfilled') {
      (data[key] as unknown[]) = Array.isArray(result.value) ? result.value : [];
    } else {
      fetchErrors.push(`${labels[index].path}: ${result.reason instanceof Error ? result.reason.message : 'erro desconhecido'}`);
    }
  });

  return {
    ...data,
    fetchErrors,
  };
}

export default async function AcademicStructurePage() {
  await requirePermission('structure.read');

  const data = await fetchStructureData();

  const allSourcesFailed =
    data.institutions.length === 0 &&
    data.schools.length === 0 &&
    data.units.length === 0 &&
    data.courses.length === 0 &&
    data.classes.length === 0 &&
    data.periods.length === 0 &&
    data.fetchErrors.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Estrutura Acadêmica"
        description="Consulta operacional da cadeia: instituição > escola > unidade > curso > turma > períodos."
      />

      {allSourcesFailed ? (
        <ErrorState
          title="Não foi possível carregar a estrutura acadêmica"
          message="Verifique a API e tente novamente."
        />
      ) : (
        <AcademicStructureView {...data} />
      )}
    </div>
  );
}
