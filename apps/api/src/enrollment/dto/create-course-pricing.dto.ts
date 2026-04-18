import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateCoursePricingDto {
  @IsUUID()
  courseId!: string;

  @IsUUID()
  academicPeriodId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  duration?: string;

  @IsNumber()
  @Min(0)
  basePrice!: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
