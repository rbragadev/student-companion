import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Text } from '../ui/Text';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { CopilotRecommendation } from '../../services/mockData';

interface CopilotRecommendationCardProps {
  recommendation: CopilotRecommendation;
  onPress: () => void;
  onSelectOption: () => void;
}

export const CopilotRecommendationCard: React.FC<CopilotRecommendationCardProps> = ({
  recommendation,
  onPress,
  onSelectOption,
}) => {
  return (
    <Card className="overflow-hidden">
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Image
          source={{ uri: recommendation.image }}
          className="w-full h-40"
          resizeMode="cover"
        />
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text variant="heading" className="flex-1 mr-2">
              {recommendation.title}
            </Text>
            {recommendation.rating && (
              <View className="flex-row items-center">
                <Text variant="body" className="text-warning-600 mr-1">
                  ⭐
                </Text>
                <Text variant="caption" className="text-neutral-600">
                  {recommendation.rating}
                </Text>
              </View>
            )}
          </View>

          <Text variant="body" className="text-neutral-600 mb-3">
            {recommendation.subtitle}
          </Text>

          {recommendation.price && (
            <View className="mb-3">
              <Text variant="caption" className="text-primary-600 font-semibold">
                {recommendation.price}
              </Text>
            </View>
          )}

          {recommendation.highlights.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-4">
              {recommendation.highlights.map((highlight) => (
                <View
                  key={highlight}
                  className="bg-primary-50 px-3 py-1 rounded-full"
                >
                  <Text variant="caption" className="text-primary-700">
                    {highlight}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Button
            variant="primary"
            onPress={onSelectOption}
          >
            Quero essa opção
          </Button>
        </View>
      </TouchableOpacity>
    </Card>
  );
};
