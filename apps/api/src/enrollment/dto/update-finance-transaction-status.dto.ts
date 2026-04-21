import { IsIn } from 'class-validator';

export class UpdateFinanceTransactionStatusDto {
  @IsIn(['pending', 'paid', 'failed', 'cancelled'])
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
}
