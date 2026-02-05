import { apiClient } from './client';
import { Recommendation } from '../../types/api.types';

/**
 * Tipos de recomendação disponíveis
 */
export type RecommendationType = 'accommodation' | 'course' | 'place' | 'school';

/**
 * API Service para Recomendações
 */
export const recommendationApi = {
  /**
   * Busca recomendações de um tipo específico
   * @param userId - ID do usuário
   * @param type - Tipo de recomendação (accommodation, course, place, school)
   * @param limit - Número máximo de resultados (1-50, padrão 10)
   * @returns Array de recomendações ordenadas por score
   */
  getRecommendations: async (
    userId: string,
    type: RecommendationType,
    limit: number = 10,
  ): Promise<Recommendation[]> => {
    const response = await apiClient.get<Recommendation[]>(
      `/recommendation/${userId}`,
      {
        params: { type, limit },
      },
    );

    return response.data;
  },

  /**
   * Busca recomendações de todos os tipos misturadas
   * Retorna os melhores items independente do tipo, ordenados por score
   * @param userId - ID do usuário
   * @param limit - Número máximo de resultados (1-50, padrão 10)
   * @returns Array de recomendações mistas ordenadas por score
   */
  getMixedRecommendations: async (
    userId: string,
    limit: number = 10,
  ): Promise<Recommendation[]> => {
    const response = await apiClient.get<Recommendation[]>(
      `/recommendation/${userId}/mixed`,
      {
        params: { limit },
      },
    );

    return response.data;
  },

  /**
   * Busca apenas accommodations
   * Atalho para getRecommendations com type='accommodation'
   */
  getAccommodations: async (userId: string, limit: number = 20) => {
    return recommendationApi.getRecommendations(userId, 'accommodation', limit);
  },

  /**
   * Busca apenas courses
   * Atalho para getRecommendations com type='course'
   */
  getCourses: async (userId: string, limit: number = 20) => {
    return recommendationApi.getRecommendations(userId, 'course', limit);
  },

  /**
   * Busca apenas places
   * Atalho para getRecommendations com type='place'
   */
  getPlaces: async (userId: string, limit: number = 20) => {
    return recommendationApi.getRecommendations(userId, 'place', limit);
  },

  /**
   * Busca apenas schools
   * Atalho para getRecommendations com type='school'
   */
  getSchools: async (userId: string, limit: number = 20) => {
    return recommendationApi.getRecommendations(userId, 'school', limit);
  },
};
