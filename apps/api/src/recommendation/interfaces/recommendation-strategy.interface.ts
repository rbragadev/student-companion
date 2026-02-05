import { UserPreferences } from '@prisma/client';
import { ScoringRule, RecommendableEntity } from './scoring-rule.interface';

export interface Recommendation {
  id: string;
  type: 'accommodation' | 'course' | 'place' | 'school';
  title: string;
  subtitle?: string;
  location: string;
  score: number;
  badge?: string;
  imageUrl: string;
  data: RecommendableEntity;
}

export interface RecommendationStrategy {
  /**
   * Busca as entidades do banco de dados
   */
  fetchEntities(userPreferences: UserPreferences): Promise<RecommendableEntity[]>;

  /**
   * Retorna as regras de scoring para este tipo
   */
  getScoringRules(): ScoringRule[];

  /**
   * Transforma a entidade em um objeto Recommendation
   */
  mapToRecommendation(entity: RecommendableEntity, score: number): Recommendation;
}
