import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Card, Screen, Text } from '../components';
import { RootStackParamList, StackRoutes } from '../types/navigation';
import { colorValues } from '../utils/design-tokens';
import { notificationApi } from '../services/api/notificationApi';
import { useAuth } from '../contexts/AuthContext';
import type { NotificationItem } from '../types/enrollment.types';
import { userQueryKeys } from '../hooks/api/useUserProfile';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function NotificationsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const notificationsQuery = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => notificationApi.listByUser(userId ?? ''),
    enabled: !!userId,
  });

  const markReadMutation = useMutation({
    mutationFn: async (notification: NotificationItem) => {
      if (!userId) return;
      await notificationApi.markAsRead(notification.id, userId);
      return notification;
    },
    onSuccess: async (notification) => {
      if (!notification || !userId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
        queryClient.invalidateQueries({ queryKey: userQueryKeys.profile(userId) }),
      ]);
      const enrollmentId = notification.metadata?.enrollmentId;
      if (typeof enrollmentId === 'string' && enrollmentId.length > 0) {
        navigation.navigate(StackRoutes.ENROLLMENT_DETAIL, { enrollmentId });
      }
    },
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      await notificationApi.markAllAsRead(userId);
    },
    onSuccess: async () => {
      if (!userId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['notifications', userId] }),
        queryClient.invalidateQueries({ queryKey: userQueryKeys.profile(userId) }),
      ]);
    },
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  return (
    <Screen safeArea={true} scrollable={true}>
      <View className="px-4 py-4 gap-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          className="flex-row items-center gap-2"
        >
          <Ionicons name="arrow-back" size={22} color={colorValues.textPrimary} />
          <Text variant="body" className="font-medium">Voltar</Text>
        </TouchableOpacity>

        <View>
          <Text variant="h2" className="font-semibold">Notificações</Text>
          <Text variant="caption" className="mt-1">
            Acompanhe aprovações de proposta, pagamento e próximos passos.
          </Text>
        </View>

        <Card>
          <View className="flex-row items-center justify-between">
            <Text variant="body" className="font-medium">Não lidas: {unreadCount}</Text>
            <Button
              variant="outline"
              onPress={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending || unreadCount === 0}
            >
              Marcar tudo como lida
            </Button>
          </View>
        </Card>

        {notificationsQuery.isLoading && (
          <Text variant="body">Carregando notificações...</Text>
        )}

        {notificationsQuery.isError && (
          <Card className="border-red-200 bg-red-50">
            <Text variant="caption" className="text-red-700">
              Não foi possível carregar notificações.
            </Text>
            <Button className="mt-3" onPress={() => notificationsQuery.refetch()}>
              Tentar novamente
            </Button>
          </Card>
        )}

        {!notificationsQuery.isLoading && notifications.length === 0 && (
          <Card>
            <Text variant="caption">Nenhuma notificação no momento.</Text>
          </Card>
        )}

        <View className="gap-2 pb-4">
          {notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              activeOpacity={0.8}
              onPress={() => markReadMutation.mutate(notification)}
            >
              <Card className={notification.readAt ? 'opacity-70' : 'border-primary-200'}>
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1">
                    <Text variant="body" className="font-medium">{notification.title}</Text>
                    <Text variant="caption" className="mt-1">{notification.message}</Text>
                    <Text variant="caption" className="mt-2 text-textSecondary">
                      {formatDate(notification.createdAt)}
                    </Text>
                  </View>
                  {!notification.readAt && (
                    <View className="rounded-full bg-primary-500 px-2 py-1">
                      <Text variant="caption" className="text-white">Nova</Text>
                    </View>
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Screen>
  );
}
