'use client';

import { useMemo, useState } from 'react';
import type { SchoolAdmin } from '@/types/catalog.types';
import type { Unit } from '@/types/structure.types';

interface CourseHierarchyFieldsProps {
  schools: SchoolAdmin[];
  units: Unit[];
  defaultSchoolId?: string;
  defaultUnitId?: string;
  disabled?: boolean;
}

export function CourseHierarchyFields({
  schools,
  units,
  defaultSchoolId,
  defaultUnitId,
  disabled = false,
}: Readonly<CourseHierarchyFieldsProps>) {
  const [selectedSchoolId, setSelectedSchoolId] = useState(defaultSchoolId ?? '');

  const filteredUnits = useMemo(
    () => units.filter((unit) => unit.schoolId === selectedSchoolId),
    [units, selectedSchoolId],
  );

  return (
    <>
      <label className="space-y-1 sm:col-span-2">
        <span className="text-sm font-medium text-slate-700">Escola</span>
        <select
          name="schoolId"
          required
          defaultValue={defaultSchoolId ?? ''}
          disabled={disabled}
          onChange={(event) => setSelectedSchoolId(event.target.value)}
          className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
        >
          <option value="">Selecione</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 sm:col-span-2">
        <span className="text-sm font-medium text-slate-700">Unidade</span>
        <select
          name="unitId"
          required
          defaultValue={defaultUnitId ?? ''}
          disabled={disabled || !selectedSchoolId}
          className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm disabled:bg-slate-100"
        >
          <option value="">Selecione</option>
          {filteredUnits.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name} ({unit.code})
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">
          Selecione a escola para carregar as unidades disponíveis.
        </p>
      </label>
    </>
  );
}
