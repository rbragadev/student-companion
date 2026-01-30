import React from 'react';
import { Pressable, Text, PressableProps } from 'react-native';
import { designTokens } from '../../utils/design-tokens';


interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: string;
  disabled?: boolean;
}

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  disabled = false,
  className = '',
  ...props 
}: ButtonProps) => {
  
  const baseClass = designTokens.button;
  
  const variantClasses = {
    primary: 'bg-primary-500 active:bg-primary-600',
    secondary: 'bg-surface border border-border active:bg-surfaceSecondary',
    outline: 'border border-primary-500 active:bg-primary-50',
    ghost: 'active:bg-surfaceSecondary',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-2 min-h-[32px]',
    md: 'px-4 py-3 min-h-[44px]',
    lg: 'px-6 py-4 min-h-[52px]',
  };
  
  const textVariantClasses = {
    primary: 'text-textInverse',
    secondary: 'text-textPrimary', 
    outline: 'text-primary-500',
    ghost: 'text-primary-500',
  };
  
  const disabledClass = disabled ? 'opacity-50' : '';
  
  return (
    <Pressable 
      className={`
        ${baseClass}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabledClass}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      <Text className={`${designTokens.typography.button} ${textVariantClasses[variant]}`}>
        {children}
      </Text>
    </Pressable>
  );
};