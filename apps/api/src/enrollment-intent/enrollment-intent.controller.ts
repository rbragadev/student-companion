import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EnrollmentIntentService } from './enrollment-intent.service';
import { CreateEnrollmentIntentDto } from './dto/create-enrollment-intent.dto';
import { UpdateEnrollmentIntentDto } from './dto/update-enrollment-intent.dto';
import { UpdateEnrollmentIntentStatusDto } from './dto/update-enrollment-intent-status.dto';
import { SetEnrollmentIntentAccommodationDto } from './dto/set-enrollment-intent-accommodation.dto';

@Controller('enrollment-intents')
export class EnrollmentIntentController {
  constructor(private readonly enrollmentIntentService: EnrollmentIntentService) {}

  @Post()
  create(@Body() dto: CreateEnrollmentIntentDto) {
    return this.enrollmentIntentService.create(dto);
  }

  @Get()
  findAll(
    @Query('studentStatus') studentStatus?: string,
    @Query('institutionId') institutionId?: string,
    @Query('schoolId') schoolId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    return this.enrollmentIntentService.findAll({
      studentStatus,
      institutionId,
      schoolId,
      studentId,
      status,
    });
  }

  @Get('recommended-accommodations')
  findRecommendedAccommodations(
    @Query('courseId') courseId?: string,
    @Query('intentId') intentId?: string,
  ) {
    return this.enrollmentIntentService.findRecommendedAccommodations({
      courseId,
      intentId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentIntentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEnrollmentIntentDto) {
    return this.enrollmentIntentService.update(id, dto);
  }

  @Patch(':id/accommodation')
  setAccommodation(
    @Param('id') id: string,
    @Body() dto: SetEnrollmentIntentAccommodationDto,
  ) {
    return this.enrollmentIntentService.setAccommodation(id, dto.accommodationId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateEnrollmentIntentStatusDto) {
    return this.enrollmentIntentService.updateStatus(id, dto.status, dto.reason);
  }
}
