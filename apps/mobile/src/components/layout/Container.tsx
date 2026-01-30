import React from 'react';
import { View, ViewProps } from 'react-native';
import { designTokens } from '../../utils/design-tokens';

interface ContainerProps extends ViewProps {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export const Container = ({ 
  padding = 'md',
  gap = 'md',
  children,
  className = '',
  ...props 
}: ContainerProps) => {
  
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
  
  return (
    <View 
      className={`
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