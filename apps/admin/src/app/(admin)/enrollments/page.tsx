import { PageHeader } from '@/components/ui/page-header';
import { EnrollmentView } from './view';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { AccommodationAdmin, CourseAdmin, EnrollmentAdmin, SchoolAdmin } from '@/types/catalog.types';
import type { Institution } from '@/types/structure.types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
        actions={(
          <Link href="/enrollments/new">
            <Button size="sm">Nova matrícula</Button>
          </Link>
        )}
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
