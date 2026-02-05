import { Controller, Get, Query, Param } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { GetRecommendationsDto } from './dto/get-recommendation.dto';

@Controller('recommendation')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get(':userId')
  async getRecommendations(
    @Param('userId') userId: string,
    @Query() query: GetRecommendationsDto,
  ) {
    return this.recommendationService.getRecommendations(
      userId,
      query.type,
      query.limit ?? 10,
    );
  }
}