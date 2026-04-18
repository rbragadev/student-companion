import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { EnrollmentIntentAdmin, SchoolAdmin } from '@/types/catalog.types';
import type { Institution } from '@/types/structure.types';
import { EnrollmentIntentsView } from './view';

export default async function EnrollmentIntentsPage() {
  await requirePermission('users.read');

  const [intents, institutions, schools] = await Promise.all([
    apiFetch<EnrollmentIntentAdmin[]>('/enrollment-intents').catch(() => []),
    apiFetch<Institution[]>('/institution').catch(() => []),
    apiFetch<SchoolAdmin[]>('/school').catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Intenções de Matrícula"
        description="Acompanhe intenções iniciadas pelos alunos e o status atual de jornada."
      />
      <EnrollmentIntentsView intents={intents} institutions={institutions} schools={schools} />
    </div>
  );
}
