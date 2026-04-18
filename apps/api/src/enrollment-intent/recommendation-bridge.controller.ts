import { Controller, Get, Query } from '@nestjs/common';
import { EnrollmentIntentService } from './enrollment-intent.service';

@Controller('recommendations')
export class RecommendationBridgeController {
  constructor(private readonly enrollmentIntentService: EnrollmentIntentService) {}

  @Get('accommodations')
  findAccommodationRecommendations(
    @Query('courseId') courseId?: string,
    @Query('intentId') intentId?: string,
  ) {
    return this.enrollmentIntentService.findRecommendedAccommodations({
      courseId,
      intentId,
    });
  }
}
