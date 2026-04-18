import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class UpdateAccommodationPricingDto {
  @IsOptional()
  @IsUUID()
  accommodationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  periodOption?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
