import { Injectable } from '@nestjs/common';
import { Accommodation, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class AccommodationRatingRule extends BaseScoringRule<Accommodation, UserPreferences> {
  constructor() {
    super('AccommodationRating', 0.25);
  }

  calculate(context: ScoringContext<Accommodation, UserPreferences>): number {
    const rating = context.entity.rating ? Number(context.entity.rating) : 2.5;
    return this.normalize((rating / 5) * 100);
  }
}