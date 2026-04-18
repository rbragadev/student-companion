import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @IsOptional()
  @IsUUID()
  enrollmentId?: string;

  @IsOptional()
  @IsUUID()
  enrollmentQuoteId?: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsIn(['down_payment', 'balance'])
  type?: 'down_payment' | 'balance';

  @IsOptional()
  @IsIn(['pending', 'paid', 'failed', 'cancelled'])
  status?: 'pending' | 'paid' | 'failed' | 'cancelled';

  @IsOptional()
  @IsString()
  provider?: string;
}
