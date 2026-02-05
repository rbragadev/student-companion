import { Injectable } from '@nestjs/common';
import { School, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class SchoolRatingRule extends BaseScoringRule<School, UserPreferences> {
  constructor() {
    super('SchoolRating', 0.4);
  }

  calculate(context: ScoringContext<School, UserPreferences>): number {
    // School não tem campo rating no schema atual
    // Retorna score neutro por enquanto
    // TODO: Adicionar campo rating ao schema School ou calcular baseado em reviews
    return 50;
  }
}
