import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateStandaloneAccommodationFinanceItemDto {
  @IsUUID()
  accommodationPricingId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsUUID()
  enrollmentId?: string;

  @IsOptional()
  @IsString()
  title?: string;
}
