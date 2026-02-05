import { useQuery } from '@tanstack/react-query';
import { recommendationApi } from '../../services/api/recommendationApi';
import { Recommendation as ApiRecommendation } from '../../types/api.types';

/**
 * Interface compatível com os componentes atuais
 * Mantém apenas os campos que o mock tinha
 */
interface ComponentRecommendation {
  id: string;
  type: 'accommodation' | 'course';  // Por enquanto só estes dois tipos
  title: string;
  image: string;
  badge?: string;
  location?: string;
  price?: string;
  priceUnit?: string;
  rating?: number;
  features?: string[];
  distance?: string;
}

/**
 * Transforma dados da API para formato do componente
 * Adiciona valores mock para campos que ainda não existem no banco
 */
const transformToComponentFormat = (apiRec: ApiRecommendation): ComponentRecommendation => {
  // Extrai location do subtitle (ex: "Homestay • $950/month" -> "Homestay")
  const location = apiRec.subtitle.split('•')[0]?.trim();
  
  // Extrai price do subtitle (ex: "Homestay • $950/month" -> "$950")
  const priceMatch = apiRec.subtitle.match(/\$[\d,]+/);
  const price = priceMatch ? priceMatch[0] : undefined;
  
  // Extrai priceUnit do subtitle (ex: "Homestay • $950/month" -> "month")
  const priceUnitMatch = apiRec.subtitle.match(/\/(week|month|day|year)/);
  const priceUnit = priceUnitMatch ? priceUnitMatch[1] : undefined;

  // Extrai rating de forma segura e converte para número
  const ratingRaw = (apiRec.data as any)?.rating;
  const rating = ratingRaw ? parseFloat(ratingRaw) : undefined;
  // Se rating for 0, trata como undefined (sem avaliação ainda)
  const validRating = rating && rating > 0 ? rating : undefined;

  return {
    id: apiRec.id,
    type: apiRec.type as 'accommodation' | 'course',  // Cast para apenas os tipos suportados
    title: apiRec.title,
    image: apiRec.imageUrl,
    badge: apiRec.badge || undefined,
    location,
    price,
    priceUnit,
    rating: validRating,
    
    // TODO: Valores mock - implementar extração real depois
    features: ['🇨🇦', '📚', '1'], // TODO: transformar data.amenities em ícones
    distance: '20 min to school',  // TODO: calcular com Haversine ou pegar de data.distanceToSchool
  };
};

const recommendationQueryKeys = {
  all: (userId: string) => ['recommendations', userId] as const,
  accommodations: (userId: string, limit: number) => ['recommendations', userId, 'accommodation', limit] as const,
};

/**
 * Hook para buscar recomendações de accommodations da API real
 * Transforma automaticamente para formato compatível com os componentes
 * @param userId - ID do usuário
 * @param limit - Número de resultados (padrão 10)
 */
export const useRecommendations = (userId: string, limit: number = 10) => {
  return useQuery({
    queryKey: recommendationQueryKeys.accommodations(userId, limit),
    queryFn: async () => {
      const apiData = await recommendationApi.getRecommendations(userId, 'accommodation', limit);
      return apiData.map(transformToComponentFormat);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
    retry: 2,
    enabled: !!userId,
    refetchOnWindowFocus: false,
  });
};
