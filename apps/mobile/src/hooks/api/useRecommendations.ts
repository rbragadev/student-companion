import { dataTagErrorSymbol, useQuery } from '@tanstack/react-query';
import { recommendationApi, RecommendationType } from '../../services/api/recommendationApi';
import { Recommendation as ApiRecommendation } from '../../types/recommendation.types';
import { extractPriceFromSubtitle } from '../../utils/formatters';
import { Place } from '../../types/place.types';
import { Accommodation } from '../../types/accommodation.types';

/**
 * Interface compatível com os componentes atuais
 * Mantém apenas os campos que o mock tinha
 */
interface ComponentRecommendation {
  id: string;
  type: 'accommodation' | 'course' | 'place' | 'school';
  title: string;
  subtitle?: string;
  image: string;
  badge?: string;
  location?: string;
  price?: string;
  priceUnit?: string;
  rating?: number;
  score?: number;
  features?: string[];
  distance?: string;
}

/**
 * Transforma dados da API para formato do componente
 * Usa switch para lógica específica por tipo
 */
const transformToComponentFormat = (apiRec: ApiRecommendation): ComponentRecommendation => {
  // Extrai campos comuns usando formatters
  const price = extractPriceFromSubtitle(apiRec.subtitle);

  // Extrai priceUnit do subtitle
  const priceUnitMatch = apiRec.subtitle.match(/\/(week|month|day|year)/);
  const priceUnit = priceUnitMatch ? priceUnitMatch[1] : undefined;

  // Rating: garante conversão para number (Prisma Decimal pode vir como string)
  const ratingRaw = (apiRec.data as any)?.rating;
  const ratingNumber = typeof ratingRaw === 'string' ? parseFloat(ratingRaw) : ratingRaw;
  const validRating = ratingNumber && ratingNumber > 0 ? ratingNumber : undefined;

  // Base comum para todos os tipos
  const baseRecommendation = {
    id: apiRec.id,
    type: apiRec.type,
    title: apiRec.title,
    subtitle: apiRec.subtitle,
    image: apiRec.imageUrl,
    badge: apiRec.badge || undefined,
    location: apiRec.location,
    price,
    priceUnit,
    rating: validRating,
    score: apiRec.score,
  };

  // Lógica específica por tipo
  switch (apiRec.type) {
    case 'accommodation':
      const accomData = apiRec.data as Accommodation;
      return {
        ...baseRecommendation,
        // TODO: Extrair de data.amenities quando disponível
        features: ['🇨🇦', '📚', '1'],
        // TODO: Calcular com Haversine usando data.latitude/longitude
        distance: '20 min to school',
      };

    case 'course':
      return {
        ...baseRecommendation,
        // TODO: Extrair data.weeklyHours, data.duration, data.school.name
        features: ['🇨🇦', '📚', '10'],
        // TODO: Usar data.school.location para calcular distância
        distance: '20 min to school',
      };

    case 'place': {
      const placeData = apiRec.data as Place;
      return {
        ...baseRecommendation,
        price: placeData.priceRange || undefined,
        features: ['⭐', '🎉'],
        distance: undefined, // Places não precisam de distância para escola
      };
    }

    case 'school':
      return {
        ...baseRecommendation,
        // TODO: Extrair data._count.courses, isPartner
        features: ['🎓', '🌟'],
        distance: undefined, // Schools são o destino, não precisam de distância
      };

    default:
      return {
        ...baseRecommendation,
        features: [],
        distance: undefined,
      };
  }
};

const recommendationQueryKeys = {
  all: (userId: string) => ['recommendations', userId] as const,
  recommendations: (userId: string, type: RecommendationType, limit: number) =>
    ['recommendations', userId, type, limit] as const,
};

/**
 * Hook para buscar recomendações de accommodations da API real
 * Transforma automaticamente para formato compatível com os componentes
 * @param userId - ID do usuário
 * @param limit - Número de resultados (padrão 10)
 */
export const useRecommendations = (
  userId: string,
  type: RecommendationType,
  limit: number = 10,
) => {
  return useQuery({
    queryKey: recommendationQueryKeys.recommendations(userId, type, limit),
    queryFn: async () => {
      const apiData = await recommendationApi.getRecommendations(userId, type, limit);
      return apiData.map(transformToComponentFormat);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });
};
