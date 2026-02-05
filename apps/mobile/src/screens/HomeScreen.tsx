import React from 'react';
import { View, ScrollView } from 'react-native';
import {
  Screen,
  Text,
  HomeHeader,
  HeroCard,
  RecommendationCard,
  SecondaryAction,
} from '../components';
import { useHeroContent } from '../services/mockData';
import { useRecommendations } from '../hooks/api/useRecommendations';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootTabParamList, RootStackParamList, TabRoutes, StackRoutes } from '../types/navigation';
import { useUserProfile } from '../hooks/api/useUserProfile';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, typeof TabRoutes.HOME>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useUserProfile('a8ee8202-7adb-48d9-a2c7-6a03ffc75b48');
  const { content: heroContent, loading: heroLoading } = useHeroContent();

  // Usando API real de recomendações (accommodations)
  const { data: recommendations = [], isLoading: recsLoading } = useRecommendations(
    'a8ee8202-7adb-48d9-a2c7-6a03ffc75b48',
    'accommodation',
    10,
  );

  if (userLoading || heroLoading || recsLoading) {
    return (
      <Screen safeArea={true} padding="lg">
        <Text variant="body">Carregando...</Text>
      </Screen>
    );
  }

  if (userError) {
    return (
      <Screen safeArea={true} padding="lg">
        <Text variant="body">Erro ao carregar perfil: {userError.message}</Text>
      </Screen>
    );
  }

  if (!user || !heroContent) {
    return (
      <Screen safeArea={true} padding="lg">
        <Text variant="body">Dados não disponíveis</Text>
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
    navigation.navigate(StackRoutes.PROFILE);
  };

  const handleHeroCtaPress = () => {
    // Navega para o Copilot com intent de accommodation
    navigation.navigate(TabRoutes.COPILOT, { intent: heroContent.ctaIntent });
  };

  const handleRecommendationPress = (
    id: string,
    type: 'accommodation' | 'course' | 'place' | 'school',
  ) => {
    if (type === 'accommodation') {
      navigation.navigate(StackRoutes.ACCOMMODATION_DETAIL, { accommodationId: id });
    } else if (type === 'course') {
      navigation.navigate(StackRoutes.COURSE_DETAIL, { courseId: id });
    } else if (type === 'place') {
      navigation.navigate(StackRoutes.PLACE_DETAIL, { placeId: id });
    } else if (type === 'school') {
      // Schools ainda não têm tela de detalhe, navega para a tab de cursos
      navigation.navigate(TabRoutes.COURSES);
    }
  };

  const handleBrowseAccommodations = () => {
    navigation.navigate(TabRoutes.ACCOMMODATION);
  };

  const handleBrowseCourses = () => {
    navigation.navigate(TabRoutes.COURSES);
  };

  return (
    <Screen safeArea={true} padding="lg" gap="lg">
      <HomeHeader
        firstName={user.firstName}
        lastName={user.lastName}
        destinationCity={user.preferences.destinationCity}
        purpose={user.preferences.purpose}
        avatarUrl={user.avatar}
        hasUnreadNotifications={user.preferences.hasUnreadNotifications}
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

      {/* Recomendações */}
      {recommendations.length > 0 && (
        <View className="gap-3 mt-4">
          <Text variant="h3" className="text-lg font-semibold">
            Recommended for you
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-6 px-6"
            contentContainerStyle={{ gap: 12 }}
          >
            {recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                id={rec.id}
                type={rec.type}
                title={rec.title}
                image={rec.image}
                badge={rec.badge}
                location={rec.location}
                price={rec.price}
                priceUnit={rec.priceUnit}
                rating={rec.rating}
                score={rec.score}
                features={rec.features}
                distance={rec.distance}
                onPress={() => handleRecommendationPress(rec.id, rec.type)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Ações Secundárias */}
      <View className="gap-3 mt-2">
        <Text variant="h3" className="mt-4">
          Or explore other options
        </Text>

        <View className="flex-row gap-3">
          <SecondaryAction
            icon="home-outline"
            label="Browse accommodations"
            onPress={handleBrowseAccommodations}
          />

          <SecondaryAction
            icon="school-outline"
            label="Browse courses"
            onPress={handleBrowseCourses}
          />
        </View>
      </View>
    </Screen>
  );
}
