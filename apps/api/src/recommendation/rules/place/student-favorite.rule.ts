import { Injectable } from '@nestjs/common';
import { Place, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class PlaceStudentFavoriteRule extends BaseScoringRule<Place, UserPreferences> {
  constructor() {
    super('PlaceStudentFavorite', 0.3);
  }

  calculate(context: ScoringContext<Place, UserPreferences>): number {
    return context.entity.isStudentFavorite ? 100 : 40;
  }
}