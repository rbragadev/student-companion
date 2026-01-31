// Valores HEX das cores - para uso em componentes nativos (Ionicons, StatusBar, etc)
export const colorValues = {
  // Primary palette
  primary: {
    50: '#E6F7FF', // Azul muito claro
    100: '#B3E9FF', // Azul claro
    200: '#80DBFF', // Azul claro médio
    300: '#4DCDFF', // Azul médio
    400: '#1ABFFF', // Azul médio forte
    500: '#00B4D8', // ★ Azul principal
    600: '#0096B6', // Azul escuro
    700: '#007894', // Azul mais escuro
    800: '#005A72', // Azul muito escuro
    900: '#003C50', // Azul quase preto
  },
  // Neutras
  background: '#f2f0f1', // Cinza muito claro (fundo)
  surface: '#F8F9FA', // Branco sujo (cards)
  surfaceSecondary: '#F1F3F4', // Cinza claro (secundário)
  border: '#E9ECEF', // Cinza borda
  borderLight: '#F1F3F5', // Cinza borda clara
  // Textos
  textPrimary: '#212529', // Preto suave (principal)
  textSecondary: '#6C757D', // Cinza médio (secundário)
  textMuted: '#ADB5BD', // Cinza claro (desativado)
  textInverse: '#FFFFFF', // Branco
  // Acentos
  accent: '#FF6B35', // Laranja
  success: '#28A745', // Verde
  warning: '#FFC107', // Amarelo
  danger: '#DC3545', // Vermelho
  // Específicos
  card: '#FFFFFF', // Branco puro
  overlay: 'rgba(0, 0, 0, 0.5)', // Preto 50% transparente
} as const;

// Classes Tailwind das cores - para uso com NativeWind
export const colors = {
  primary: {
    50: 'bg-primary-50',
    100: 'bg-primary-100',
    200: 'bg-primary-200',
    300: 'bg-primary-300',
    400: 'bg-primary-400',
    500: 'bg-primary-500',
    600: 'bg-primary-600',
    700: 'bg-primary-700',
    800: 'bg-primary-800',
    900: 'bg-primary-900',
  },
  background: 'bg-background',
  surface: 'bg-surface',
  surfaceSecondary: 'bg-surfaceSecondary',
  border: 'border-border',
  card: 'bg-card',
} as const;

export const textColors = {
  primary: 'text-textPrimary',
  secondary: 'text-textSecondary',
  muted: 'text-textMuted',
  inverse: 'text-textInverse',
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
} as const;

export const bgColors = {
  primary: 'bg-primary-500',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  surface: 'bg-surface',
  card: 'bg-card',
} as const;

// Spacing
export const spacing = {
  xs: 'gap-2',
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
} as const;

export const margin = {
  xs: 'mt-2',
  sm: 'mt-3',
  md: 'mt-4',
  lg: 'mt-6',
  xl: 'mt-8',
} as const;

export const padding = {
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
} as const;

// Legacy designTokens para componentes existentes
export const designTokens = {
  // Colors
  colors,
  textColors,
  bgColors,
  
  // Spacing
  spacing: padding,
  gap: spacing,
  margin,
  
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