import { RecordStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateAcademicPeriodDto {
  @IsUUID()
  classGroupId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsEnum(RecordStatus)
  status: RecordStatus;
}
