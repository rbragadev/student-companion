import { IsIn } from 'class-validator';

export class UpdatePaymentStatusDto {
  @IsIn(['pending', 'paid', 'failed', 'cancelled'])
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
}
