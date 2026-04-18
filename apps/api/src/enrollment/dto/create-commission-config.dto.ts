import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { COMMISSION_SCOPE_TYPES } from '../enrollment.constants';

export class CreateCommissionConfigDto {
  @IsIn(COMMISSION_SCOPE_TYPES)
  scopeType!: (typeof COMMISSION_SCOPE_TYPES)[number];

  @IsUUID()
  scopeId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fixedAmount?: number;
}
