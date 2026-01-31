import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui/Text';
import { colorValues } from '../../utils/design-tokens';

interface SecondaryActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

export const SecondaryAction: React.FC<SecondaryActionProps> = ({
  icon,
  label,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center gap-2 px-4 py-3 bg-surface rounded-lg"
    >
      <Ionicons name={icon} size={18} color={colorValues.primary[500]} />
      <Text variant="body" className="text-textSecondary text-sm">
        {label}
      </Text>
    </TouchableOpacity>
  );
};
