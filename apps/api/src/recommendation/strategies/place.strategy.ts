import { Injectable } from '@nestjs/common';
import { Place, UserPreferences } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RecommendationStrategy,
  Recommendation,
} from '../interfaces/recommendation-strategy.interface';
import { ScoringRule, RecommendableEntity } from '../interfaces/scoring-rule.interface';
import { PlaceRatingRule } from '../rules/place/rating.rule';
import { PlaceStudentFavoriteRule } from '../rules/place/student-favorite.rule';
import { PlaceDealRule } from '../rules/place/deal.rule';

@Injectable()
export class PlaceStrategy implements RecommendationStrategy {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ratingRule: PlaceRatingRule,
    private readonly studentFavoriteRule: PlaceStudentFavoriteRule,
    private readonly dealRule: PlaceDealRule,
  ) {}

  async fetchEntities(userPreferences: UserPreferences): Promise<Place[]> {
    return this.prisma.place.findMany();
  }

  getScoringRules(): ScoringRule[] {
    return [this.ratingRule, this.studentFavoriteRule, this.dealRule];
  }

  mapToRecommendation(entity: RecommendableEntity, score: number): Recommendation {
    const place = entity as Place;

    // Usa o primeiro badge do array de badges
    const badge = place.badges?.[0] || '';

    const subtitle = `${place.location || 'Unknown'}`;

    return {
      id: place.id,
      type: 'place',
      title: place.name,
      subtitle,
      location: place.location || 'Unknown',
      score: Math.round(score * 10) / 10,
      badge,
      imageUrl: place.images?.[0] || 'https://via.placeholder.com/150',
      data: place,
    };
  }
}
