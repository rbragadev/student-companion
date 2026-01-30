import React from 'react';
import { View } from 'react-native';
import { Screen, Text, Card, HomeHeader, HeroCard } from '../components';
import { useUserProfile, useHeroContent } from '../services/mockData';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../types/navigation';

type HomeScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, loading: userLoading } = useUserProfile();
  const { content: heroContent, loading: heroLoading } = useHeroContent();

  if (userLoading || heroLoading || !user || !heroContent) {
    return (
      <Screen safeArea={true} padding="lg">
        <Text variant="body">Carregando...</Text>
      </Screen>
    );
  }

  const handleSettingsPress = () => {
    console.log('Settings pressed');
    // TODO: Navegar para tela de configurações
  };

  const handleNotificationsPress = () => {
    console.log('Notifications pressed');
    // TODO: Navegar para tela de notificações
  };

  const handleAvatarPress = () => {
    console.log('Avatar pressed');
    // TODO: Navegar para perfil
  };

  const handleHeroCtaPress = () => {
    // Navega para o Copilot com intent de accommodation
    navigation.navigate('Copilot', { intent: heroContent.ctaIntent });
  };

  return (
    <Screen safeArea={true} padding="lg" gap="lg">
      <HomeHeader
        firstName={user.firstName}
        destination={user.destination}
        purpose={user.purpose}
        avatarUrl={user.avatar}
        hasUnreadNotifications={user.hasUnreadNotifications}
        onSettingsPress={handleSettingsPress}
        onNotificationsPress={handleNotificationsPress}
        onAvatarPress={handleAvatarPress}
      />

      <HeroCard
        image={heroContent.image}
        title={heroContent.title}
        subtitle={heroContent.subtitle}
        ctaText={heroContent.ctaText}
        onCtaPress={handleHeroCtaPress}
      />

      <Card>
        <Text variant="body">Mais conteúdo em breve... 🏠</Text>
      </Card>
    </Screen>
  );
}