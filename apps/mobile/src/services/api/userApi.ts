/**
 * User API Service
 * All user-related API endpoints
 */

import { UserProfile } from '../../types/user.types';
import { apiClient } from './client';


export const userApi = {
  /**
   * Get user profile by ID
   */
  getProfile: async (userId: string): Promise<UserProfile> => {
    const { data } = await apiClient.get(`/users/${userId}`);
    return data;
  },

  /**
   * Update user profile
   * TODO: Implement when backend endpoint is ready
   */
  // updateProfile: async (userId: string, payload: Partial<UserProfile>): Promise<UserProfile> => {
  //   const { data } = await apiClient.patch(`/users/${userId}`, payload);
  //   return data;
  // },

  /**
   * Create user
   * TODO: Implement when backend endpoint is ready
   */
  // createUser: async (payload: Omit<UserProfile, 'id'>): Promise<UserProfile> => {
  //   const { data } = await apiClient.post('/users', payload);
  //   return data;
  // },
};
