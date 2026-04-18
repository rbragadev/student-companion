import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { EnrollmentMessageService } from './enrollment-message.service';
import { CreateEnrollmentMessageDto } from './dto/create-enrollment-message.dto';

@Controller('enrollment-messages')
export class EnrollmentMessageController {
  constructor(private readonly enrollmentMessageService: EnrollmentMessageService) {}

  @Get()
  findAll(
    @Query('enrollmentId') enrollmentId?: string,
    @Query('studentId') studentId?: string,
    @Query('channel') channel?: string,
  ) {
    return this.enrollmentMessageService.findAll({ enrollmentId, studentId, channel });
  }

  @Get('unread-count')
  unreadCount(@Query('studentId') studentId: string) {
    return this.enrollmentMessageService.unreadCountByStudent(studentId);
  }

  @Post()
  create(@Body() dto: CreateEnrollmentMessageDto) {
    return this.enrollmentMessageService.create(dto);
  }

  @Patch('read')
  markRead(
    @Query('enrollmentId') enrollmentId: string,
    @Query('userId') userId: string,
  ) {
    return this.enrollmentMessageService.markRead(enrollmentId, userId);
  }
}
