/**
 * Course API Service
 * All course-related API endpoints
 */

import { Course } from '../../types/course.types';
import { apiClient } from './client';
import { mapCoursePayload } from './mappers/catalogMappers';

export const courseApi = {
  /**
   * Get all courses
   */
  getCourses: async (): Promise<Course[]> => {
    const { data } = await apiClient.get('/course');
    return Array.isArray(data) ? data.map(mapCoursePayload) : [];
  },

  /**
   * Get course by ID
   */
  getCourseById: async (courseId: string): Promise<Course> => {
    const { data } = await apiClient.get(`/course/${courseId}`);
    return mapCoursePayload(data);
  },
};
