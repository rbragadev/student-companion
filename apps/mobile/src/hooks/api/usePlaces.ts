import { useQuery } from '@tanstack/react-query';
import { placeApi } from '../../services/api/placeApi';

const placeQueryKeys = {
  all: ['places'] as const,
  list: (category?: string) => [...placeQueryKeys.all, 'list', category] as const,
  detail: (id: string) => [...placeQueryKeys.all, 'detail', id] as const,
};

export const usePlaces = (category?: string) => {
  return useQuery({
    queryKey: placeQueryKeys.list(category),
    queryFn: () => placeApi.getPlaces(category),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
  });
};

export const usePlaceById = (id: string) => {
  return useQuery({
    queryKey: placeQueryKeys.detail(id),
    queryFn: () => placeApi.getPlaceById(id),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    enabled: !!id,
  });
};
