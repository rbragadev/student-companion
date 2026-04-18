'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { FilterBar } from '@/components/filters/filter-bar';
import type { CourseAdmin, SchoolAdmin } from '@/types/catalog.types';
import type { Unit } from '@/types/structure.types';

interface CoursesViewProps {
  courses: CourseAdmin[];
  schools: SchoolAdmin[];
  units: Unit[];
}

export function CoursesView({ courses, schools, units }: Readonly<CoursesViewProps>) {
  const [search, setSearch] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [unitFilter, setUnitFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [periodTypeFilter, setPeriodTypeFilter] = useState('');

  const institutions = useMemo(() => {
    const map = new Map<string, string>();
    schools.forEach((school) => {
      if (school.institution?.id && school.institution?.name) {
        map.set(school.institution.id, school.institution.name);
      }
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [schools]);

  const filteredSchools = useMemo(
    () => schools.filter((school) => !institutionFilter || school.institutionId === institutionFilter),
    [schools, institutionFilter],
  );

  const filteredUnits = useMemo(
    () => units.filter((unit) => !schoolFilter || unit.schoolId === schoolFilter),
    [units, schoolFilter],
  );

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return courses.filter((course) => {
      const institutionMatch =
        !institutionFilter || course.school?.institution?.id === institutionFilter;
      const schoolMatch = !schoolFilter || course.school?.id === schoolFilter;
      const unitMatch = !unitFilter || course.unitId === unitFilter;
      const statusMatch =
        !statusFilter ||
        (statusFilter === 'active' ? course.is_active : !course.is_active);
      const periodTypeMatch = !periodTypeFilter || course.period_type === periodTypeFilter;
      const searchMatch =
        !normalizedSearch ||
        course.program_name.toLowerCase().includes(normalizedSearch) ||
        (course.school?.name ?? '').toLowerCase().includes(normalizedSearch) ||
        (course.unit?.name ?? '').toLowerCase().includes(normalizedSearch);

      return (
        institutionMatch &&
        schoolMatch &&
        unitMatch &&
        statusMatch &&
        periodTypeMatch &&
        searchMatch
      );
    });
  }, [courses, institutionFilter, schoolFilter, unitFilter, statusFilter, periodTypeFilter, search]);

  const columns: Column<CourseAdmin>[] = [
    {
      key: 'program_name',
      label: 'Curso',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.program_name}</p>
          <p className="text-xs text-slate-500">
            {item.school?.institution?.name ?? '-'} {'>'} {item.school?.name ?? '-'} {'>'}{' '}
            {item.unit?.name ?? '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'offerType',
      label: 'Oferta',
      render: (item) => (item.period_type === 'weekly' ? 'Semanal' : 'Fixa'),
    },
    {
      key: 'duration',
      label: 'Duração',
    },
    {
      key: 'price',
      label: 'Preço',
      render: (item) =>
        item.price_in_cents
          ? `$${(item.price_in_cents / 100).toFixed(0)}/${item.price_unit ?? 'unit'}`
          : '-',
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge variant={item.is_active ? 'success' : 'default'}>
          {item.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por curso, escola ou unidade"
        filters={[
          {
            key: 'institution',
            label: 'Instituição',
            value: institutionFilter,
            onChange: (value) => {
              setInstitutionFilter(value);
              setSchoolFilter('');
              setUnitFilter('');
            },
            options: institutions.map((item) => ({ label: item.name, value: item.id })),
          },
          {
            key: 'school',
            label: 'Escola',
            value: schoolFilter,
            onChange: (value) => {
              setSchoolFilter(value);
              setUnitFilter('');
            },
            options: filteredSchools.map((school) => ({ label: school.name, value: school.id })),
          },
          {
            key: 'unit',
            label: 'Unidade',
            value: unitFilter,
            onChange: setUnitFilter,
            options: filteredUnits.map((unit) => ({ label: unit.name, value: unit.id })),
          },
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Ativo', value: 'active' },
              { label: 'Inativo', value: 'inactive' },
            ],
          },
          {
            key: 'periodType',
            label: 'Tipo de oferta',
            value: periodTypeFilter,
            onChange: setPeriodTypeFilter,
            options: [
              { label: 'Semanal', value: 'weekly' },
              { label: 'Fixa', value: 'fixed' },
            ],
          },
        ]}
      />

      <DataTable<CourseAdmin>
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/courses/${item.id}`}
        emptyTitle="Nenhum curso encontrado"
        emptyDescription="Ajuste os filtros para visualizar cursos no contexto desejado."
      />
    </div>
  );
}
