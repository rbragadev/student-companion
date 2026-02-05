import { Injectable } from '@nestjs/common';
import { Place, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class PlaceRatingRule extends BaseScoringRule<Place, UserPreferences> {
  constructor() {
    super('PlaceRating', 0.5);
  }

  calculate(context: ScoringContext<Place, UserPreferences>): number {
    const rating = context.entity.rating ? Number(context.entity.rating) : 2.5;
    return this.normalize((rating / 5) * 100);
  }
}