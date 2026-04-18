import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';

export class CreateInvoiceDto {
  @IsOptional()
  @IsUUID()
  enrollmentId?: string;

  @IsOptional()
  @IsUUID()
  enrollmentQuoteId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsIn(['draft', 'pending'])
  status?: 'draft' | 'pending';
}
