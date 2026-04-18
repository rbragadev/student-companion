import { IsIn, IsOptional } from 'class-validator';

export class UpdateInvoiceStatusDto {
  @IsIn(['draft', 'pending', 'paid', 'overdue', 'cancelled'])
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

  @IsOptional()
  reason?: string;
}
