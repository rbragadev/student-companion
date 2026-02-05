import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { colorValues } from '../../utils/design-tokens';

interface RecommendationCardProps {
  id: string;
  type: 'accommodation' | 'course' | 'school' | 'place';
  title: string;
  subtitle?: string;
  image: string;
  badge?: string;
  location?: string;
  price?: string;
  priceUnit?: string;
  rating?: number;
  score?: number;
  features?: string[];
  distance?: string;
  onPress: () => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  type,
  title,
  subtitle,
  image,
  badge,
  location,
  price,
  priceUnit,
  rating,
  score,
  features,
  distance,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="bg-card rounded-xl overflow-hidden shadow-card w-72"
    >
      {/* Imagem */}
      <View className="relative w-full h-40">
        <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />

        {/* Badge */}
        {badge && (
          <View className="absolute top-3 left-3">
            <View className="bg-white px-2.5 py-1.5 rounded-full flex-row items-center gap-1.5">
              <Ionicons name="checkmark-circle" size={14} color={colorValues.primary[500]} />
              <Text variant="caption" className="text-textPrimary font-medium">
                {badge}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Conteúdo */}
      <View className="p-4 gap-2">
        {/* Título e Rating/Score */}
        <View className="gap-1">
          <View className="flex-row items-start gap-2">
            <Text variant="h3" className="text-base font-semibold flex-1">
              {title}
            </Text>
            {/* Rating e Score alinhados verticalmente à direita */}
            <View className="gap-1 items-end">
              {rating && rating > 0 && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="star" size={16} color="#FFC107" />
                  <Text variant="caption" className="text-textPrimary font-medium">
                    {typeof rating === 'number' ? rating.toFixed(1) : '0.0'}
                  </Text>
                </View>
              )}
              {score && (
                <View className="flex-row items-center gap-1">
                  <Ionicons name="trending-up" size={14} color={colorValues.primary[500]} />
                  <Text variant="caption" className="text-primary-500 font-semibold">
                    {score.toFixed(0)}%
                  </Text>
                </View>
              )}
            </View>
          </View>

          {subtitle && (
            <Text
              variant="caption"
              className="text-textSecondary"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          )}

          {location && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="location-outline" size={14} color="#6C757D" />
              <Text variant="caption" className="text-textSecondary">
                {location}
              </Text>
            </View>
          )}
        </View>

        {/* Footer - Preço, Distância*/}
        <View className="flex-row items-center justify-between pt-1">
          {price && (
            <Text variant="body" className="font-semibold text-textPrimary">
              {price}
              {priceUnit && (
                <Text variant="caption" className="text-textSecondary">
                  /{priceUnit}
                </Text>
              )}
            </Text>
          )}

          {distance && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="school-outline" size={14} color="#6C757D" />
              <Text variant="caption" className="text-textSecondary">
                {distance}
              </Text>
            </View>
          )}
        </View>
        {/* Footer - features*/}
        {features && features.length > 0 && (
          <View className="flex-row items-center gap-1">
            {features.map((feature, index) => (
              <Text key={index} variant="caption" className="text-textMuted">
                {feature}
              </Text>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
