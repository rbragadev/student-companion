import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsNumber, IsIn, Min, Max, IsObject } from 'class-validator';

export class CreatePlaceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['bars', 'restaurants', 'cafes', 'parks', 'museums', 'shopping', 'nightlife', 'sports'])
  category: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  neighborhood?: string;

  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsBoolean()
  @IsOptional()
  isStudentFavorite?: boolean;

  @IsBoolean()
  @IsOptional()
  hasDeal?: boolean;

  @IsString()
  @IsOptional()
  dealDescription?: string;

  @IsString()
  @IsOptional()
  @IsIn(['$', '$$', '$$$', '$$$$'])
  priceRange?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  hours?: Record<string, string>;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];
}
