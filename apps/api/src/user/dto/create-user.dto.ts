import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

/**
 * DTO for creating a new user
 */
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
