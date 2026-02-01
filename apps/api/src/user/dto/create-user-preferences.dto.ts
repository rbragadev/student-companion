import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsArray,
  IsBoolean,
  IsDateString,
} from 'class-validator';

/**
 * DTO for creating user preferences
 */
export class CreateUserPreferencesDto {
  @IsString()
  @IsNotEmpty()
  destinationCity: string;

  @IsString()
  @IsNotEmpty()
  destinationCountry: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  budgetAccommodationMin?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  budgetAccommodationMax?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  budgetCourseMin?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  budgetCourseMax?: number;

  @IsString()
  @IsNotEmpty()
  purpose: string;

  @IsString()
  @IsOptional()
  englishLevel?: string;

  @IsDateString()
  @IsOptional()
  arrivalDate?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredAccommodationTypes?: string[];

  @IsInt()
  @Min(0)
  @IsOptional()
  maxDistanceToSchool?: number;

  @IsBoolean()
  @IsOptional()
  hasUnreadNotifications?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  notificationCount?: number;
}
