/**
 * School API Service
 * All school-related API endpoints
 */

import { School } from '../../types/school.types';
import { apiClient } from './client';
import { mapSchoolPayload } from './mappers/catalogMappers';

export const schoolApi = {
  /**
   * Get all schools
   */
  getSchools: async (): Promise<School[]> => {
    const { data } = await apiClient.get('/school');
    return Array.isArray(data) ? data.map(mapSchoolPayload) : [];
  },

  /**
   * Get school by ID
   */
  getSchoolById: async (schoolId: string): Promise<School> => {
    const { data } = await apiClient.get(`/school/${schoolId}`);
    return mapSchoolPayload(data);
  },
};
