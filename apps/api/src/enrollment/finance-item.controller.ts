import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { FinanceItemService } from './finance-item.service';
import { CreateFinanceTransactionDto } from './dto/create-finance-transaction.dto';
import { UpdateFinanceTransactionStatusDto } from './dto/update-finance-transaction-status.dto';

@Controller()
export class FinanceItemController {
  constructor(private readonly financeItemService: FinanceItemService) {}

  @Get('enrollments/:id/finance-items')
  listByEnrollment(@Param('id') id: string) {
    return this.financeItemService.listByEnrollment(id);
  }

  @Get('finance-items/:id')
  getById(@Param('id') id: string) {
    return this.financeItemService.getById(id);
  }

  @Post('finance-items/:id/transactions')
  createTransactions(@Param('id') id: string, @Body() dto: CreateFinanceTransactionDto) {
    return this.financeItemService.createTransactions(id, dto);
  }

  @Patch('finance-transactions/:id/status')
  updateTransactionStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFinanceTransactionStatusDto,
  ) {
    return this.financeItemService.updateTransactionStatus(id, dto);
  }
}
