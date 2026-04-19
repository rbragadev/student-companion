import { PageHeader } from '@/components/ui/page-header';
import { EnrollmentView } from './view';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { AccommodationAdmin, CourseAdmin, EnrollmentAdmin, SchoolAdmin } from '@/types/catalog.types';
import type { Institution } from '@/types/structure.types';

export default async function EnrollmentsPage() {
  await requirePermission('users.read');

  const [enrollments, institutions, schools, courses, accommodations] = await Promise.all([
    apiFetch<EnrollmentAdmin[]>('/enrollments').catch(() => []),
    apiFetch<Institution[]>('/institution').catch(() => []),
    apiFetch<SchoolAdmin[]>('/school').catch(() => []),
    apiFetch<CourseAdmin[]>('/course').catch(() => []),
    apiFetch<AccommodationAdmin[]>('/accommodation').catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Matrículas"
        description="Matrículas confirmadas com vínculo acadêmico completo."
      />
      <EnrollmentView
        enrollments={enrollments}
        institutions={institutions}
        schools={schools}
        courses={courses}
        accommodations={accommodations}
      />
    </div>
  );
}
