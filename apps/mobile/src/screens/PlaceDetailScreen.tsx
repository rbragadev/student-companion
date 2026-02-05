import React from 'react';
import { View, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, Card, Button } from '../components';
import { usePlaceById } from '../hooks/api/usePlaces';
import { useReviewsByReviewable } from '../hooks/api/useReviews';
import { colorValues } from '../utils/design-tokens';
import { RootStackParamList, StackRoutes } from '../types/navigation';

const { width } = Dimensions.get('window');

type PlaceDetailRouteProp = RouteProp<RootStackParamList, typeof StackRoutes.PLACE_DETAIL>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CATEGORY_LABELS: Record<string, string> = {
  bars: 'Bar',
  restaurants: 'Restaurant',
  cafes: 'Café',
  parks: 'Park',
  museums: 'Museum',
  shopping: 'Shopping',
  nightlife: 'Nightlife',
  sports: 'Sports',
};

export default function PlaceDetailScreen() {
  const route = useRoute<PlaceDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { placeId } = route.params;

  const { data: place, isLoading } = usePlaceById(placeId);
  const { data: reviews, isLoading: isLoadingReviews } = useReviewsByReviewable('PLACE', placeId);

  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [isSaved, setIsSaved] = React.useState(false);

  if (isLoading || !place) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text variant="body" className="text-textSecondary">
          Loading...
        </Text>
      </View>
    );
  }

  const handleSave = () => {
    setIsSaved(!isSaved);
    console.log('Save place:', place.id);
  };

  const handleGetDeal = () => {
    console.log('Get deal:', place.dealDescription);
  };

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      bars: 'beer-outline',
      restaurants: 'restaurant-outline',
      cafes: 'cafe-outline',
      parks: 'leaf-outline',
      museums: 'business-outline',
      shopping: 'cart-outline',
      nightlife: 'musical-notes-outline',
      sports: 'football-outline',
    };
    return icons[category] || 'location-outline';
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Gallery */}
        <View className="relative">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {place.images.map((image) => (
              <Image
                key={image}
                source={{ uri: image }}
                style={{ width, height: 300 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Page Indicators */}
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
            {place.images.map((image, index) => (
              <View
                key={`${place.id}-${index}`}
                className={`w-2 h-2 rounded-full ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </View>

          {/* Header Buttons */}
          <View className="absolute top-12 left-0 right-0 flex-row justify-between px-4">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              className="bg-white/90 p-2 rounded-full"
            >
              <Ionicons name="arrow-back" size={24} color={colorValues.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => console.log('Share')}
              activeOpacity={0.7}
              className="bg-white/90 p-2 rounded-full"
            >
              <Ionicons name="share-outline" size={24} color={colorValues.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Badges */}
          {(place.isStudentFavorite || place.hasDeal) && (
            <View className="absolute top-72 left-4 flex-row gap-2">
              {place.isStudentFavorite && (
                <View className="bg-primary-500 px-3 py-1 rounded-full">
                  <Text variant="caption" className="text-white font-semibold text-xs">
                    ⭐ Student favorite
                  </Text>
                </View>
              )}
              {place.hasDeal && (
                <View className="bg-success px-3 py-1 rounded-full">
                  <Text variant="caption" className="text-white font-semibold text-xs">
                    🎉 Deal available
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Content */}
        <View className="px-4 pt-4 pb-24 gap-4">
          {/* Name + Rating */}
          <View className="gap-2">
            <Text variant="h1" className="text-2xl font-bold">
              {place.name}
            </Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={18} color={colorValues.warning} />
                <Text variant="body" className="font-semibold text-lg">
                  {Number(place.rating).toFixed(1)}
                </Text>
                <Text variant="body" className="text-textMuted">
                  ({place.ratingCount} reviews)
                </Text>
              </View>
              {place.priceRange && (
                <>
                  <Text variant="body" className="text-textMuted">
                    •
                  </Text>
                  <Text variant="body" className="font-semibold">
                    {place.priceRange}
                  </Text>
                </>
              )}
            </View>
          </View>

          {/* Category + Neighborhood */}
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-2">
              <Ionicons
                name={getCategoryIcon(place.category)}
                size={20}
                color={colorValues.primary[500]}
              />
              <Text variant="body" className="text-textSecondary">
                {CATEGORY_LABELS[place.category] || place.category}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="location-outline" size={20} color={colorValues.primary[500]} />
              <Text variant="body" className="text-textSecondary">
                {place.location}
              </Text>
            </View>
          </View>

          {/* Description */}
          <View className="gap-2">
            <Text variant="h2" className="text-lg font-semibold">
              About
            </Text>
            <Text variant="body" className="text-textSecondary leading-relaxed">
              {place.description}
            </Text>
          </View>

          {/* Contact Info */}
          <Card>
            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <Ionicons name="location" size={20} color={colorValues.primary[500]} />
                <Text variant="body" className="flex-1">
                  {place.address}
                </Text>
              </View>
              {place.phone && (
                <>
                  <View className="h-px bg-border" />
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="call" size={20} color={colorValues.primary[500]} />
                    <Text variant="body" className="flex-1">
                      {place.phone}
                    </Text>
                  </View>
                </>
              )}
              {place.website && (
                <>
                  <View className="h-px bg-border" />
                  <View className="flex-row items-center gap-3">
                    <Ionicons name="globe" size={20} color={colorValues.primary[500]} />
                    <Text variant="body" className="flex-1">
                      {place.website}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </Card>

          {/* Hours */}
          {place.hours && (
            <View className="gap-2">
              <Text variant="h2" className="text-lg font-semibold">
                Opening Hours
              </Text>
              <Card>
                <View className="gap-2">
                  {Object.entries(place.hours).map(([day, hours]) => (
                    <View key={day} className="flex-row items-center justify-between">
                      <Text variant="body" className="text-textSecondary capitalize">
                        {day}
                      </Text>
                      <Text variant="body" className="font-medium">
                        {hours}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            </View>
          )}

          {/* Amenities */}
          {place.amenities.length > 0 && (
            <View className="gap-2">
              <Text variant="h2" className="text-lg font-semibold">
                Amenities
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {place.amenities.map((amenity) => (
                  <View key={amenity} className="bg-primary-50 px-3 py-2 rounded-full">
                    <Text variant="caption" className="text-primary-700 font-medium">
                      {amenity}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Offer */}
          {place.hasDeal && place.dealDescription && (
            <Card className="bg-success/10 border-success">
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="gift" size={24} color={colorValues.success} />
                  <Text variant="h3" className="font-semibold text-success">
                    Special Offer
                  </Text>
                </View>
                <Text variant="body" className="text-textSecondary">
                  {place.dealDescription}
                </Text>
              </View>
            </Card>
          )}

          {/* Reviews */}
          <View className="gap-3">
            <Text variant="h2" className="text-lg font-semibold">
              Reviews ({place.ratingCount})
            </Text>

            {isLoadingReviews && (
              <Card>
                <Text variant="body" className="text-textSecondary text-center">
                  Loading reviews...
                </Text>
              </Card>
            )}
            {!isLoadingReviews && (!reviews || reviews.length === 0) && (
              <Card>
                <Text variant="body" className="text-textSecondary text-center">
                  No reviews yet. Be the first to review!
                </Text>
              </Card>
            )}
            {!isLoadingReviews &&
              reviews &&
              reviews.length > 0 &&
              reviews.map((review) => (
                <Card key={review.id}>
                  <View className="gap-3">
                    {/* Review Header */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        {review.user?.avatar ? (
                          <Image
                            source={{ uri: review.user.avatar }}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
                            <Text variant="body" className="text-primary-600 font-semibold">
                              {(review.user?.firstName || 'A').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View>
                          <Text variant="body" className="font-semibold">
                            {review.user
                              ? `${review.user.firstName} ${review.user.lastName}`
                              : 'Anonymous'}
                          </Text>
                          <Text variant="caption" className="text-textSecondary">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="star" size={16} color={colorValues.warning} />
                        <Text variant="body" className="font-semibold">
                          {Number(review.rating).toFixed(1)}
                        </Text>
                      </View>
                    </View>

                    {/* Review Content */}
                    <Text variant="body" className="text-textSecondary">
                      {review.comment}
                    </Text>

                    {/* Review Actions */}
                    <View className="flex-row items-center gap-4 pt-2 border-t border-border">
                      <TouchableOpacity className="flex-row items-center gap-1">
                        <Ionicons
                          name="thumbs-up-outline"
                          size={16}
                          color={colorValues.textSecondary}
                        />
                        <Text variant="caption" className="text-textSecondary">
                          Helpful
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity className="flex-row items-center gap-1">
                        <Ionicons
                          name="chatbubble-outline"
                          size={16}
                          color={colorValues.textSecondary}
                        />
                        <Text variant="caption" className="text-textSecondary">
                          Reply
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))}
          </View>
        </View>
      </ScrollView>

      {/* Fixed CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-4">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.7}
            className={`p-3 rounded-xl border ${
              isSaved ? 'bg-primary-500 border-primary-500' : 'bg-white border-border'
            }`}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isSaved ? colorValues.textInverse : colorValues.textPrimary}
            />
          </TouchableOpacity>

          {place.hasDeal ? (
            <Button onPress={handleGetDeal} className="flex-1">
              Get Deal
            </Button>
          ) : (
            <Button variant="outline" onPress={() => console.log('Visit')} className="flex-1">
              Visit Website
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}
