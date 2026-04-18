import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';

@Controller('enrollments')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post('from-intent/:intentId')
  createFromIntent(@Param('intentId') intentId: string) {
    return this.enrollmentService.createFromIntent(intentId);
  }

  @Get()
  findAll(
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
    @Query('institutionId') institutionId?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.enrollmentService.findAll({
      studentId,
      status,
      institutionId,
      schoolId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentService.findOne(id);
  }
}
