/**
 * Course Hooks
 * Uses TanStack Query for data fetching, caching, and synchronization
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { courseApi } from '../../services/api/courseApi';
import { Course } from '../../types/course.types';

/**
 * Query keys for course-related queries
 * Centralized for easy cache invalidation
 */
export const courseQueryKeys = {
  all: ['course'] as const,
  list: () => [...courseQueryKeys.all, 'list'] as const,
  detail: (courseId: string) => [...courseQueryKeys.all, 'detail', courseId] as const,
};

/**
 * Hook to fetch all courses
 * 
 * Features:
 * - Automatic caching (10 minutes)
 * - Auto-refetch on window focus (disabled)
 * - Retry on failure (2 attempts)
 * - Returns courses ordered by rating (backend handles this)
 * 
 * @returns Query result with courses array, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data: courses, isLoading, error } = useCourses();
 * 
 * if (isLoading) return <Loading />;
 * if (error) return <Error />;
 * 
 * return courses.map(course => <CourseCard key={course.id} course={course} />);
 * ```
 */
export const useCourses = (): UseQueryResult<Course[], Error> => {
  return useQuery({
    queryKey: courseQueryKeys.list(),
    queryFn: () => courseApi.getCourses(),
    
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
 * Hook to fetch course by ID
 * 
 * Features:
 * - Automatic caching (10 minutes)
 * - Auto-refetch on window focus (disabled)
 * - Retry on failure (2 attempts)
 * - Only fetches if courseId is provided
 * - Includes school data in response
 * 
 * @param courseId - Course ID to fetch
 * @returns Query result with course data, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data: course, isLoading, error } = useCourseById(courseId);
 * 
 * if (isLoading) return <Loading />;
 * if (error) return <Error />;
 * 
 * return (
 *   <View>
 *     <Text>{course.programName}</Text>
 *     <Text>{course.school?.name}</Text>
 *   </View>
 * );
 * ```
 */
export const useCourseById = (courseId: string): UseQueryResult<Course, Error> => {
  return useQuery({
    queryKey: courseQueryKeys.detail(courseId),
    queryFn: () => courseApi.getCourseById(courseId),
    
    // Cache options
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    
    // Refetch options
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    
    // Retry options
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Only run query if courseId is provided
    enabled: !!courseId,
  });
};
