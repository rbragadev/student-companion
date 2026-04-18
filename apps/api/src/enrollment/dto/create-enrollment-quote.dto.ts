import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CreateEnrollmentQuoteDto {
  @IsOptional()
  @IsUUID()
  enrollmentIntentId?: string;

  @IsOptional()
  @IsUUID()
  coursePricingId?: string;

  @IsOptional()
  @IsUUID()
  accommodationPricingId?: string;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  academicPeriodId?: string;

  @IsOptional()
  @IsUUID()
  accommodationId?: string;

  @IsOptional()
  periodOption?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fees?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discounts?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  downPaymentPercentage?: number;
}
