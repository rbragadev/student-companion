import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

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

  @Get('active')
  findActive(@Query('studentId') studentId: string) {
    return this.enrollmentService.findActiveByStudent(studentId);
  }

  @Get('journey/:studentId')
  getStudentJourney(@Param('studentId') studentId: string) {
    return this.enrollmentService.getStudentJourney(studentId);
  }

  @Get(':id/timeline')
  getTimeline(@Param('id') id: string) {
    return this.enrollmentService.getTimeline(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEnrollmentDto) {
    return this.enrollmentService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateEnrollmentStatusDto) {
    return this.enrollmentService.updateStatus(id, dto.status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentService.findOne(id);
  }
}
