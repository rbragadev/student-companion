import { Injectable } from '@nestjs/common';
import { Accommodation, UserPreferences } from '@prisma/client';
import { BaseScoringRule } from '../base-scoring.rule';
import { ScoringContext } from '../../interfaces/scoring-rule.interface';

@Injectable()
export class AccommodationTypePreferenceRule extends BaseScoringRule<Accommodation, UserPreferences> {
  constructor() {
    super('AccommodationTypePreference', 0.1);
  }

  calculate(context: ScoringContext<Accommodation, UserPreferences>): number {
    const preferredTypes = context.userPreferences.preferredAccommodationTypes || [];
    
    if (preferredTypes.length === 0) {
      return 50; // Neutro se não houver preferência
    }

    const isPreferred = preferredTypes.includes(
      context.entity.accommodationType,
    );

    return isPreferred ? 100 : 30;
  }
}