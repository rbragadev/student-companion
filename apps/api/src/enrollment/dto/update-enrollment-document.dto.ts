import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ENROLLMENT_DOCUMENT_STATUSES } from '../enrollment.constants';

export class UpdateEnrollmentDocumentDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsOptional()
  @IsIn(ENROLLMENT_DOCUMENT_STATUSES)
  status?: (typeof ENROLLMENT_DOCUMENT_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}
