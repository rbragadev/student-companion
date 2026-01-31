import React from 'react';
import { View, ScrollView } from 'react-native';
import { Screen, Text, Card, HomeHeader, HeroCard, RecommendationCard, SecondaryAction } from '../components';
import { useUserProfile, useHeroContent, useRecommendations } from '../services/mockData';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootTabParamList } from '../types/navigation';

type HomeScreenNavigationProp = BottomTabNavigationProp<RootTabParamList, 'Home'>;

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
    console.log('Avatar pressed');
    // TODO: Navegar para perfil
  };

  const handleHeroCtaPress = () => {
    // Navega para o Copilot com intent de accommodation
    navigation.navigate('Copilot', { intent: heroContent.ctaIntent });
  };

  const handleRecommendationPress = (id: string, type: 'accommodation' | 'course') => {
    console.log('Recommendation pressed:', id, type);
    // TODO: Navegar para detalhes da recomendação
  };

  const handleBrowseAccommodations = () => {
    navigation.navigate('Acomodação');
  };

  const handleBrowseCourses = () => {
    navigation.navigate('Cursos');
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
        <View className="gap-3">
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
        <Text variant="bodySecondary" className="text-sm">
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

      <Card>
        <Text variant="body">Mais conteúdo em breve... 🏠</Text>
      </Card>
    </Screen>
  );
}