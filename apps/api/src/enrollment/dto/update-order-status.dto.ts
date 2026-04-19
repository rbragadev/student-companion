import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsIn(['pending', 'partially_paid', 'paid', 'failed', 'cancelled'])
  paymentStatus?: 'pending' | 'partially_paid' | 'paid' | 'failed' | 'cancelled';
}

