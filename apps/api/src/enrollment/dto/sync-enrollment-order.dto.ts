import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class SyncEnrollmentOrderDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  downPaymentPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  downPaymentAmount?: number;
}
