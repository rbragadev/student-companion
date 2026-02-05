import { Accommodation, Course, Place, School, UserPreferences } from '@prisma/client';

/**
 * União de tipos de entidades suportadas para recomendação
 */
export type RecommendableEntity = Accommodation | Course | Place | School;

/**
 * Contexto genérico para cálculo de scoring
 * @template TEntity - Tipo da entidade sendo avaliada
 * @template TPreferences - Tipo das preferências do usuário
 */
export interface ScoringContext<
  TEntity extends RecommendableEntity = RecommendableEntity,
  TPreferences extends UserPreferences = UserPreferences,
> {
  entity: TEntity;
  userPreferences: TPreferences;
  additionalData?: Record<string, unknown>;
}

/**
 * Interface para regras de scoring
 * @template TEntity - Tipo da entidade sendo avaliada
 * @template TPreferences - Tipo das preferências do usuário
 */
export interface ScoringRule<
  TEntity extends RecommendableEntity = RecommendableEntity,
  TPreferences extends UserPreferences = UserPreferences,
> {
  /**
   * Nome da regra para debugging
   */
  readonly name: string;

  /**
   * Peso da regra no cálculo final (0-1)
   */
  readonly weight: number;

  /**
   * Calcula o score (0-100) baseado na regra
   */
  calculate(context: ScoringContext<TEntity, TPreferences>): number;

  /**
   * Verifica se a entidade é elegível segundo esta regra
   * Retorna true se passar, false se deve ser excluída
   */
  isEligible(context: ScoringContext<TEntity, TPreferences>): boolean;
}