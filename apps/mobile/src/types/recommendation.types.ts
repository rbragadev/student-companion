import { Accommodation } from './accommodation.types';
import { Course } from './course.types';
import { Place } from './place.types';
import { School } from './school.types';

/**
 * Interface de Recomendação ALINHADA COM A API
 * Corresponde ao formato retornado por GET /recommendation/:userId
 */
export interface Recommendation {
  id: string;
  type: 'accommodation' | 'course' | 'place' | 'school';
  title: string;
  subtitle: string; // Gerado pela strategy (ex: "Vancouver • $950/month")
  location: string; // Campo extra para facilitar exibição (ex: "Vancouver")
  score: number; // Score de recomendação (0-100)
  badge: string; // Badge da entidade (ex: "Top Trip", "Partner")
  imageUrl: string; // URL da imagem principal
  data: RecommendationData; // Dados completos da entidade
}

/**
 * Dados completos de uma entidade recomendada
 * Pode ser Accommodation, Course, Place ou School
 */
export type RecommendationData = Accommodation | Course | Place | School;
