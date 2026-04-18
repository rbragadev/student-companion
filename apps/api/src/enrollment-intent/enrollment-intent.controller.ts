import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EnrollmentIntentService } from './enrollment-intent.service';
import { CreateEnrollmentIntentDto } from './dto/create-enrollment-intent.dto';
import { UpdateEnrollmentIntentDto } from './dto/update-enrollment-intent.dto';

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentIntentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEnrollmentIntentDto) {
    return this.enrollmentIntentService.update(id, dto);
  }
}
