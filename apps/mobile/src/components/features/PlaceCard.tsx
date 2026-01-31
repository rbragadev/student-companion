import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { colorValues } from '../../utils/design-tokens';

interface PlaceCardProps {
  id: string;
  name: string;
  image: string;
  rating: number;
  ratingCount: number;
  neighborhood: string;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
  isStudentFavorite?: boolean;
  hasDeal?: boolean;
  dealDescription?: string;
  onPress: () => void;
}

export function PlaceCard({
  name,
  image,
  rating,
  ratingCount,
  neighborhood,
  priceRange,
  isStudentFavorite,
  hasDeal,
  dealDescription,
  onPress,
}: PlaceCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card padding="none" className="mb-4 overflow-hidden">
        {/* Image */}
        <View className="relative h-48">
          <Image
            source={{ uri: image }}
            className="w-full h-full"
            resizeMode="cover"
          />
          
          {/* Badges */}
          <View className="absolute top-3 left-3 right-3 flex-row justify-between items-start">
            <View className="flex-row gap-2">
              {isStudentFavorite && (
                <View className="bg-primary-500 px-3 py-1 rounded-full">
                  <Text variant="caption" className="text-white font-semibold text-xs">
                    ⭐ Student favorite
                  </Text>
                </View>
              )}
              {hasDeal && (
                <View className="bg-success px-3 py-1 rounded-full">
                  <Text variant="caption" className="text-white font-semibold text-xs">
                    🎉 Deal available
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Price Range */}
          {priceRange && (
            <View className="absolute bottom-3 right-3 bg-white/90 px-2 py-1 rounded">
              <Text variant="caption" className="font-semibold">
                {priceRange}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="p-4 gap-2">
          {/* Name */}
          <Text variant="h3" className="text-lg font-semibold">
            {name}
          </Text>

          {/* Neighborhood */}
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-outline" size={16} color={colorValues.textMuted} />
            <Text variant="body" className="text-textMuted">
              {neighborhood}
            </Text>
          </View>

          {/* Rating */}
          <View className="flex-row items-center gap-2">
            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={16} color={colorValues.warning} />
              <Text variant="body" className="font-semibold">
                {rating.toFixed(1)}
              </Text>
              <Text variant="caption" className="text-textMuted">
                ({ratingCount})
              </Text>
            </View>
          </View>

          {/* Deal Description */}
          {hasDeal && dealDescription && (
            <View className="bg-success/10 px-3 py-2 rounded-lg mt-1">
              <Text variant="caption" className="text-success font-medium">
                {dealDescription}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}
