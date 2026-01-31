import React from 'react';
import { View, ImageSourcePropType } from 'react-native';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';
import { Banner } from '../ui/Banner';

interface HeroCardProps {
  image: string | ImageSourcePropType;
  title: string;
  subtitle: string;
  ctaText: string;
  onCtaPress: () => void;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  image,
  title,
  subtitle,
  ctaText,
  onCtaPress,
}) => {
  return (
    <Banner image={image} imageHeight={160}>
      <View className="p-5 gap-3">
        {/* Título e Subtítulo */}
        <View className="gap-1.5">
          <Text variant="h3" className="text-lg leading-snug">
            {title}
          </Text>
          
          <Text variant="bodySecondary" className="text-sm leading-relaxed">
            {subtitle}
          </Text>
        </View>

        {/* CTA Button */}
        <Button variant="primary" onPress={onCtaPress}>
          {ctaText}
        </Button>
      </View>
    </Banner>
  );
};
