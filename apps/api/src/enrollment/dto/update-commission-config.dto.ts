import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { COMMISSION_SCOPE_TYPES } from '../enrollment.constants';

export class UpdateCommissionConfigDto {
  @IsOptional()
  @IsIn(COMMISSION_SCOPE_TYPES)
  scopeType?: (typeof COMMISSION_SCOPE_TYPES)[number];

  @IsOptional()
  @IsUUID()
  scopeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fixedAmount?: number;
}
