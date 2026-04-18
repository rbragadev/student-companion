'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { DataTable, type Column } from '@/components/ui/data-table';
import { FilterBar } from '@/components/filters/filter-bar';
import type { AccommodationAdmin, SchoolAdmin } from '@/types/catalog.types';

interface AccommodationsViewProps {
  accommodations: AccommodationAdmin[];
  schools: SchoolAdmin[];
  recommendationScope: Array<{ schoolId: string; accommodationIds: string[] }>;
}

export function AccommodationsView({
  accommodations,
  schools,
  recommendationScope,
}: Readonly<AccommodationsViewProps>) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');
  const [recommendedOnly, setRecommendedOnly] = useState('');

  const scopeMap = useMemo(
    () => new Map(recommendationScope.map((item) => [item.schoolId, new Set(item.accommodationIds)])),
    [recommendationScope],
  );

  const filtered = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();
    return accommodations.filter((item) => {
      const typeMatch = !typeFilter || item.accommodationType === typeFilter;
      const statusMatch =
        !statusFilter || (statusFilter === 'active' ? item.isActive : !item.isActive);
      const schoolSet = schoolFilter ? scopeMap.get(schoolFilter) : null;
      const schoolMatch = !schoolFilter || !!schoolSet?.has(item.id);
      const recommendedMatch =
        !recommendedOnly ||
        (recommendedOnly === 'yes'
          ? [...scopeMap.values()].some((ids) => ids.has(item.id))
          : ![...scopeMap.values()].some((ids) => ids.has(item.id)));
      const searchMatch =
        !searchTerm ||
        item.title.toLowerCase().includes(searchTerm) ||
        item.location.toLowerCase().includes(searchTerm) ||
        item.accommodationType.toLowerCase().includes(searchTerm);

      return typeMatch && statusMatch && schoolMatch && recommendedMatch && searchMatch;
    });
  }, [accommodations, typeFilter, statusFilter, schoolFilter, recommendedOnly, search, scopeMap]);

  const columns: Column<AccommodationAdmin>[] = [
    {
      key: 'title',
      label: 'Acomodação',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-500">
            {item.location} • {item.accommodationType}
          </p>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Preço',
      render: (item) => `$${(item.priceInCents / 100).toFixed(0)}/${item.priceUnit}`,
    },
    {
      key: 'score',
      label: 'Score',
      render: (item) => Number(item.score ?? 0).toFixed(1),
    },
    {
      key: 'scope',
      label: 'Contexto Escola',
      render: (item) => {
        const recommendedSchools = schools
          .filter((school) => scopeMap.get(school.id)?.has(item.id))
          .map((school) => school.name);
        if (!recommendedSchools.length) return 'Sem recomendação';
        return recommendedSchools.slice(0, 2).join(', ') + (recommendedSchools.length > 2 ? '...' : '');
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => (
        <Badge variant={item.isActive ? 'success' : 'default'}>
          {item.isActive ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar acomodação, tipo ou localização"
        filters={[
          {
            key: 'type',
            label: 'Tipo',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [...new Set(accommodations.map((item) => item.accommodationType))]
              .sort()
              .map((value) => ({ label: value, value })),
          },
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Ativa', value: 'active' },
              { label: 'Inativa', value: 'inactive' },
            ],
          },
          {
            key: 'school',
            label: 'Escola (recomendação)',
            value: schoolFilter,
            onChange: setSchoolFilter,
            options: schools.map((school) => ({ label: school.name, value: school.id })),
          },
          {
            key: 'recommended',
            label: 'Recomendação',
            value: recommendedOnly,
            onChange: setRecommendedOnly,
            options: [
              { label: 'Recomendadas em alguma escola', value: 'yes' },
              { label: 'Sem recomendação', value: 'no' },
            ],
          },
        ]}
      />

      <DataTable<AccommodationAdmin>
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        getRowHref={(item) => `/accommodations/${item.id}`}
        emptyTitle="Nenhuma acomodação encontrada"
        emptyDescription="Ajuste os filtros para visualizar acomodações no contexto correto."
      />
    </div>
  );
}
