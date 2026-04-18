import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { ENROLLMENT_STATUSES } from '../enrollment.constants';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsIn(ENROLLMENT_STATUSES)
  status?: (typeof ENROLLMENT_STATUSES)[number];

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsUUID()
  changedById?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fees?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discounts?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
