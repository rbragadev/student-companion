import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { AccommodationAdmin, CourseAdmin, StudentAdmin } from '@/types/catalog.types';
import { NewEnrollmentForm } from './new-enrollment-form';

interface CourseOffer {
  id: string;
  courseId: string;
  classGroupId: string;
  classGroupName: string;
  classGroupCode: string;
  academicPeriodId: string;
  academicPeriodName: string;
  startDate: string;
  endDate: string;
}

export default async function NewEnrollmentPage({
  searchParams,
}: Readonly<{ searchParams?: Promise<{ error?: string }> }>) {
  await requirePermission('users.write');

  const [students, courses, accommodations] = await Promise.all([
    apiFetch<StudentAdmin[]>('/users/student').catch(() => []),
    apiFetch<CourseAdmin[]>('/course').catch(() => []),
    apiFetch<AccommodationAdmin[]>('/accommodation').catch(() => []),
  ]);

  const offersEntries = await Promise.all(
    courses.map(async (course) => {
      const offers = await apiFetch<CourseOffer[]>(`/course/${course.id}/offers`).catch(() => []);
      return [course.id, offers] as const;
    }),
  );
  const offersByCourse = Object.fromEntries(offersEntries) as Record<string, CourseOffer[]>;

  const params = (await searchParams) ?? {};

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nova Matrícula"
        description="Fluxo comercial igual ao app: curso, datas, acomodação opcional e geração de pacote."
        actions={(
          <Link href="/enrollments">
            <Button size="sm" variant="outline"><ArrowLeft size={14} />Voltar</Button>
          </Link>
        )}
      />

      {params.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {decodeURIComponent(params.error)}
        </div>
      ) : null}

      <NewEnrollmentForm
        students={students}
        courses={courses}
        accommodations={accommodations}
        offersByCourse={offersByCourse}
      />
    </div>
  );
}

