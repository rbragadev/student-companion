import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { requirePermission } from '@/lib/authorization';
import type { SchoolAdmin } from '@/types/catalog.types';
import type { Unit } from '@/types/structure.types';
import { CourseHierarchyFields } from '../course-hierarchy-fields';
import { createCourseAction } from '../actions';

export default async function NewCoursePage() {
  await requirePermission('structure.write');
  const [schools, units] = await Promise.all([
    apiFetch<SchoolAdmin[]>('/school').catch(() => []),
    apiFetch<Unit[]>('/unit').catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs items={[{ label: 'Cursos', href: '/courses' }, { label: 'Novo curso' }]} />
      <PageHeader
        title="Novo curso"
        description="Cadastre curso vinculado a uma unidade (e escola) do catálogo"
        actions={<Link href="/courses"><Button variant="outline" size="sm"><ArrowLeft size={14} />Voltar</Button></Link>}
      />

      <form action={createCourseAction} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CourseHierarchyFields schools={schools} units={units} />
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Nome do programa</span><input name="programName" required minLength={2} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Horas semanais</span><input name="weeklyHours" type="number" min={1} required className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Duração</span><input name="duration" required className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Tipo de período</span>
            <select name="periodType" defaultValue="fixed" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm">
              <option value="fixed">Fixo</option>
              <option value="weekly">Semanal</option>
            </select>
          </label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Preço (centavos)</span><input name="priceInCents" type="number" min={0} className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1"><span className="text-sm font-medium text-slate-700">Unidade de preço</span><input name="priceUnit" placeholder="week/month" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Tipo de visto</span><input name="visaType" required className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Público-alvo</span><input name="targetAudience" required className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Imagem principal (URL)</span><input name="image" required className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Imagens (URLs separadas por vírgula)</span><input name="images" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Badges (separadas por vírgula)</span><input name="badges" className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm" /></label>
          <label className="space-y-1 sm:col-span-2"><span className="text-sm font-medium text-slate-700">Descrição</span><textarea name="description" rows={4} required className="w-full rounded-lg border border-slate-300 p-3 text-sm" /></label>
          <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" /><span className="text-sm text-slate-700">Curso ativo</span></label>
          <label className="flex items-center gap-2 sm:col-span-2"><input type="checkbox" name="autoApproveIntent" className="h-4 w-4" /><span className="text-sm text-slate-700">Auto-approve de intenção</span></label>
        </div>
        <div className="flex justify-end"><Button type="submit">Salvar curso</Button></div>
      </form>
    </div>
  );
}
