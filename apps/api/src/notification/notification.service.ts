import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type Notification } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: params.metadata,
      },
    });
    await this.syncUserPreferenceNotificationState(params.userId);
    return notification;
  }

  async listByUser(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markAsRead(id: string, userId?: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true, readAt: true },
    });
    if (!notification) {
      throw new NotFoundException(`Notificação ${id} não encontrada`);
    }
    if (userId && notification.userId !== userId) {
      throw new NotFoundException(`Notificação ${id} não encontrada para o usuário informado`);
    }

    if (notification.readAt) {
      return this.prisma.notification.findUnique({ where: { id } });
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
    await this.syncUserPreferenceNotificationState(notification.userId);
    return updated;
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    await this.syncUserPreferenceNotificationState(userId);
    return { success: true };
  }

  async syncUserPreferenceNotificationState(userId: string) {
    const unreadCount = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });

    const currentPrefs = await this.prisma.userPreferences.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!currentPrefs) return;

    await this.prisma.userPreferences.update({
      where: { userId },
      data: {
        notificationCount: unreadCount,
        hasUnreadNotifications: unreadCount > 0,
      },
    });
  }
}

