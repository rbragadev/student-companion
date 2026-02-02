import { apiClient } from './client';
import type { Review } from '../../types/review.types';

export const reviewApi = {
  getReviewsByUser: async (userId: string): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>(`/review/user/${userId}`);
    return response.data;
  },

  getReviewsByReviewable: async (
    reviewableType: string,
    reviewableId: string
  ): Promise<Review[]> => {
    const response = await apiClient.get<Review[]>('/review', {
      params: {
        reviewableType,
        reviewableId,
      },
    });
    return response.data;
  },

  getReviewById: async (reviewId: string): Promise<Review> => {
    const response = await apiClient.get<Review>(`/review/${reviewId}`);
    return response.data;
  },
};
