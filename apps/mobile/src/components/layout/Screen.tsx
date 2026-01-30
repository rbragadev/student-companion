import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { designTokens } from '../../utils/design-tokens';

interface ScreenProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  safeArea?: boolean;
  backgroundColor?: string;
}

export const Screen = ({ 
  children,
  padding = 'md',
  gap = 'md',
  className = '',
  safeArea = true,
  backgroundColor = 'bg-background',
  ...props 
}: ScreenProps) => {
  
  const paddingClasses = {
    none: '',
    sm: designTokens.spacing.sm,
    md: designTokens.spacing.md,
    lg: designTokens.spacing.lg,
    xl: designTokens.spacing.xl,
  };
  
  const gapClasses = {
    none: '',
    xs: designTokens.gap.xs,
    sm: designTokens.gap.sm,
    md: designTokens.gap.md,
    lg: designTokens.gap.lg,
    xl: designTokens.gap.xl,
  };
  
  if (safeArea) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View 
          className={`
            flex-1
            ${backgroundColor}
            ${paddingClasses[padding]}
            ${gapClasses[gap]}
            ${className}
          `}
          {...props}
        >
          {children}
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <View 
      className={`
        flex-1
        ${backgroundColor}
        ${paddingClasses[padding]}
        ${gapClasses[gap]}
        ${className}
      `}
      {...props}
    >
      {children}
    </View>
  );
};