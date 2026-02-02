import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  IsArray,
  IsBoolean,
  IsNumber,
  IsIn,
  MaxLength,
  IsUrl,
} from 'class-validator';

export class CreateAccommodationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Homestay', 'Shared', 'Studio', 'Apartment'])
  accommodationType: string;

  @IsInt()
  @Min(0)
  priceInCents: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(['day', 'week', 'month'])
  priceUnit: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  location: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  areaHint?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rules?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  image: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  images?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  ratingCleanliness?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  ratingLocation?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  ratingCommunication?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  ratingValue?: number;

  @IsString()
  @IsOptional()
  goodFor?: string;

  @IsBoolean()
  @IsOptional()
  isPartner?: boolean;

  @IsBoolean()
  @IsOptional()
  isTopTrip?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  hostName?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  hostAvatar?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
