import React from 'react';
import { View, ScrollView } from 'react-native';
import { Screen, Text, HomeHeader, HeroCard, RecommendationCard, SecondaryAction } from '../components';
import { useUserProfile, useHeroContent, useRecommendations } from '../services/mockData';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootTabParamList, RootStackParamList, TabRoutes, StackRoutes } from '../types/navigation';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<RootTabParamList, typeof TabRoutes.HOME>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, loading: userLoading } = useUserProfile();
  const { content: heroContent, loading: heroLoading } = useHeroContent();
  const { recommendations, loading: recsLoading } = useRecommendations();

  if (userLoading || heroLoading || recsLoading || !user || !heroContent) {
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
    navigation.navigate(StackRoutes.PROFILE);
  };

  const handleHeroCtaPress = () => {
    // Navega para o Copilot com intent de accommodation
    navigation.navigate(TabRoutes.COPILOT, { intent: heroContent.ctaIntent });
  };

  const handleRecommendationPress = (id: string, type: 'accommodation' | 'course') => {
    if (type === 'accommodation') {
      navigation.navigate(StackRoutes.ACCOMMODATION_DETAIL, { accommodationId: id });
    } else {
      console.log('Course detail not implemented yet:', id);
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