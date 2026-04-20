import Link from 'next/link';
import { DataTable, type Column } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import { formatDatePtBr } from '@/lib/date';
import type { AccommodationAdmin, CourseAdmin, EnrollmentAdmin, StudentAdmin } from '@/types/catalog.types';
import { NewEnrollmentForm } from '../enrollments/new/new-enrollment-form';

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

export default async function PackageOperationsPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<{
    error?: string;
    status?: string;
  }>;
}>) {
  await requirePermission('users.write');

  const params = (await searchParams) ?? {};
  const selectedStatus = params.status ?? '';

  const [students, courses, accommodations, enrollments] = await Promise.all([
    apiFetch<StudentAdmin[]>('/users/student').catch(() => []),
    apiFetch<CourseAdmin[]>('/course').catch(() => []),
    apiFetch<AccommodationAdmin[]>('/accommodation').catch(() => []),
    apiFetch<EnrollmentAdmin[]>('/enrollments').catch(() => []),
  ]);

  const offersEntries = await Promise.all(
    courses.map(async (course) => {
      const offers = await apiFetch<CourseOffer[]>(`/course/${course.id}/offers`).catch(() => []);
      return [course.id, offers] as const;
    }),
  );
  const offersByCourse = Object.fromEntries(offersEntries) as Record<string, CourseOffer[]>;

  const rows = selectedStatus
    ? enrollments.filter((enrollment) => enrollment.status === selectedStatus)
    : enrollments;

  const columns: Column<EnrollmentAdmin>[] = [
    {
      key: 'student',
      label: 'Aluno',
      render: (enrollment) => (
        <div>
          <p className="font-medium text-slate-900">
            {enrollment.student?.firstName} {enrollment.student?.lastName}
          </p>
          <p className="text-xs text-slate-500">{enrollment.student?.email}</p>
        </div>
      ),
    },
    {
      key: 'course',
      label: 'Curso',
      render: (enrollment) => (
        <p className="text-sm text-slate-700">{enrollment.course?.program_name ?? '-'}</p>
      ),
    },
    {
      key: 'dates',
      label: 'Janela do curso',
      render: (enrollment) => (
        <p className="text-xs text-slate-600">
          {formatDatePtBr(enrollment.academicPeriod?.startDate)} até {formatDatePtBr(enrollment.academicPeriod?.endDate)}
        </p>
      ),
    },
    {
      key: 'accommodation',
      label: 'Acomodação',
      render: (enrollment) => (
        <p className="text-xs text-slate-700">
          {enrollment.accommodation?.title ?? 'Não selecionada'}
        </p>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (enrollment) => <p className="text-sm text-slate-700">{enrollment.status}</p>,
    },
    {
      key: 'open',
      label: 'Ação',
      render: (enrollment) => (
        <Link href={`/enrollments/${enrollment.id}`} className="text-xs text-blue-600 hover:underline">
          Abrir matrícula
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pacote"
        description="Pacote = venda em contexto de matrícula. Curso e acomodação ficam como itens independentes, com vínculo conjunto no cadastro da matrícula."
      />

      {params.error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {decodeURIComponent(params.error)}
        </div>
      ) : null}

      <form method="get" className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="text-slate-600">Status</span>
          <input
            name="status"
            defaultValue={selectedStatus}
            placeholder="draft"
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white sm:col-span-2 sm:w-40"
        >
          Filtrar
        </button>
      </form>

      <NewEnrollmentForm
        students={students}
        courses={courses}
        accommodations={accommodations}
        offersByCourse={offersByCourse}
        mode="package"
        showProposalActions={false}
      />

      <DataTable<EnrollmentAdmin>
        columns={columns}
        data={rows}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/enrollments/${item.id}`}
        emptyTitle="Nenhum pacote (matrícula) encontrado"
        emptyDescription="Crie uma nova matrícula em pacote para iniciar a operação."
      />
    </div>
  );
}
