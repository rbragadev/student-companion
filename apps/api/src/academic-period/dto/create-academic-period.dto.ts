import { RecordStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { IsDate, IsEnum, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

function parseDateOnly(value: unknown): Date {
  if (!(typeof value === 'string')) {
    return new Date(Number.NaN);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map((part) => Number(part));
    if (!year || !month || !day) return new Date(Number.NaN);
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  }

  const parsed = new Date(value);
  return parsed;
}

export class CreateAcademicPeriodDto {
  @IsUUID()
  classGroupId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @Transform(({ value }) => parseDateOnly(value))
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Transform(({ value }) => parseDateOnly(value))
  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsEnum(RecordStatus)
  status: RecordStatus;
}
