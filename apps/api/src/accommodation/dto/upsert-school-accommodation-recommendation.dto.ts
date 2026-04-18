import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpsertSchoolAccommodationRecommendationDto {
  @IsBoolean()
  @IsOptional()
  isRecommended?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @IsString()
  @MaxLength(80)
  @IsOptional()
  badgeLabel?: string;
}
