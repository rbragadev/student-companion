import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { ENROLLMENT_MESSAGE_CHANNELS } from '../enrollment.constants';

export class CreateEnrollmentMessageDto {
  @IsUUID()
  enrollmentId!: string;

  @IsUUID()
  senderId!: string;

  @IsString()
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsIn(ENROLLMENT_MESSAGE_CHANNELS)
  channel?: (typeof ENROLLMENT_MESSAGE_CHANNELS)[number];
}
