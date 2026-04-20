import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsIn(['course', 'accommodation'])
  itemType: 'course' | 'accommodation';

  @IsUUID()
  referenceId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionAmount?: number;

  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  accommodationId?: string;
}

export class CreateOrderDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsUUID()
  enrollmentId?: string;

  @IsOptional()
  @IsUUID()
  enrollmentQuoteId?: string;

  @IsIn(['course', 'accommodation', 'package'])
  type: 'course' | 'accommodation' | 'package';

  @IsOptional()
  @IsString()
  status?: string;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  courseAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accommodationAmount?: number;

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
  downPaymentPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  downPaymentAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionPercentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionCourseAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionAccommodationAmount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
