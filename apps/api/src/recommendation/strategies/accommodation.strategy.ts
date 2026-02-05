import { Injectable } from '@nestjs/common';
import { Accommodation, UserPreferences } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RecommendationStrategy,
  Recommendation,
} from '../interfaces/recommendation-strategy.interface';
import { ScoringRule, RecommendableEntity } from '../interfaces/scoring-rule.interface';
import { AccommodationBudgetRule } from '../rules/accommodation/budget.rule';
import { AccommodationRatingRule } from '../rules/accommodation/rating.rule';
import { AccommodationDistanceRule } from '../rules/accommodation/distance.rule';
import { AccommodationTypePreferenceRule } from '../rules/accommodation/type-preference.rule';
import { AccommodationBonusRule } from '../rules/accommodation/bonus.rule';

@Injectable()
export class AccommodationStrategy implements RecommendationStrategy {
  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetRule: AccommodationBudgetRule,
    private readonly ratingRule: AccommodationRatingRule,
    private readonly distanceRule: AccommodationDistanceRule,
    private readonly typePreferenceRule: AccommodationTypePreferenceRule,
    private readonly bonusRule: AccommodationBonusRule,
  ) {}

  async fetchEntities(userPreferences: UserPreferences): Promise<Accommodation[]> {
    return this.prisma.accommodation.findMany();
  }

  getScoringRules(): ScoringRule[] {
    return [
      this.budgetRule,
      this.ratingRule,
      this.distanceRule,
      this.typePreferenceRule,
      this.bonusRule,
    ];
  }

  mapToRecommendation(entity: RecommendableEntity, score: number): Recommendation {
    const accommodation = entity as Accommodation;
    
    // Usa o primeiro badge do array de badges
    const badge = accommodation.badges?.[0] || '';

    return {
      id: accommodation.id,
      type: 'accommodation',
      title: accommodation.title,
      subtitle: `${accommodation.accommodationType} • $${(accommodation.priceInCents / 100).toFixed(0)}/${accommodation.priceUnit}`,
      score: Math.round(score * 10) / 10,
      badge,
      imageUrl: accommodation.images?.[0] || 'https://via.placeholder.com/150',
      data: accommodation,
    };
  }
}