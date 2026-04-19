/**
 * User API Service
 * All user-related API endpoints
 */

import {
  UserPreferenceOptions,
  UserPreferences,
  UserProfile,
  UpdateUserPreferencesPayload,
} from '../../types/user.types';
import { apiClient } from './client';


export const userApi = {
  /**
   * Get user profile by ID
   */
  getProfile: async (userId: string): Promise<UserProfile> => {
    const { data } = await apiClient.get(`/users/${userId}`);
    return data;
  },

  getPreferences: async (userId: string): Promise<UserPreferences> => {
    const { data } = await apiClient.get(`/user-preferences?userId=${userId}`);
    return data as UserPreferences;
  },

  updatePreferences: async (
    userId: string,
    payload: UpdateUserPreferencesPayload,
  ): Promise<UserPreferences> => {
    const { data } = await apiClient.patch(`/user-preferences?userId=${userId}`, payload);
    return data as UserPreferences;
  },

  getPreferenceOptions: async (): Promise<UserPreferenceOptions> => {
    const { data } = await apiClient.get('/preferences/options');
    return data as UserPreferenceOptions;
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
