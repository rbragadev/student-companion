import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { EnrollmentQuoteService } from './enrollment-quote.service';
import { CreateEnrollmentQuoteDto } from './dto/create-enrollment-quote.dto';

@Controller('quotes')
export class EnrollmentQuoteController {
  constructor(private readonly enrollmentQuoteService: EnrollmentQuoteService) {}

  @Post()
  create(@Body() dto: CreateEnrollmentQuoteDto) {
    return this.enrollmentQuoteService.create(dto);
  }

  @Get('by-intent/:intentId')
  findByIntent(@Param('intentId') intentId: string) {
    return this.enrollmentQuoteService.findByIntent(intentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enrollmentQuoteService.findOne(id);
  }
}
