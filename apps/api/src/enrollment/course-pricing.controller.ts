import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CoursePricingService } from './course-pricing.service';
import { CreateCoursePricingDto } from './dto/create-course-pricing.dto';
import { UpdateCoursePricingDto } from './dto/update-course-pricing.dto';

@Controller('course-pricing')
export class CoursePricingController {
  constructor(private readonly coursePricingService: CoursePricingService) {}

  @Post()
  create(@Body() dto: CreateCoursePricingDto) {
    return this.coursePricingService.create(dto);
  }

  @Get()
  findAll(
    @Query('courseId') courseId?: string,
    @Query('academicPeriodId') academicPeriodId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.coursePricingService.findAll({ courseId, academicPeriodId, isActive });
  }

  @Get('resolve')
  resolve(
    @Query('courseId') courseId: string,
    @Query('academicPeriodId') academicPeriodId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.coursePricingService.resolvePrice(courseId, academicPeriodId, {
      startDate,
      endDate,
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCoursePricingDto) {
    return this.coursePricingService.update(id, dto);
  }
}
