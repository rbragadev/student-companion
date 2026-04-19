import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { EnrollmentQuoteService } from './enrollment-quote.service';
import { CreateEnrollmentQuoteDto } from './dto/create-enrollment-quote.dto';
import { UpdateEnrollmentQuoteDto } from './dto/update-enrollment-quote.dto';

@Controller('quotes')
export class EnrollmentQuoteController {
  constructor(private readonly enrollmentQuoteService: EnrollmentQuoteService) {}

  @Post()
  create(@Body() dto: CreateEnrollmentQuoteDto) {
    return this.enrollmentQuoteService.create(dto);
  }

  @Patch(':id/recalculate')
  recalculate(@Param('id') id: string, @Body() dto: UpdateEnrollmentQuoteDto) {
    return this.enrollmentQuoteService.recalculate(id, dto);
  }

  @Delete(':id/items/:itemId')
  removeItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.enrollmentQuoteService.removeItem(id, itemId);
  }

  @Get()
  findAll(
    @Query('type') type?: string,
    @Query('enrollmentIntentId') enrollmentIntentId?: string,
    @Query('accommodationId') accommodationId?: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.enrollmentQuoteService.findAll({
      type,
      enrollmentIntentId,
      accommodationId,
      courseId,
    });
  }

  @Get('by-intent/:intentId')
  findByIntent(@Param('intentId') intentId: string) {
    return this.enrollmentQuoteService.findByIntent(intentId);
  }

  @Get('by-enrollment/:enrollmentId')
  findByEnrollment(@Param('enrollmentId') enrollmentId: string) {
    return this.enrollmentQuoteService.findByEnrollment(enrollmentId);
  }

  @Get('current/:studentId')
  findCurrentByStudent(@Param('studentId') studentId: string) {
    return this.enrollmentQuoteService.findCurrentByStudent(studentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentQuoteService.findOne(id);
  }
}
