import { Controller, Get, Query, Param } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { GetRecommendationsDto } from './dto/get-recommendation.dto';

@Controller('recommendation')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get(':userId/mixed')
  async getMixedRecommendations(
    @Param('userId') userId: string,
    @Query('limit') limit?: number,
  ) {
    return this.recommendationService.getMixedRecommendations(
      userId,
      limit ?? 10,
    );
  }

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