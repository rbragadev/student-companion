import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { designTokens } from '../../utils/design-tokens';


interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySecondary' | 'caption' | 'button' | 'tab';
  color?: 'primary' | 'secondary' | 'muted' | 'inverse' | 'accent' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}

export const Text = ({ 
  variant = 'body',
  color,
  children,
  className = '',
  ...props 
}: TextProps) => {
  
  const variantClass = designTokens.typography[variant];
  
  const colorClasses = {
    primary: 'text-textPrimary',
    secondary: 'text-textSecondary', 
    muted: 'text-textMuted',
    inverse: 'text-textInverse',
    accent: 'text-accent',
    success: 'text-success',
    warning: 'text-warning', 
    danger: 'text-danger',
  };
  
  const colorClass = color ? colorClasses[color] : '';
  
  return (
    <RNText 
      className={`${variantClass} ${colorClass} ${className}`}
      {...props}
    >
      {children}
    </RNText>
  );
};