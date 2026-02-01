/**
 * User Profile Hook
 * Uses TanStack Query for data fetching, caching, and synchronization
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { userApi } from '../../services/api/userApi';
import { UserProfile } from '../../types/user.types';


/**
 * Query keys for user-related queries
 * Centralized for easy cache invalidation
 */
export const userQueryKeys = {
  all: ['user'] as const,
  profile: (userId: string) => [...userQueryKeys.all, 'profile', userId] as const,
};

/**
 * Hook to fetch user profile
 * 
 * Features:
 * - Automatic caching (5 minutes)
 * - Auto-refetch on window focus (disabled)
 * - Retry on failure (2 attempts)
 * - Only fetches if userId is provided
 * 
 * @param userId - User ID to fetch
 * @returns Query result with user data, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data: user, isLoading, error, refetch } = useUserProfile('user-123');
 * 
 * if (isLoading) return <Loading />;
 * if (error) return <Error />;
 * 
 * return <Text>{user.firstName}</Text>;
 * ```
 */
export const useUserProfile = (userId: string): UseQueryResult<UserProfile, Error> => {
  return useQuery({
    queryKey: userQueryKeys.profile(userId),
    queryFn: () => userApi.getProfile(userId),
    
    // Cache options
    staleTime: 5 * 60 * 1000, // 5 minutes - data is considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection time (formerly cacheTime)
    
    // Refetch options
    refetchOnWindowFocus: false, // Don't refetch on focus (mobile app)
    refetchOnReconnect: true, // Refetch when reconnecting
    
    // Retry options
    retry: 2, // Retry failed requests 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Only run query if userId is provided
    enabled: !!userId,
  });
};
