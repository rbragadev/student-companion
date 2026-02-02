import { useQuery } from '@tanstack/react-query';
import { reviewApi } from '../../services/api/reviewApi';

const reviewQueryKeys = {
  byUser: (userId: string) => ['reviews', 'user', userId] as const,
  byReviewable: (reviewableType: string, reviewableId: string) =>
    ['reviews', 'reviewable', reviewableType, reviewableId] as const,
  detail: (reviewId: string) => ['reviews', 'detail', reviewId] as const,
};

export const useReviewsByUser = (userId: string) => {
  return useQuery({
    queryKey: reviewQueryKeys.byUser(userId),
    queryFn: () => reviewApi.getReviewsByUser(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const useReviewsByReviewable = (
  reviewableType: string,
  reviewableId: string
) => {
  return useQuery({
    queryKey: reviewQueryKeys.byReviewable(reviewableType, reviewableId),
    queryFn: () => reviewApi.getReviewsByReviewable(reviewableType, reviewableId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const useReviewById = (reviewId: string) => {
  return useQuery({
    queryKey: reviewQueryKeys.detail(reviewId),
    queryFn: () => reviewApi.getReviewById(reviewId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
