// Design System Tokens
export const designTokens = {
  // Spacing
  spacing: {
    xs: 'p-2',      // 8px
    sm: 'p-3',      // 12px  
    md: 'p-4',      // 16px
    lg: 'p-6',      // 24px
    xl: 'p-8',      // 32px
  },
  
  // Margins
  margin: {
    xs: 'm-2',
    sm: 'm-3', 
    md: 'm-4',
    lg: 'm-6',
    xl: 'm-8',
  },
  
  // Gaps
  gap: {
    xs: 'gap-2',
    sm: 'gap-3',
    md: 'gap-4', 
    lg: 'gap-6',
    xl: 'gap-8',
  },
  
  // Typography
  typography: {
    h1: 'text-2xl font-bold text-textPrimary leading-tight',
    h2: 'text-xl font-semibold text-textPrimary leading-tight', 
    h3: 'text-lg font-medium text-textPrimary leading-tight',
    body: 'text-base text-textPrimary leading-normal',
    bodySecondary: 'text-sm text-textSecondary leading-normal',
    caption: 'text-xs text-textMuted leading-normal',
    button: 'text-sm font-medium leading-none',
    tab: 'text-xs font-medium leading-none',
  },
  
  // Shadows
  shadow: {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-card',
    lg: 'shadow-cardHover',
  },
  
  // Border radius
  radius: {
    none: 'rounded-none',
    sm: 'rounded-md', 
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full',
  },
  
  // Common combinations
  card: 'bg-card rounded-xl shadow-card',
  button: 'rounded-lg items-center justify-center',
  input: 'rounded-lg border border-border bg-surface',
} as const;

export type DesignTokens = typeof designTokens;