import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateEnrollmentMessageDto {
  @IsUUID()
  enrollmentId!: string;

  @IsUUID()
  senderId!: string;

  @IsString()
  @MaxLength(2000)
  message!: string;
}
