import React from 'react';
import { View, ViewProps } from 'react-native';
import { designTokens } from '../../utils/design-tokens';


interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card = ({ 
  variant = 'default',
  padding = 'md',
  children,
  className = '',
  ...props 
}: CardProps) => {
  
  const baseClass = 'bg-card rounded-xl';
  
  const variantClasses = {
    default: 'shadow-card',
    elevated: 'shadow-cardHover',
    outlined: 'border border-border',
  };
  
  const paddingClasses = {
    none: '',
    sm: designTokens.spacing.sm,
    md: designTokens.spacing.md,
    lg: designTokens.spacing.lg,
  };
  
  return (
    <View 
      className={`
        ${baseClass}
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${className}
      `}
      {...props}
    >
      {children}
    </View>
  );
};