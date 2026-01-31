import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Text } from '../components';
import { PlaceCard } from '../components/features';
import { usePlaces } from '../services/mockData';
import type { PlaceCategory } from '../services/mockData';
import { colorValues } from '../utils/design-tokens';
import { RootStackParamList, StackRoutes } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORIES: { key: PlaceCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'bars', label: 'Bars', icon: 'beer-outline' },
  { key: 'restaurants', label: 'Restaurants', icon: 'restaurant-outline' },
  { key: 'cafes', label: 'Cafés', icon: 'cafe-outline' },
  { key: 'parks', label: 'Parks', icon: 'leaf-outline' },
  { key: 'museums', label: 'Museums', icon: 'business-outline' },
  { key: 'shopping', label: 'Shopping', icon: 'cart-outline' },
  { key: 'nightlife', label: 'Nightlife', icon: 'musical-notes-outline' },
  { key: 'sports', label: 'Sports', icon: 'football-outline' },
];

export default function PlacesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { places, loading } = usePlaces();
  const [selectedCategory, setSelectedCategory] = React.useState<PlaceCategory | 'all'>('all');

  const filteredPlaces = React.useMemo(() => {
    if (selectedCategory === 'all') {
      return places;
    }
    return places.filter(place => place.category === selectedCategory);
  }, [places, selectedCategory]);

  const handlePlacePress = (id: string) => {
    console.log('Navigate to place detail:', id);
    // TODO: Implementar navegação
    // navigation.navigate(StackRoutes.PLACE_DETAIL, { placeId: id });
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
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center justify-between">
          <Text variant="h1" className="text-2xl font-bold">
            Explore Vancouver
          </Text>

          <TouchableOpacity
            onPress={() => console.log('Notifications')}
            activeOpacity={0.7}
            className="p-2"
          >
            <Ionicons name="notifications-outline" size={24} color={colorValues.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories */}
      <View className="px-4 pb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {/* All */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSelectedCategory('all')}
            className={`flex-row items-center gap-2 px-4 py-2 rounded-full border ${
              selectedCategory === 'all'
                ? 'bg-primary-500 border-primary-500'
                : 'bg-white border-border'
            }`}
          >
            <Ionicons
              name="apps-outline"
              size={18}
              color={selectedCategory === 'all' ? colorValues.textInverse : colorValues.textSecondary}
            />
            <Text
              variant="body"
              className={`text-sm font-medium ${
                selectedCategory === 'all' ? 'text-white' : 'text-textSecondary'
              }`}
            >
              All
            </Text>
          </TouchableOpacity>

          {/* Category Chips */}
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.key}
              activeOpacity={0.7}
              onPress={() => setSelectedCategory(category.key)}
              className={`flex-row items-center gap-2 px-4 py-2 rounded-full border ${
                selectedCategory === category.key
                  ? 'bg-primary-500 border-primary-500'
                  : 'bg-white border-border'
              }`}
            >
              <Ionicons
                name={category.icon}
                size={18}
                color={selectedCategory === category.key ? colorValues.textInverse : colorValues.textSecondary}
              />
              <Text
                variant="body"
                className={`text-sm font-medium ${
                  selectedCategory === category.key ? 'text-white' : 'text-textSecondary'
                }`}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      <View className="px-4 pb-2">
        <Text variant="body" className="text-textSecondary">
          {filteredPlaces.length} {filteredPlaces.length === 1 ? 'place' : 'places'} found
        </Text>
      </View>

      {/* Places List */}
      <View className="px-4 pb-4">
        {filteredPlaces.length === 0 ? (
          <View className="py-12 items-center">
            <Ionicons name="location-outline" size={48} color={colorValues.textMuted} />
            <Text variant="body" className="text-textMuted mt-4 text-center">
              No places found in this category.
            </Text>
          </View>
        ) : (
          filteredPlaces.map((place) => (
            <PlaceCard
              key={place.id}
              id={place.id}
              name={place.name}
              image={place.image}
              rating={place.rating}
              ratingCount={place.ratingCount}
              neighborhood={place.neighborhood}
              priceRange={place.priceRange}
              isStudentFavorite={place.isStudentFavorite}
              hasDeal={place.hasDeal}
              dealDescription={place.dealDescription}
              onPress={() => handlePlacePress(place.id)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}
