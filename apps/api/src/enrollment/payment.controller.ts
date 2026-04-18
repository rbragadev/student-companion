import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  findAll(
    @Query('enrollmentId') enrollmentId?: string,
    @Query('studentId') studentId?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('institutionId') institutionId?: string,
    @Query('status') status?: string,
  ) {
    return this.paymentService.findAll({
      enrollmentId,
      studentId,
      invoiceId,
      institutionId,
      status,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentService.createManual(dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.paymentService.updateStatus(id, dto);
  }
}
