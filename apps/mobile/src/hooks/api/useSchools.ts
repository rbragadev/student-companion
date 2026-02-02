/**
 * School Hooks
 * Uses TanStack Query for data fetching, caching, and synchronization
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { schoolApi } from '../../services/api/schoolApi';
import { School } from '../../types/school.types';

/**
 * Query keys for school-related queries
 * Centralized for easy cache invalidation
 */
export const schoolQueryKeys = {
  all: ['school'] as const,
  list: () => [...schoolQueryKeys.all, 'list'] as const,
  detail: (schoolId: string) => [...schoolQueryKeys.all, 'detail', schoolId] as const,
};

/**
 * Hook to fetch all schools
 * 
 * Features:
 * - Automatic caching (10 minutes)
 * - Auto-refetch on window focus (disabled)
 * - Retry on failure (2 attempts)
 * 
 * @returns Query result with schools array, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data: schools, isLoading, error } = useSchools();
 * 
 * if (isLoading) return <Loading />;
 * if (error) return <Error />;
 * 
 * return schools.map(school => <SchoolCard key={school.id} school={school} />);
 * ```
 */
export const useSchools = (): UseQueryResult<School[], Error> => {
  return useQuery({
    queryKey: schoolQueryKeys.list(),
    queryFn: () => schoolApi.getSchools(),
    
    // Cache options
    staleTime: 10 * 60 * 1000, // 10 minutes - data is considered fresh
    gcTime: 15 * 60 * 1000, // 15 minutes - garbage collection time
    
    // Refetch options
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    
    // Retry options
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook to fetch school by ID
 * 
 * Features:
 * - Automatic caching (10 minutes)
 * - Auto-refetch on window focus (disabled)
 * - Retry on failure (2 attempts)
 * - Only fetches if schoolId is provided
 * 
 * @param schoolId - School ID to fetch
 * @returns Query result with school data, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data: school, isLoading, error } = useSchoolById(schoolId);
 * 
 * if (isLoading) return <Loading />;
 * if (error) return <Error />;
 * 
 * return <Text>{school.name}</Text>;
 * ```
 */
export const useSchoolById = (schoolId: string): UseQueryResult<School, Error> => {
  return useQuery({
    queryKey: schoolQueryKeys.detail(schoolId),
    queryFn: () => schoolApi.getSchoolById(schoolId),
    
    // Cache options
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    
    // Refetch options
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    
    // Retry options
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Only run query if schoolId is provided
    enabled: !!schoolId,
  });
};
