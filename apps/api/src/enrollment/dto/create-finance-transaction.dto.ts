import { IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class CreateFinanceTransactionDto {
  @IsNumber()
  @IsPositive()
  installmentAmount: number;

  @IsInt()
  @Min(1)
  installments: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dueDateOffsetDays?: number;
}
