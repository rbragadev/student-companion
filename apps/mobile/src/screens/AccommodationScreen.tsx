import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen, Text } from '../components';
import { TopTripCard, AccommodationListCard } from '../components/features';
import { useAccommodations } from '../services/mockData';
import { colorValues } from '../utils/design-tokens';
import { RootStackParamList, StackRoutes } from '../types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AccommodationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { topTrips, otherAccommodations, loading } = useAccommodations();
  const [selectedCity, setSelectedCity] = React.useState('Vancouver');

  const handleAccommodationPress = (id: string) => {
    navigation.navigate(StackRoutes.ACCOMMODATION_DETAIL, { accommodationId: id });
  };

  const handleFilterPress = () => {
    console.log('Open filters modal');
    // TODO: Abrir modal de filtros
  };

  const handleFavoritePress = (id: string) => {
    console.log('Toggle favorite:', id);
    // TODO: Toggle favorito
  };

  if (loading) {
    return (
      <Screen safeArea={true}>
        <View className="flex-1 items-center justify-center">
          <Text variant="body" className="text-textSecondary">
            Loading...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea={true} scrollable={true}>
      {/* Header - Location */}
      <View className="px-4 pt-4 pb-3 gap-3">
        <View className="flex-row items-center justify-between">
          <View className="gap-1">
            <Text variant="caption" className="text-textSecondary">
              Location
            </Text>
            <TouchableOpacity
              onPress={() => console.log('Change city')}
              activeOpacity={0.7}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="location" size={20} color={colorValues.textPrimary} />
              <Text variant="h2" className="text-lg font-semibold">
                {selectedCity}, USA
              </Text>
              <Ionicons name="chevron-down" size={16} color={colorValues.warning} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => console.log('Notifications')}
            activeOpacity={0.7}
            className="p-2"
          >
            <Ionicons name="notifications-outline" size={24} color={colorValues.textPrimary} />
            <View className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center gap-2 bg-surface px-4 py-3 rounded-xl">
            <Ionicons name="search-outline" size={20} color={colorValues.textMuted} />
            <Text variant="body" className="text-textMuted flex-1">
              Search
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleFilterPress}
            activeOpacity={0.7}
            className="bg-primary-500 p-3 rounded-xl"
          >
            <Ionicons name="options-outline" size={24} color={colorValues.textInverse} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories - Placeholder para futuro */}
      <View className="px-4 py-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text variant="h2" className="text-lg font-semibold">
            Categories
          </Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text variant="body" className="text-textSecondary text-sm">
              See All
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12 }}
        >
          {['Lakes', 'Sea', 'Mountain', 'Forest'].map((category, index) => (
            <View
              key={category}
              className={`px-4 py-2 rounded-full border ${
                index === 0
                  ? 'bg-primary-500 border-primary-500'
                  : 'bg-white border-border'
              }`}
            >
              <Text
                variant="body"
                className={`text-sm font-medium ${
                  index === 0 ? 'text-white' : 'text-textSecondary'
                }`}
              >
                {category}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Top Trips Section */}
      <View className="py-4">
        <View className="flex-row items-center justify-between px-4 mb-3">
          <Text variant="h2" className="text-lg font-semibold">
            Top Trips
          </Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text variant="body" className="text-textSecondary text-sm">
              See All
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 0 }}
        >
          {topTrips.map((trip) => (
            <TopTripCard
              key={trip.id}
              id={trip.id}
              title={trip.title}
              image={trip.image}
              location={trip.location || ''}
              price={trip.price || ''}
              priceUnit={trip.priceUnit || ''}
              rating={trip.rating || 0}
              onPress={() => handleAccommodationPress(trip.id)}
              onFavoritePress={() => handleFavoritePress(trip.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Other Accommodations */}
      <View className="px-4 pb-4">
        <Text variant="h2" className="text-lg font-semibold mb-3">
          All Accommodations
        </Text>

        {otherAccommodations.map((accommodation) => (
          <AccommodationListCard
            key={accommodation.id}
            id={accommodation.id}
            title={accommodation.title}
            image={accommodation.image}
            accommodationType={accommodation.accommodationType || 'Shared'}
            location={accommodation.location || ''}
            areaHint={accommodation.areaHint || ''}
            price={accommodation.price || ''}
            priceUnit={accommodation.priceUnit || ''}
            rating={accommodation.rating || 0}
            ratingCount={accommodation.ratingCount || 0}
            isPartner={accommodation.isPartner}
            badge={accommodation.badge}
            onPress={() => handleAccommodationPress(accommodation.id)}
          />
        ))}
      </View>
    </Screen>
  );
}