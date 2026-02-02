import { apiClient } from './client';
import { Place } from '../../types/place.types';

export const placeApi = {
  getPlaces: async (category?: string): Promise<Place[]> => {
    const params = category ? { category } : {};
    const response = await apiClient.get<Place[]>('/place', { params });
    return response.data;
  },

  getPlaceById: async (id: string): Promise<Place> => {
    const response = await apiClient.get<Place>(`/place/${id}`);
    return response.data;
  },
};
