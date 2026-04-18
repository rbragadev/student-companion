import Link from 'next/link';
import { BookOpen, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { CourseAdmin, SchoolAdmin } from '@/types/catalog.types';
import type { Unit } from '@/types/structure.types';
import { CoursesView } from './view';

export default async function CoursesPage() {
  const session = await requirePermission('structure.read');
  const canWrite = session.permissions.includes('admin.full') || session.permissions.includes('structure.write');
  const [courses, schools, units] = await Promise.all([
    apiFetch<CourseAdmin[]>('/course').catch(() => []),
    apiFetch<SchoolAdmin[]>('/school').catch(() => []),
    apiFetch<Unit[]>('/unit').catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Cursos (Catálogo do App)"
        description="Cursos exibidos no mobile e usados pelo mecanismo de recomendação"
        actions={canWrite ? <Link href="/courses/new"><Button size="sm"><Plus size={14} />Novo curso</Button></Link> : undefined}
      />

      {courses.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">Nenhum curso cadastrado.</p>
          {canWrite ? (
            <div className="mt-3">
              <Link href="/courses/new">
                <Button size="sm"><BookOpen size={14} />Criar curso</Button>
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <CoursesView courses={courses} schools={schools} units={units} />
      )}
    </div>
  );
}
