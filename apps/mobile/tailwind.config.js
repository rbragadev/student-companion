/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primárias - baseado no design das telas
        primary: {
          50: '#E6F7FF',
          100: '#B3E9FF', 
          200: '#80DBFF',
          300: '#4DCDFF',
          400: '#1ABFFF',
          500: '#00B4D8', // Principal
          600: '#0096B6',
          700: '#007894',
          800: '#005A72',
          900: '#003C50',
        },
        
        // Neutras
        background: '#f2f0f1',
        surface: '#F8F9FA',
        surfaceSecondary: '#F1F3F4',
        border: '#E9ECEF',
        borderLight: '#F1F3F5',
        
        // Textos
        textPrimary: '#212529',
        textSecondary: '#6C757D', 
        textMuted: '#ADB5BD',
        textInverse: '#FFFFFF',
        
        // Acentos
        accent: '#FF6B35',
        success: '#28A745',
        warning: '#FFC107',
        danger: '#DC3545',
        
        // Específicos
        card: '#FFFFFF',
        overlay: 'rgba(0, 0, 0, 0.5)',
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'cardHover': '0 4px 16px rgba(0, 0, 0, 0.15)',
      },
    }
  },
  plugins: [],
}

