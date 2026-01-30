import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';

interface HomeHeaderProps {
  firstName: string;
  destination: {
    city: string;
    country: string;
  };
  purpose: string;
  avatarUrl: string;
  hasUnreadNotifications?: boolean;
  onSettingsPress?: () => void;
  onNotificationsPress?: () => void;
  onAvatarPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  firstName,
  destination,
  purpose,
  avatarUrl,
  hasUnreadNotifications = false,
  onSettingsPress,
  onNotificationsPress,
  onAvatarPress,
}) => {
  return (
    <View className="gap-4">
      {/* Top Bar - Avatar e Ícones */}
      <View className="flex-row items-center justify-between">
        {/* Avatar */}
        <TouchableOpacity 
          onPress={onAvatarPress}
          className="w-12 h-12 rounded-full overflow-hidden bg-surface"
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: avatarUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </TouchableOpacity>

        {/* Ícones de Ação */}
        <View className="flex-row items-center gap-3">
          {/* Notificações */}
          <TouchableOpacity
            onPress={onNotificationsPress}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface relative"
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={22} color="#212529" />
            {hasUnreadNotifications && (
              <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
            )}
          </TouchableOpacity>

          {/* Configurações */}
          <TouchableOpacity
            onPress={onSettingsPress}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface"
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={22} color="#212529" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mensagem de Boas-Vindas */}
      <View className="gap-2">
        <Text variant="h1" className="text-3xl">
          Hi, {firstName} 👋
        </Text>
        
        <Text variant="h3" className="font-normal text-textPrimary">
          Moving to {destination.city} to {purpose}?
        </Text>
        
        <Text variant="bodySecondary" className="mt-1 leading-relaxed">
          Let's help you choose the right place to live and study.
        </Text>
      </View>
    </View>
  );
};
