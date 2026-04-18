import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAdminProfileDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
