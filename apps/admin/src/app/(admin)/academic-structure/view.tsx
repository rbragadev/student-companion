'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterBar, type FilterOption } from '@/components/filters/filter-bar';
import type { Institution, Unit, AcademicPeriod, ClassGroup } from '@/types/structure.types';
import type { SchoolAdmin, CourseAdmin } from '@/types/catalog.types';

interface AcademicStructureViewProps {
  institutions: Institution[];
  schools: SchoolAdmin[];
  units: Unit[];
  courses: CourseAdmin[];
  classes: ClassGroup[];
  periods: AcademicPeriod[];
  fetchErrors: string[];
}

function formatDateRange(startDate: string, endDate: string) {
  return `${new Date(startDate).toLocaleDateString('pt-BR')} - ${new Date(endDate).toLocaleDateString('pt-BR')}`;
}

function buildOptions<T>(items: T[], getLabel: (item: T) => string, getValue: (item: T) => string): FilterOption[] {
  return items.map((item) => ({ label: getLabel(item), value: getValue(item) }));
}

export function AcademicStructureView({
  institutions,
  schools,
  units,
  courses,
  classes,
  periods,
  fetchErrors,
}: Readonly<AcademicStructureViewProps>) {
  const [institutionId, setInstitutionId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [classGroupId, setClassGroupId] = useState('');

  const schoolById = useMemo(() => new Map(schools.map((item) => [item.id, item])), [schools]);
  const unitById = useMemo(() => new Map(units.map((item) => [item.id, item])), [units]);
  const courseById = useMemo(() => new Map(courses.map((item) => [item.id, item])), [courses]);
  const classById = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);
  const institutionById = useMemo(() => new Map(institutions.map((item) => [item.id, item])), [institutions]);

  const selectedInstitution = institutionById.get(institutionId);
  const selectedSchool = schoolById.get(schoolId);
  const selectedUnit = unitById.get(unitId);
  const selectedCourse = courseById.get(courseId);
  const selectedClass = classById.get(classGroupId);

  const filteredSchools = useMemo(
    () => schools.filter((item) => !institutionId || item.institutionId === institutionId),
    [schools, institutionId],
  );

  const filteredUnits = useMemo(() => (
    units.filter((item) => {
      const school = schoolById.get(item.schoolId);
      if (!school) return false;
      if (institutionId && school.institutionId !== institutionId) return false;
      if (schoolId && item.schoolId !== schoolId) return false;
      return true;
    })
  ), [units, schoolById, institutionId, schoolId]);

  const filteredCourses = useMemo(() => (
    courses.filter((item) => {
      const unit = unitById.get(item.unitId);
      if (!unit) return false;
      const school = schoolById.get(unit.schoolId);
      if (!school) return false;

      if (institutionId && school.institutionId !== institutionId) return false;
      if (schoolId && school.id !== schoolId) return false;
      if (unitId && unit.id !== unitId) return false;
      if (courseId && item.id !== courseId) return false;
      return true;
    })
  ), [courses, unitById, schoolById, institutionId, schoolId, unitId, courseId]);

  const filteredClasses = useMemo(() => (
    classes.filter((item) => {
      const course = courseById.get(item.courseId);
      if (!course) return false;
      const unit = unitById.get(course.unitId);
      if (!unit) return false;
      const school = schoolById.get(unit.schoolId);
      if (!school) return false;

      if (institutionId && school.institutionId !== institutionId) return false;
      if (schoolId && school.id !== schoolId) return false;
      if (unitId && unit.id !== unitId) return false;
      if (courseId && course.id !== courseId) return false;
      if (classGroupId && item.id !== classGroupId) return false;
      return true;
    })
  ), [classes, courseById, unitById, schoolById, institutionId, schoolId, unitId, courseId, classGroupId]);

  const filteredPeriods = useMemo(() => (
    periods.filter((item) => {
      const classGroup = classById.get(item.classGroupId);
      if (!classGroup) return false;
      const course = courseById.get(classGroup.courseId);
      if (!course) return false;
      const unit = unitById.get(course.unitId);
      if (!unit) return false;
      const school = schoolById.get(unit.schoolId);
      if (!school) return false;

      if (institutionId && school.institutionId !== institutionId) return false;
      if (schoolId && school.id !== schoolId) return false;
      if (unitId && unit.id !== unitId) return false;
      if (courseId && course.id !== courseId) return false;
      if (classGroupId && classGroup.id !== classGroupId) return false;
      return true;
    })
  ), [periods, classById, courseById, unitById, schoolById, institutionId, schoolId, unitId, courseId, classGroupId]);

  const institutionOptions = useMemo(
    () => buildOptions(institutions, (item) => item.name, (item) => item.id),
    [institutions],
  );
  const schoolOptions = useMemo(
    () => buildOptions(filteredSchools, (item) => item.name, (item) => item.id),
    [filteredSchools],
  );
  const unitOptions = useMemo(
    () => buildOptions(filteredUnits, (item) => `${item.name} (${item.code})`, (item) => item.id),
    [filteredUnits],
  );
  const courseOptions = useMemo(
    () => buildOptions(filteredCourses, (item) => item.program_name, (item) => item.id),
    [filteredCourses],
  );
  const classOptions = useMemo(
    () => buildOptions(filteredClasses, (item) => `${item.name} (${item.code})`, (item) => item.id),
    [filteredClasses],
  );

  const selectedPath = [
    selectedInstitution?.name,
    selectedSchool?.name,
    selectedUnit?.name,
    selectedCourse?.program_name,
    selectedClass?.name,
  ].filter(Boolean).join(' > ');

  const hasAnyResult =
    filteredSchools.length > 0 ||
    filteredUnits.length > 0 ||
    filteredCourses.length > 0 ||
    filteredClasses.length > 0 ||
    filteredPeriods.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Filtros Encadeados</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setInstitutionId('');
              setSchoolId('');
              setUnitId('');
              setCourseId('');
              setClassGroupId('');
            }}
          >
            Limpar filtros
          </Button>
        </div>

        <FilterBar
          filters={[
            {
              key: 'institutionId',
              label: 'Instituição',
              options: institutionOptions,
              value: institutionId,
              onChange: (value) => {
                setInstitutionId(value);
                setSchoolId('');
                setUnitId('');
                setCourseId('');
                setClassGroupId('');
              },
            },
            {
              key: 'schoolId',
              label: 'Escola',
              options: schoolOptions,
              value: schoolId,
              onChange: (value) => {
                setSchoolId(value);
                setUnitId('');
                setCourseId('');
                setClassGroupId('');
              },
            },
            {
              key: 'unitId',
              label: 'Unidade',
              options: unitOptions,
              value: unitId,
              onChange: (value) => {
                setUnitId(value);
                setCourseId('');
                setClassGroupId('');
              },
            },
            {
              key: 'courseId',
              label: 'Curso',
              options: courseOptions,
              value: courseId,
              onChange: (value) => {
                setCourseId(value);
                setClassGroupId('');
              },
            },
            {
              key: 'classGroupId',
              label: 'Turma',
              options: classOptions,
              value: classGroupId,
              onChange: (value) => {
                setClassGroupId(value);
              },
            },
          ]}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="primary">Caminho atual</Badge>
          <p className="text-sm text-slate-700">
            {selectedPath || 'Sem filtros aplicados'}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge variant="default">Escolas: {filteredSchools.length}</Badge>
          <Badge variant="default">Unidades: {filteredUnits.length}</Badge>
          <Badge variant="default">Cursos: {filteredCourses.length}</Badge>
          <Badge variant="default">Turmas: {filteredClasses.length}</Badge>
          <Badge variant="default">Períodos: {filteredPeriods.length}</Badge>
        </div>
      </div>

      {fetchErrors.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-900">Algumas fontes não carregaram</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-800">
            {fetchErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {!hasAnyResult ? (
        <EmptyState
          title="Nenhum resultado para os filtros aplicados"
          description="Ajuste os filtros para visualizar os vínculos da estrutura acadêmica."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Escolas da Instituição</h3>
            <ul className="mt-3 space-y-2">
              {filteredSchools.slice(0, 12).map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-100 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.location}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Unidades da Escola</h3>
            <ul className="mt-3 space-y-2">
              {filteredUnits.slice(0, 12).map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-100 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.code} {'-'} {schoolById.get(item.schoolId)?.name ?? '-'}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Cursos da Unidade</h3>
            <ul className="mt-3 space-y-2">
              {filteredCourses.slice(0, 12).map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-100 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{item.program_name}</p>
                  <p className="text-xs text-slate-500">
                    {unitById.get(item.unitId)?.name ?? '-'} {'-'} {item.duration}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Turmas do Curso</h3>
            <ul className="mt-3 space-y-2">
              {filteredClasses.slice(0, 12).map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-100 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    {item.code} {'-'} {courseById.get(item.courseId)?.program_name ?? '-'}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 xl:col-span-2">
            <h3 className="text-sm font-semibold text-slate-900">Períodos da Turma</h3>
            <ul className="mt-3 grid gap-2 md:grid-cols-2">
              {filteredPeriods.slice(0, 20).map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-100 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{formatDateRange(item.startDate, item.endDate)}</p>
                  <p className="text-xs text-slate-400">
                    {classById.get(item.classGroupId)?.name ?? '-'} {'>'} {courseById.get(classById.get(item.classGroupId)?.courseId ?? '')?.program_name ?? '-'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
