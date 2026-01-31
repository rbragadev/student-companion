import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { designTokens } from '../../utils/design-tokens';

interface ScreenProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  safeArea?: boolean;
  backgroundColor?: string;
  scrollable?: boolean;
}

export const Screen = ({ 
  children,
  padding = 'md',
  gap = 'md',
  className = '',
  safeArea = true,
  backgroundColor = 'bg-background',
  scrollable = true,
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

  const Content = scrollable ? ScrollView : View;
  const contentProps = scrollable ? { showsVerticalScrollIndicator: false } : {};
  
  if (safeArea) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <Content 
          className={`
            flex-1
            ${backgroundColor}
            ${paddingClasses[padding]}
            ${gapClasses[gap]}
            ${className}
          `}
          {...contentProps}
          {...props}
        >
          {children}
        </Content>
      </SafeAreaView>
    );
  }
  
  return (
    <Content 
      className={`
        flex-1
        ${backgroundColor}
        ${paddingClasses[padding]}
        ${gapClasses[gap]}
        ${className}
      `}
      {...contentProps}
      {...props}
    >
      {children}
    </Content>
  );
};