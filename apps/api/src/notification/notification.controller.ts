import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  listByUser(
    @Query('userId') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    return this.notificationService.listByUser(userId, unreadOnly === 'true');
  }

  @Get('unread-count')
  unreadCount(@Query('userId') userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.notificationService.markAsRead(id, userId);
  }

  @Patch('read-all')
  markAllAsRead(@Query('userId') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }
}

