import React from 'react';
import { View, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, Card, Button } from '../components';
import { getPlaceDetail } from '../services/mockData';
import type { PlaceDetail } from '../services/mockData';
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

  const [place, setPlace] = React.useState<PlaceDetail | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [isSaved, setIsSaved] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);

  React.useEffect(() => {
    getPlaceDetail(placeId).then(data => {
      setPlace(data);
      setLoading(false);
    });
  }, [placeId]);

  if (loading || !place) {
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
    // TODO: Implementar lógica de cupom/deal
  };

  const handleReply = (reviewId: string) => {
    setReplyingTo(replyingTo === reviewId ? null : reviewId);
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
            {place.images.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={{ width, height: 300 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Page Indicators */}
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
            {place.images.map((_, index) => (
              <View
                key={index}
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
                  {place.rating.toFixed(1)}
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
              <Ionicons name={getCategoryIcon(place.category)} size={20} color={colorValues.primary[500]} />
              <Text variant="body" className="text-textSecondary">
                {CATEGORY_LABELS[place.category] || place.category}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Ionicons name="location-outline" size={20} color={colorValues.primary[500]} />
              <Text variant="body" className="text-textSecondary">
                {place.neighborhood}
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

          {/* Amenities */}
          {place.amenities.length > 0 && (
            <View className="gap-2">
              <Text variant="h2" className="text-lg font-semibold">
                Amenities
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {place.amenities.map((amenity, index) => (
                  <View key={index} className="bg-primary-50 px-3 py-2 rounded-full">
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
          {place.reviews.length > 0 && (
            <View className="gap-3">
              <Text variant="h2" className="text-lg font-semibold">
                Reviews ({place.ratingCount})
              </Text>

              {place.reviews.map((review) => (
                <Card key={review.id}>
                  <View className="gap-3">
                    {/* Review Header */}
                    <View className="flex-row items-center gap-3">
                      <Image
                        source={{ uri: review.userAvatar }}
                        className="w-10 h-10 rounded-full"
                      />
                      <View className="flex-1">
                        <Text variant="body" className="font-semibold">
                          {review.userName}
                        </Text>
                        <Text variant="caption" className="text-textMuted">
                          {review.date}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="star" size={14} color={colorValues.warning} />
                        <Text variant="body" className="font-medium">
                          {review.rating.toFixed(1)}
                        </Text>
                      </View>
                    </View>

                    {/* Review Comment */}
                    <Text variant="body" className="text-textSecondary leading-relaxed">
                      {review.comment}
                    </Text>

                    {/* Reply Button */}
                    <TouchableOpacity
                      onPress={() => handleReply(review.id)}
                      activeOpacity={0.7}
                      className="flex-row items-center gap-1"
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={colorValues.primary[500]} />
                      <Text variant="caption" className="text-primary-500 font-medium">
                        Reply ({review.replies?.length || 0})
                      </Text>
                    </TouchableOpacity>

                    {/* Replies */}
                    {review.replies && review.replies.length > 0 && replyingTo === review.id && (
                      <View className="ml-4 gap-3 pt-2 border-l-2 border-border pl-3">
                        {review.replies.map((reply) => (
                          <View key={reply.id} className="gap-2">
                            <View className="flex-row items-center gap-2">
                              <Image
                                source={{ uri: reply.userAvatar }}
                                className="w-8 h-8 rounded-full"
                              />
                              <View className="flex-1">
                                <Text variant="caption" className="font-semibold">
                                  {reply.userName}
                                </Text>
                                <Text variant="caption" className="text-textMuted text-xs">
                                  {reply.date}
                                </Text>
                              </View>
                            </View>
                            <Text variant="caption" className="text-textSecondary">
                              {reply.comment}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </Card>
              ))}
            </View>
          )}
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
