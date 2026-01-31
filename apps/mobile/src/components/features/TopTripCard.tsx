import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { Card } from '../ui/Card';
import { colorValues } from '../../utils/design-tokens';

interface TopTripCardProps {
  id: string;
  title: string;
  image: string;
  location: string;
  price: string;
  priceUnit: string;
  rating: number;
  isFavorite?: boolean;
  onPress: () => void;
  onFavoritePress?: () => void;
}

export const TopTripCard: React.FC<TopTripCardProps> = ({
  title,
  image,
  location,
  price,
  priceUnit,
  rating,
  isFavorite = false,
  onPress,
  onFavoritePress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="mr-4 w-64"
    >
      <Card padding="none" className="overflow-hidden">
        {/* Imagem */}
        <View className="relative w-full h-44">
          <Image
            source={{ uri: image }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Conteúdo */}
        <View className="p-4 gap-2">
          {/* Título e Rating */}
          <View className="flex-row items-start justify-between">
            <Text variant="h3" className="text-base font-semibold flex-1">
              {title}
            </Text>
            <View className="flex-row items-center gap-1 ml-2">
              <Ionicons name="star" size={14} color={colorValues.warning} />
              <Text variant="caption" className="text-textPrimary font-medium">
                {rating}
              </Text>
            </View>
          </View>
          
          {/* Localização */}
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-outline" size={14} color={colorValues.textSecondary} />
            <Text variant="caption" className="text-textSecondary">
              {location}
            </Text>
          </View>

          {/* Footer - Preço e Favorito */}
          <View className="flex-row items-center justify-between pt-1 border-t border-borderLight">
            <View className="flex-row items-baseline gap-1">
              <Text variant="body" className="font-bold text-primary-500">
                {price}
              </Text>
              <Text variant="caption" className="text-textSecondary">
                /{priceUnit}
              </Text>
            </View>

            {onFavoritePress && (
              <TouchableOpacity
                onPress={onFavoritePress}
                activeOpacity={0.7}
                className="p-1"
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isFavorite ? colorValues.danger : colorValues.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
