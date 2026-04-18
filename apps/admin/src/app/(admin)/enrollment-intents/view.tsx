'use client';

import { useMemo, useState } from 'react';
import { FilterBar } from '@/components/filters/filter-bar';
import { DataTable, type Column } from '@/components/ui/data-table';
import type { EnrollmentIntentAdmin, SchoolAdmin } from '@/types/catalog.types';
import type { Institution } from '@/types/structure.types';

interface EnrollmentIntentsViewProps {
  intents: EnrollmentIntentAdmin[];
  institutions: Institution[];
  schools: SchoolAdmin[];
}

const STATUS_LABEL: Record<EnrollmentIntentAdmin['student']['studentStatus'], string> = {
  lead: 'Lead',
  application_started: 'Application Started',
  pending_enrollment: 'Pending Enrollment',
  enrolled: 'Enrolled',
};

export function EnrollmentIntentsView({
  intents,
  institutions,
  schools,
}: Readonly<EnrollmentIntentsViewProps>) {
  const [statusFilter, setStatusFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');

  const filteredSchools = useMemo(
    () => schools.filter((school) => !institutionFilter || school.institutionId === institutionFilter),
    [schools, institutionFilter],
  );

  const filtered = useMemo(() => {
    return intents.filter((intent) => {
      const school = intent.course.school;
      const statusMatch = !statusFilter || intent.student.studentStatus === statusFilter;
      const institutionMatch = !institutionFilter || school?.institution?.id === institutionFilter;
      const schoolMatch = !schoolFilter || school?.id === schoolFilter;
      return statusMatch && institutionMatch && schoolMatch;
    });
  }, [intents, statusFilter, institutionFilter, schoolFilter]);

  const columns: Column<EnrollmentIntentAdmin>[] = [
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
      key: 'course',
      label: 'Curso',
      render: (item) => item.course.program_name,
    },
    {
      key: 'classGroup',
      label: 'Turma',
      render: (item) => `${item.classGroup.name} (${item.classGroup.code})`,
    },
    {
      key: 'period',
      label: 'Período',
      render: (item) => item.academicPeriod.name,
    },
    {
      key: 'school',
      label: 'Escola/Instituição',
      render: (item) => `${item.course.school?.institution?.name ?? '-'} > ${item.course.school?.name ?? '-'}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => STATUS_LABEL[item.student.studentStatus],
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Lead', value: 'lead' },
              { label: 'Application Started', value: 'application_started' },
              { label: 'Pending Enrollment', value: 'pending_enrollment' },
              { label: 'Enrolled', value: 'enrolled' },
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
            options: institutions.map((institution) => ({
              label: institution.name,
              value: institution.id,
            })),
          },
          {
            key: 'school',
            label: 'Escola',
            value: schoolFilter,
            onChange: setSchoolFilter,
            options: filteredSchools.map((school) => ({
              label: school.name,
              value: school.id,
            })),
          },
        ]}
      />

      <DataTable<EnrollmentIntentAdmin>
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/enrollment-intents/${item.id}`}
        emptyTitle="Nenhuma intenção de matrícula encontrada"
        emptyDescription="As intenções criadas no app serão listadas aqui."
      />
    </div>
  );
}
