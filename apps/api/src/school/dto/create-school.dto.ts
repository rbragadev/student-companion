import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsEmail,
  MaxLength,
} from 'class-validator';

export class CreateSchoolDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  location: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  @MaxLength(500)
  website?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @IsUrl()
  @IsOptional()
  @MaxLength(500)
  logo?: string;

  @IsBoolean()
  @IsOptional()
  isPartner?: boolean;
}
