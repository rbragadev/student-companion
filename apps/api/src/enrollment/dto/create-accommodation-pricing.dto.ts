import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAccommodationPricingDto {
  @IsUUID()
  accommodationId!: string;

  @IsString()
  @MaxLength(120)
  periodOption!: string;

  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerDay?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minimumStayDays?: number;

  @IsOptional()
  @IsDateString()
  windowStartDate?: string;

  @IsOptional()
  @IsDateString()
  windowEndDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
