import type { NotificationItem } from '../../types/enrollment.types';
import { apiClient } from './client';

export const notificationApi = {
  listByUser: async (userId: string, unreadOnly = false): Promise<NotificationItem[]> => {
    const { data } = await apiClient.get(
      `/notifications?userId=${userId}&unreadOnly=${unreadOnly ? 'true' : 'false'}`,
    );
    return Array.isArray(data) ? (data as NotificationItem[]) : [];
  },

  getUnreadCount: async (userId: string): Promise<number> => {
    const { data } = await apiClient.get(`/notifications/unread-count?userId=${userId}`);
    return typeof data?.count === 'number' ? data.count : 0;
  },

  markAsRead: async (notificationId: string, userId: string): Promise<NotificationItem> => {
    const { data } = await apiClient.patch(`/notifications/${notificationId}/read?userId=${userId}`);
    return data as NotificationItem;
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    await apiClient.patch(`/notifications/read-all?userId=${userId}`);
  },
};

