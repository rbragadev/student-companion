import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ENROLLMENT_DOCUMENT_STATUSES } from '../enrollment.constants';

export class CreateEnrollmentDocumentDto {
  @IsUUID()
  enrollmentId!: string;

  @IsString()
  @MaxLength(100)
  type!: string;

  @IsString()
  fileUrl!: string;

  @IsOptional()
  @IsIn(ENROLLMENT_DOCUMENT_STATUSES)
  status?: (typeof ENROLLMENT_DOCUMENT_STATUSES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}
