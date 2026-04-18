import { Controller, Get, Param, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('enrollments')
export class EnrollmentCheckoutController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get(':id/checkout')
  getCheckout(@Param('id') id: string) {
    return this.paymentService.getCheckout(id);
  }

  @Post(':id/checkout')
  initializeCheckout(@Param('id') id: string) {
    return this.paymentService.initializeCheckout(id);
  }

  @Post(':id/checkout/pay-fake')
  confirmFakeDownPayment(@Param('id') id: string) {
    return this.paymentService.confirmFakeDownPayment(id);
  }
}

