'use client';

import { useMemo, useState } from 'react';
import { DataTable, type Column } from '@/components/ui/data-table';
import { FilterBar } from '@/components/filters/filter-bar';
import type { EnrollmentAdmin, SchoolAdmin } from '@/types/catalog.types';
import type { Institution } from '@/types/structure.types';

interface EnrollmentViewProps {
  enrollments: EnrollmentAdmin[];
  institutions: Institution[];
  schools: SchoolAdmin[];
}

export function EnrollmentView({
  enrollments,
  institutions,
  schools,
}: Readonly<EnrollmentViewProps>) {
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [accommodationStatusFilter, setAccommodationStatusFilter] = useState('');

  const filteredSchools = useMemo(
    () => schools.filter((school) => !institutionFilter || school.institutionId === institutionFilter),
    [schools, institutionFilter],
  );

  const filtered = useMemo(() => {
    const search = searchFilter.trim().toLowerCase();
    return enrollments.filter((enrollment) => {
      const statusMatch = !statusFilter || enrollment.status === statusFilter;
      const institutionMatch = !institutionFilter || enrollment.institution.id === institutionFilter;
      const schoolMatch = !schoolFilter || enrollment.school.id === schoolFilter;
      const accommodationStatusMatch =
        !accommodationStatusFilter || enrollment.accommodationStatus === accommodationStatusFilter;
      const searchMatch =
        !search ||
        `${enrollment.student.firstName} ${enrollment.student.lastName}`.toLowerCase().includes(search) ||
        enrollment.student.email.toLowerCase().includes(search) ||
        enrollment.course.program_name.toLowerCase().includes(search);
      return statusMatch && institutionMatch && schoolMatch && accommodationStatusMatch && searchMatch;
    });
  }, [
    enrollments,
    statusFilter,
    institutionFilter,
    schoolFilter,
    accommodationStatusFilter,
    searchFilter,
  ]);

  const columns: Column<EnrollmentAdmin>[] = [
    {
      key: 'student',
      label: 'Aluno',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.student.firstName} {item.student.lastName}</p>
          <p className="text-xs text-slate-500">{item.student.email}</p>
        </div>
      ),
    },
    {
      key: 'chain',
      label: 'Cadeia',
      render: (item) =>
        `${item.institution.name} > ${item.school.name} > ${item.unit.name} > ${item.course.program_name}`,
    },
    {
      key: 'classGroup',
      label: 'Turma/Período',
      render: (item) => `${item.classGroup.name} (${item.classGroup.code}) / ${item.academicPeriod.name}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => item.status,
    },
    {
      key: 'accommodation',
      label: 'Acomodação',
      render: (item) =>
        item.accommodation
          ? `${item.accommodation.title} (${(item.accommodation.priceInCents / 100).toFixed(0)}/${item.accommodation.priceUnit})`
          : 'Sem acomodação',
    },
    {
      key: 'accommodationStatus',
      label: 'Status Acomodação',
      render: (item) => item.accommodationStatus,
    },
    {
      key: 'package',
      label: 'Pacote',
      render: (item) =>
        item.pricing
          ? `${(Number(item.pricing.packageTotalAmount ?? item.pricing.totalAmount) || 0).toFixed(2)} ${item.pricing.currency}`
          : '-',
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        searchValue={searchFilter}
        onSearchChange={setSearchFilter}
        searchPlaceholder="Buscar aluno, e-mail ou curso"
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'application_started', value: 'application_started' },
              { label: 'documents_pending', value: 'documents_pending' },
              { label: 'under_review', value: 'under_review' },
              { label: 'approved', value: 'approved' },
              { label: 'enrolled', value: 'enrolled' },
              { label: 'rejected', value: 'rejected' },
              { label: 'cancelled', value: 'cancelled' },
              { label: 'active (legacy)', value: 'active' },
              { label: 'completed (legacy)', value: 'completed' },
              { label: 'denied (legacy)', value: 'denied' },
            ],
          },
          {
            key: 'accommodationStatus',
            label: 'Status Acomodação',
            value: accommodationStatusFilter,
            onChange: setAccommodationStatusFilter,
            options: [
              { label: 'not_selected', value: 'not_selected' },
              { label: 'selected', value: 'selected' },
              { label: 'approved', value: 'approved' },
              { label: 'denied', value: 'denied' },
              { label: 'closed', value: 'closed' },
            ],
          },
          {
            key: 'institution',
            label: 'Instituição',
            value: institutionFilter,
            onChange: (value) => {
              setInstitutionFilter(value);
              setSchoolFilter('');
            },
            options: institutions.map((institution) => ({ label: institution.name, value: institution.id })),
          },
          {
            key: 'school',
            label: 'Escola',
            value: schoolFilter,
            onChange: setSchoolFilter,
            options: filteredSchools.map((school) => ({ label: school.name, value: school.id })),
          },
        ]}
      />

      <DataTable<EnrollmentAdmin>
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/enrollments/${item.id}`}
        emptyTitle="Nenhuma matrícula encontrada"
        emptyDescription="Matrículas confirmadas aparecerão aqui."
      />
    </div>
  );
}
