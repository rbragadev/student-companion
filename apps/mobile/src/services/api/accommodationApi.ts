import { apiClient } from './client';
import type { Accommodation } from '../../types/accommodation.types';

export const accommodationApi = {
  getAccommodations: async (): Promise<Accommodation[]> => {
    const response = await apiClient.get<Accommodation[]>('/accommodation');
    return response.data;
  },

  getAccommodationById: async (accommodationId: string): Promise<Accommodation> => {
    const response = await apiClient.get<Accommodation>(`/accommodation/${accommodationId}`);
    return response.data;
  },
};
