import { RecordStatus, Shift } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';

export class CreateClassGroupDto {
  @IsUUID()
  courseId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  code: string;

  @IsEnum(Shift)
  shift: Shift;

  @IsEnum(RecordStatus)
  status: RecordStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;
}
