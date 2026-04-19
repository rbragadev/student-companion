import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateEnrollmentQuoteItemDto {
  @IsIn(['course', 'accommodation'])
  itemType: 'course' | 'accommodation';

  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @IsOptional()
  @IsUUID()
  coursePricingId?: string;

  @IsOptional()
  @IsUUID()
  accommodationPricingId?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class CreateEnrollmentQuoteDto {
  @IsOptional()
  @IsUUID()
  enrollmentId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEnrollmentQuoteItemDto)
  items?: CreateEnrollmentQuoteItemDto[];

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
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

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
