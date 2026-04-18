import { useQuery } from '@tanstack/react-query';
import { accommodationApi } from '../../services/api/accommodationApi';

const accommodationQueryKeys = {
  list: () => ['accommodations'] as const,
  detail: (accommodationId: string) => ['accommodations', 'detail', accommodationId] as const,
  recommendedBySchool: (schoolId: string) => ['accommodations', 'recommended-school', schoolId] as const,
  upsellByEnrollment: (enrollmentId: string) => ['accommodations', 'upsell-enrollment', enrollmentId] as const,
};

export const useAccommodations = () => {
  return useQuery({
    queryKey: accommodationQueryKeys.list(),
    queryFn: () => accommodationApi.getAccommodations(),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const useAccommodationById = (accommodationId: string) => {
  return useQuery({
    queryKey: accommodationQueryKeys.detail(accommodationId),
    queryFn: () => accommodationApi.getAccommodationById(accommodationId),
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const useRecommendedAccommodationsBySchool = (schoolId?: string) => {
  return useQuery({
    queryKey: accommodationQueryKeys.recommendedBySchool(schoolId ?? ''),
    queryFn: () => accommodationApi.getRecommendedBySchool(schoolId ?? ''),
    enabled: !!schoolId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const useUpsellAccommodationsByEnrollment = (enrollmentId?: string) => {
  return useQuery({
    queryKey: accommodationQueryKeys.upsellByEnrollment(enrollmentId ?? ''),
    queryFn: () => accommodationApi.getUpsellByEnrollment(enrollmentId ?? ''),
    enabled: !!enrollmentId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
