import { Injectable } from '@nestjs/common';
import { RecommendationStrategy } from '../interfaces/recommendation-strategy.interface';
import { AccommodationStrategy } from '../strategies/accommodation.strategy';
import { CourseStrategy } from '../strategies/course.strategy';
import { PlaceStrategy } from '../strategies/place.strategy';
import { RecommendationType } from '../dto/get-recommendation.dto';

@Injectable()
export class StrategyFactory {
  constructor(
    private readonly accommodationStrategy: AccommodationStrategy,
    private readonly courseStrategy: CourseStrategy,
    private readonly placeStrategy: PlaceStrategy,
  ) {}

  getStrategy(type: RecommendationType): RecommendationStrategy {
    switch (type) {
      case RecommendationType.ACCOMMODATION:
        return this.accommodationStrategy;
      case RecommendationType.COURSE:
        return this.courseStrategy;
      case RecommendationType.PLACE:
        return this.placeStrategy;
      default:
        throw new Error(`Unknown recommendation type: ${type}`);
    }
  }
}