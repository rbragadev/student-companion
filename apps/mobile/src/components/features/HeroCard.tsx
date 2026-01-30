import React from 'react';
import { View, Image, TouchableOpacity, ImageSourcePropType } from 'react-native';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';

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
  const imageSource = typeof image === 'string' ? { uri: image } : image;

  return (
    <View className="bg-card rounded-2xl overflow-hidden shadow-card">
      {/* Imagem Hero */}
      <View className="w-full h-40 bg-surface">
        <Image
          source={imageSource}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      {/* Conteúdo */}
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
    </View>
  );
};
