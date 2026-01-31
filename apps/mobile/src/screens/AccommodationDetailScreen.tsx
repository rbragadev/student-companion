import React from 'react';
import { View, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, Card, Button } from '../components';
import { getAccommodationDetail, AccommodationDetail } from '../services/mockData';
import { colorValues } from '../utils/design-tokens';
import { RootStackParamList, StackRoutes } from '../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, typeof StackRoutes.ACCOMMODATION_DETAIL>;
type AccommodationDetailRouteProp = RouteProp<RootStackParamList, typeof StackRoutes.ACCOMMODATION_DETAIL>;

export default function AccommodationDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<AccommodationDetailRouteProp>();
  const { accommodationId } = route.params;
  
  const [accommodation, setAccommodation] = React.useState<AccommodationDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  React.useEffect(() => {
    getAccommodationDetail(accommodationId).then(data => {
      setAccommodation(data);
      setLoading(false);
    });
  }, [accommodationId]);

  const handleInterestPress = () => {
    console.log('Navigate to lead form');
    // TODO: Navegar para tela de lead
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  if (loading || !accommodation) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text variant="body" className="text-textSecondary">
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Galeria de Fotos com Header absoluto */}
      <View className="relative">
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentImageIndex(index);
          }}
          scrollEventThrottle={16}
        >
          {accommodation.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={{ width: SCREEN_WIDTH, height: 300 }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {/* Header absoluto */}
        <View className="absolute top-0 left-0 right-0 flex-row items-center justify-between p-4 pt-12">
          <TouchableOpacity
            onPress={handleBackPress}
            activeOpacity={0.7}
            className="bg-white rounded-full p-2 shadow-md"
          >
            <Ionicons name="arrow-back" size={24} color={colorValues.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => console.log('Share')}
            activeOpacity={0.7}
            className="bg-white rounded-full p-2 shadow-md"
          >
            <Ionicons name="share-outline" size={24} color={colorValues.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Indicador de página */}
        <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
          {accommodation.images.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${
                index === currentImageIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 w-2'
              }`}
            />
          ))}
        </View>
      </View>

      {/* Conteúdo scrollável */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Título e Tipo */}
        <View className="px-4 pt-4 gap-3">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text variant="h1" className="text-2xl font-bold mb-1">
                {accommodation.title}
              </Text>
              <Text variant="body" className="text-textSecondary">
                {accommodation.accommodationType}
              </Text>
            </View>

            {accommodation.isPartner && (
              <View className="bg-primary-50 px-3 py-1.5 rounded-lg">
                <Text variant="caption" className="text-primary-500 font-semibold">
                  Parceiro
                </Text>
              </View>
            )}
          </View>

          {/* Localização */}
          <View className="flex-row items-center gap-2">
            <Ionicons name="location" size={20} color={colorValues.primary[500]} />
            <Text variant="body" className="text-textSecondary flex-1">
              {accommodation.location} • {accommodation.areaHint}
            </Text>
          </View>

          {/* Preço */}
          <View className="flex-row items-baseline gap-2">
            <Text variant="h2" className="text-2xl font-bold text-primary-500">
              {accommodation.price}
            </Text>
            <Text variant="body" className="text-textSecondary">
              /{accommodation.priceUnit}
            </Text>
          </View>
        </View>

        {/* Descrição */}
        <View className="px-4 pt-6">
          <Text variant="h2" className="text-lg font-semibold mb-3">
            About this place
          </Text>
          <Text variant="body" className="text-textSecondary leading-relaxed">
            {accommodation.description}
          </Text>
        </View>

        {/* Mapa Simples - Placeholder */}
        <View className="px-4 pt-6">
          <Text variant="h2" className="text-lg font-semibold mb-3">
            Location
          </Text>
          <Card padding="none" className="h-40 overflow-hidden">
            <View className="flex-1 items-center justify-center bg-surface">
              <Ionicons name="map-outline" size={48} color={colorValues.textMuted} />
              <Text variant="body" className="text-textMuted mt-2">
                {accommodation.areaHint}
              </Text>
            </View>
          </Card>
        </View>

        {/* Comodidades */}
        <View className="px-4 pt-6">
          <Text variant="h2" className="text-lg font-semibold mb-3">
            Amenities
          </Text>
          <Card padding="md">
            <View className="gap-3">
              {accommodation.amenities.map((amenity, index) => (
                <View key={index} className="flex-row items-center gap-3">
                  <Ionicons name="checkmark-circle" size={20} color={colorValues.primary[500]} />
                  <Text variant="body" className="text-textPrimary">
                    {amenity}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Regras */}
        <View className="px-4 pt-6">
          <Text variant="h2" className="text-lg font-semibold mb-3">
            House Rules
          </Text>
          <Card padding="md">
            <View className="gap-3">
              {accommodation.rules.map((rule, index) => (
                <View key={index} className="flex-row items-start gap-3">
                  <Ionicons name="alert-circle-outline" size={20} color={colorValues.textSecondary} />
                  <Text variant="body" className="text-textSecondary flex-1">
                    {rule}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Avaliações */}
        <View className="px-4 pt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text variant="h2" className="text-lg font-semibold">
              Reviews
            </Text>
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={18} color={colorValues.warning} />
              <Text variant="body" className="font-semibold">
                {accommodation.rating.overall}
              </Text>
              <Text variant="body" className="text-textSecondary">
                ({accommodation.rating.count} reviews)
              </Text>
            </View>
          </View>

          {/* Dimensões do Rating */}
          <Card padding="md" className="mb-4">
            <View className="gap-3">
              {Object.entries(accommodation.rating.dimensions).map(([key, value]) => (
                <View key={key}>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text variant="body" className="text-textSecondary capitalize">
                      {key}
                    </Text>
                    <Text variant="body" className="font-medium">
                      {value}
                    </Text>
                  </View>
                  <View className="h-2 bg-surface rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${(value / 5) * 100}%` }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {/* Lista de Reviews */}
          <View className="gap-4">
            {accommodation.reviews.map((review) => (
              <Card key={review.id} padding="md">
                <View className="gap-3">
                  {/* Header do Review */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <Image
                        source={{ uri: review.userAvatar }}
                        className="w-10 h-10 rounded-full"
                      />
                      <View>
                        <Text variant="body" className="font-semibold">
                          {review.userName}
                        </Text>
                        <Text variant="caption" className="text-textMuted">
                          {new Date(review.date).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center gap-1">
                      <Ionicons name="star" size={14} color={colorValues.warning} />
                      <Text variant="caption" className="font-medium">
                        {review.rating}
                      </Text>
                    </View>
                  </View>

                  {/* Comentário */}
                  <Text variant="body" className="text-textSecondary leading-relaxed">
                    {review.comment}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Bom para quem? */}
        <View className="px-4 pt-6 pb-4">
          <Text variant="h2" className="text-lg font-semibold mb-3">
            Good for
          </Text>
          <Card padding="md" className="bg-primary-50 border border-primary-500">
            <View className="flex-row gap-3">
              <Ionicons name="information-circle" size={24} color={colorValues.primary[500]} />
              <Text variant="body" className="text-textPrimary flex-1 leading-relaxed">
                {accommodation.goodFor}
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* CTA Fixo */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-4 shadow-lg">
        <View className="flex-row items-center justify-between gap-4">
          <View className="flex-1">
            <Text variant="caption" className="text-textSecondary mb-1">
              Starting from
            </Text>
            <Text variant="h3" className="text-xl font-bold text-primary-500">
              {accommodation.price}
              <Text variant="body" className="text-textSecondary font-normal">
                /{accommodation.priceUnit}
              </Text>
            </Text>
          </View>

          <Button
            variant="primary"
            size="lg"
            onPress={handleInterestPress}
            className="flex-1"
          >
            Tenho interesse
          </Button>
        </View>
      </View>
    </View>
  );
}
