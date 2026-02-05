import { UserPreferences } from '@prisma/client';
import { 
  ScoringRule, 
  ScoringContext, 
  RecommendableEntity 
} from '../interfaces/scoring-rule.interface';

export abstract class BaseScoringRule<
  TEntity extends RecommendableEntity = RecommendableEntity,
  TPreferences extends UserPreferences = UserPreferences,
> implements ScoringRule<TEntity, TPreferences> {
  constructor(
    public readonly name: string,
    public readonly weight: number,
  ) {}

  abstract calculate(context: ScoringContext<TEntity, TPreferences>): number;

  /**
   * Por padrão, todas entidades são elegíveis
   * Override apenas em regras que precisam filtrar
   */
  isEligible(context: ScoringContext<TEntity, TPreferences>): boolean {
    return true;
  }

  /**
   * Normaliza score para 0-100
   */
  protected normalize(value: number, min: number = 0, max: number = 100): number {
    return Math.min(max, Math.max(min, value));
  }
}