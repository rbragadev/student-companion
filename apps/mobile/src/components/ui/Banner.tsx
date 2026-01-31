import React from 'react';
import { View, Image, ImageSourcePropType } from 'react-native';
import { Card } from './Card';

interface BannerProps {
  image: string | ImageSourcePropType;
  imageHeight?: number;
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
}

export const Banner: React.FC<BannerProps> = ({
  image,
  imageHeight = 160,
  children,
  variant = 'default',
  className = '',
}) => {
  const imageSource = typeof image === 'string' ? { uri: image } : image;

  return (
    <Card variant={variant} padding="none" className={`overflow-hidden ${className}`}>
      {/* Imagem */}
      <View className="w-full bg-surface" style={{ height: imageHeight }}>
        <Image
          source={imageSource}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      {/* Conteúdo */}
      {children}
    </Card>
  );
};
