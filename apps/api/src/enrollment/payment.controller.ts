import { Controller, Get, Param, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  findAll(@Query('enrollmentId') enrollmentId?: string, @Query('studentId') studentId?: string) {
    return this.paymentService.findAll({ enrollmentId, studentId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }
}

