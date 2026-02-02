import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Card } from '../ui/Card';
import { colorValues } from '../../utils/design-tokens';

interface AccommodationListCardProps {
  id: string;
  title: string;
  image: string;
  accommodationType: 'Homestay' | 'Shared' | 'Studio' | 'Apartment';
  location: string;
  areaHint: string;
  price: string;
  priceUnit: string;
  rating: number;
  ratingCount: number;
  isPartner?: boolean;
  badge?: string;
  onPress: () => void;
}

export const AccommodationListCard: React.FC<AccommodationListCardProps> = ({
  title,
  image,
  accommodationType,
  location,
  areaHint,
  price,
  priceUnit,
  rating,
  ratingCount,
  isPartner = false,
  badge,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="mb-4"
    >
      <Card padding="none" variant="default" className="flex-row overflow-hidden">
        {/* Imagem */}
        <View className="relative w-32 h-36">
          <Image
            source={{ uri: image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Conteúdo */}
        <View className="flex-1 p-3 gap-1.5">
          {/* Título e Badge Parceiro */}
          <View className="flex-row items-start justify-between gap-2">
            <Text variant="h3" className="text-sm font-semibold flex-1" numberOfLines={1}>
              {title}
            </Text>
            {isPartner && (
              <View className="bg-primary-50 px-2 py-0.5 rounded">
                <Text variant="caption" className="text-primary-500 font-medium text-xs">
                  Parceiro
                </Text>
              </View>
            )}
          </View>

          {/* Tipo */}
          <Text variant="caption" className="text-textSecondary">
            {accommodationType}
          </Text>

          {/* Localização */}
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-outline" size={12} color={colorValues.textMuted} />
            <Text variant="caption" className="text-textMuted text-xs" numberOfLines={1}>
              {location} • {areaHint}
            </Text>
          </View>

          {/* Badge opcional */}
          {badge && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="checkmark-circle" size={12} color={colorValues.primary[500]} />
              <Text variant="caption" className="text-primary-500 font-medium text-xs" numberOfLines={1}>
                {badge}
              </Text>
            </View>
          )}

          {/* Footer - Preço e Rating */}
          <View className="flex-row items-center justify-between mt-auto">
            <View className="flex-row items-baseline gap-1">
              <Text variant="body" className="font-bold text-textPrimary text-sm">
                {price}
              </Text>
              <Text variant="caption" className="text-textSecondary text-xs">
                /{priceUnit}
              </Text>
            </View>

            <View className="flex-row items-center gap-1">
              <Ionicons name="star" size={12} color={colorValues.warning} />
              <Text variant="caption" className="text-textPrimary font-medium text-xs">
                {rating.toFixed(1)}
              </Text>
              <Text variant="caption" className="text-textMuted text-xs">
                ({ratingCount})
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
