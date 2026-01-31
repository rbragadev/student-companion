import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { colorValues } from '../../utils/design-tokens';

interface CourseCardProps {
  id: string;
  schoolName: string;
  programName: string;
  weeklyHours: number;
  priceCad?: string;
  rating: number;
  ratingCount: number;
  isPartner: boolean;
  badge?: string;
  image: string;
  onPress: () => void;
}

export function CourseCard({
  schoolName,
  programName,
  weeklyHours,
  priceCad,
  rating,
  ratingCount,
  isPartner,
  badge,
  image,
  onPress,
}: CourseCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card padding="none" className="mb-3 overflow-hidden">
        <View className="flex-row">
          {/* Image */}
          <View className="w-28 h-28">
            <Image
              source={{ uri: image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>

          {/* Content */}
          <View className="flex-1 p-3 gap-2">
            {/* School Name */}
            <View className="flex-row items-center justify-between">
              <Text variant="caption" className="text-textSecondary font-medium">
                {schoolName}
              </Text>
              {isPartner && badge && (
                <View className="bg-success/10 px-2 py-1 rounded">
                  <Text variant="caption" className="text-success text-xs font-medium">
                    {badge}
                  </Text>
                </View>
              )}
            </View>

            {/* Program Name */}
            <Text variant="h3" className="text-base font-semibold leading-tight">
              {programName}
            </Text>

            {/* Weekly Hours */}
            <View className="flex-row items-center gap-1">
              <Ionicons name="time-outline" size={14} color={colorValues.textMuted} />
              <Text variant="caption" className="text-textMuted">
                {weeklyHours}h/week
              </Text>
            </View>

            {/* Rating and Price */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={14} color={colorValues.warning} />
                <Text variant="caption" className="text-textPrimary font-medium">
                  {rating.toFixed(1)}
                </Text>
                <Text variant="caption" className="text-textMuted">
                  ({ratingCount})
                </Text>
              </View>

              {priceCad && (
                <View>
                  <Text variant="body" className="text-textPrimary font-semibold">
                    {priceCad}
                    <Text variant="caption" className="text-textMuted font-normal">
                      {' '}/month
                    </Text>
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}
